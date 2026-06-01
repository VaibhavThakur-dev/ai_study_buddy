import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Test from '@/models/Test'
import Subject from '@/models/Subject'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const tests = await Test.find({ userId: session.user.id })
      .sort({ takenAt: -1 })
      .lean()

    const subjectIds = [...new Set(tests.map((t) => t.subjectId.toString()))]
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean()
    const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]))

    const data = tests.map((t) => ({
      _id: t._id.toString(),
      subjectId: t.subjectId.toString(),
      subjectName: subjectMap.get(t.subjectId.toString()) ?? 'Unknown',
      topic: t.topic,
      score: t.score,
      timeTaken: t.timeTaken,
      takenAt: t.takenAt,
      total: t.questions.length,
    }))

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
