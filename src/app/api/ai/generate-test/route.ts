import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import Test from '@/models/Test'
import { generateMCQ } from '@/lib/openrouter'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const subjectId = searchParams.get('subjectId')
  const topic = searchParams.get('topic')
  const count = Math.min(Math.max(parseInt(searchParams.get('count') ?? '10'), 3), 20)

  if (!subjectId || !topic) {
    return NextResponse.json({ error: 'subjectId and topic required' }, { status: 400 })
  }

  try {
    await connectDB()
    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id }).lean()
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    // Fetch previous questions for this topic to avoid repeats
    const prevTests = await Test.find({ subjectId, userId: session.user.id, topic })
      .sort({ takenAt: -1 })
      .limit(3)
      .lean()

    const usedQuestions = prevTests
      .flatMap((t) => t.questions.map((q: { question: string }) => q.question))
      .slice(0, count * 2)

    const questions = await generateMCQ(topic, subject.name, count, usedQuestions)
    return NextResponse.json({ success: true, data: { questions } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate test'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
