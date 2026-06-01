import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import Lesson from '@/models/Lesson'
import { generateFlashcards } from '@/lib/openrouter'

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

    const cached = await Lesson.findOne({ subjectId, userId: session.user.id, topic }).lean()
    if (cached?.flashcards?.length) {
      return NextResponse.json({ success: true, data: cached.flashcards, cached: true })
    }

    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id }).lean()
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const flashcards = await generateFlashcards(topic, subject.name)
    return NextResponse.json({ success: true, data: flashcards, cached: false })
  } catch {
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 })
  }
}
