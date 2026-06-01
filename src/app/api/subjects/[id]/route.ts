import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import Lesson from '@/models/Lesson'
import ChatMessage from '@/models/ChatMessage'
import Test from '@/models/Test'

type RouteContext = { params: Promise<{ id: string }> }

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('addTopics'), topics: z.array(z.string().min(1).max(100)) }),
  z.object({ action: z.literal('removeTopic'), topic: z.string() }),
])

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = (await req.json()) as unknown
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    await connectDB()

    let updated
    if (parsed.data.action === 'addTopics') {
      const newTopics = parsed.data.topics.map((t) => t.trim()).filter(Boolean)
      updated = await Subject.findOneAndUpdate(
        { _id: id, userId: session.user.id },
        { $addToSet: { topics: { $each: newTopics } } },
        { new: true }
      ).lean()
    } else {
      updated = await Subject.findOneAndUpdate(
        { _id: id, userId: session.user.id },
        { $pull: { topics: parsed.data.topic } },
        { new: true }
      ).lean()
    }

    if (!updated) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: { topics: updated.topics } })
  } catch {
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()
    const doc = await Subject.findOne({ _id: id, userId: session.user.id }).lean()

    if (!doc) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: {
        _id: doc._id.toString(),
        userId: doc.userId.toString(),
        name: doc.name,
        syllabus: doc.syllabus,
        topics: doc.topics,
        createdAt: doc.createdAt,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()

    const subject = await Subject.findOneAndDelete({ _id: id, userId: session.user.id })
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    await Promise.all([
      Lesson.deleteMany({ subjectId: id }),
      ChatMessage.deleteMany({ subjectId: id }),
      Test.deleteMany({ subjectId: id }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
