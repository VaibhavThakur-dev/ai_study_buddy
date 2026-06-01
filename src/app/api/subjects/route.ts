import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import { extractTopics } from '@/lib/openrouter'

const createSchema = z.object({
  name: z.string().min(1, 'Subject name required').max(100),
  syllabus: z.string().min(1, 'Syllabus required'),
  manualTopics: z.array(z.string()).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const docs = await Subject.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean()
    const data = docs.map((d) => ({
      _id: d._id.toString(),
      userId: d.userId.toString(),
      name: d.name,
      syllabus: d.syllabus,
      topics: d.topics,
      createdAt: d.createdAt,
    }))
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as unknown
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { name, syllabus, manualTopics } = parsed.data

    let topics: string[] = []
    if (manualTopics && manualTopics.length > 0) {
      // Manual topics — skip AI entirely
      topics = manualTopics.map((t) => t.trim()).filter(Boolean).slice(0, 30)
    } else {
      try {
        topics = await extractTopics(syllabus, name)
      } catch {
        // AI unavailable — fall back to line-based parsing
        topics = syllabus
          .split(/[\n,;]+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 3 && t.length < 80)
          .slice(0, 15)
      }
    }

    await connectDB()
    const subject = await Subject.create({ userId: session.user.id, name, syllabus, topics })

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: subject._id.toString(),
          userId: subject.userId.toString(),
          name: subject.name,
          syllabus: subject.syllabus,
          topics: subject.topics,
          createdAt: subject.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[subjects/create]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create subject' }, { status: 500 })
  }
}
