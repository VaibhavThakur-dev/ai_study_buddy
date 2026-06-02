import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import ChatMessage from '@/models/ChatMessage'
import User from '@/models/User'
import { chatWithTutor } from '@/lib/openrouter'

const schema = z.object({
  subjectId: z.string().min(1),
  topic: z.string().min(1),
  message: z.string().min(1).max(1000),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const subjectId = searchParams.get('subjectId')
  const topic = searchParams.get('topic')

  if (!subjectId || !topic) {
    return NextResponse.json({ error: 'subjectId and topic required' }, { status: 400 })
  }

  try {
    await connectDB()
    const messages = await ChatMessage.find({ subjectId, userId: session.user.id, topic })
      .sort({ createdAt: 1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: messages.map((m) => ({ ...m, _id: m._id.toString() })),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { subjectId, topic, message } = parsed.data

    await connectDB()
    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id }).lean()
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const recent = await ChatMessage.find({ subjectId, userId: session.user.id, topic })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const history = recent
      .reverse()
      .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
      .join('\n')

    const userDoc = await User.findById(session.user.id).lean()
    const grade = userDoc?.grade ?? null
    const aiResponse = await chatWithTutor(subject.name, topic, history, message, grade)

    await ChatMessage.insertMany([
      { subjectId, userId: session.user.id, topic, role: 'user', content: message },
      { subjectId, userId: session.user.id, topic, role: 'assistant', content: aiResponse },
    ])

    return NextResponse.json({ success: true, data: { response: aiResponse } })
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
