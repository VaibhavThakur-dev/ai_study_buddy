import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import Lesson from '@/models/Lesson'
import { generateLesson } from '@/lib/openrouter'

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

    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id }).lean()
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const cached = await Lesson.findOne({ subjectId, userId: session.user.id, topic }).lean()
    if (cached) {
      return NextResponse.json({ success: true, data: { ...cached, _id: cached._id.toString() }, cached: true })
    }

    const result = await generateLesson(topic, subject.name)

    const lesson = await Lesson.create({
      subjectId,
      userId: session.user.id,
      topic,
      content: result.content,
      flashcards: result.flashcards,
    })

    return NextResponse.json({
      success: true,
      data: { ...lesson.toObject(), _id: lesson._id.toString() },
      cached: false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate lesson'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
