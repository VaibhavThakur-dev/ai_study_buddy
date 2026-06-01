import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Test from '@/models/Test'

const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correct: z.number().int().min(0).max(10), // generous — normalized before save
})

const submitSchema = z.object({
  subjectId: z.string().min(1),
  topic: z.string().min(1),
  questions: z.array(questionSchema).min(1),
  userAnswers: z.array(z.number()),
  timeTaken: z.number().min(0),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as unknown
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { subjectId, topic, questions, userAnswers, timeTaken } = parsed.data

    const correct = questions.filter((q, i) => q.correct === userAnswers[i]).length
    const score = Math.round((correct / questions.length) * 100)

    await connectDB()
    const test = await Test.create({
      subjectId,
      userId: session.user.id,
      topic,
      questions,
      userAnswers,
      score,
      timeTaken,
      takenAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      data: { score, correct, total: questions.length, testId: test._id.toString() },
    })
  } catch (err) {
    console.error('[tests/submit]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to submit test' }, { status: 500 })
  }
}
