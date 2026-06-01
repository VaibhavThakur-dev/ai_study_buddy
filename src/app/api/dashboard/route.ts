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

    const [tests, subjects] = await Promise.all([
      Test.find({ userId: session.user.id }).sort({ takenAt: -1 }).lean(),
      Subject.find({ userId: session.user.id }).lean(),
    ])

    const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]))

    const topicStats = new Map<string, { scores: number[]; subjectName: string }>()
    for (const t of tests) {
      const key = `${t.subjectId}::${t.topic}`
      if (!topicStats.has(key)) {
        topicStats.set(key, {
          scores: [],
          subjectName: subjectMap.get(t.subjectId.toString()) ?? 'Unknown',
        })
      }
      topicStats.get(key)!.scores.push(t.score)
    }

    const weakTopics = Array.from(topicStats.entries())
      .map(([key, { scores, subjectName }]) => ({
        topic: key.split('::')[1],
        subjectName,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        testCount: scores.length,
      }))
      .filter((t) => t.averageScore < 70)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5)

    const uniqueDays = [...new Set(tests.map((t) => new Date(t.takenAt).toDateString()))]
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (uniqueDays.includes(d.toDateString())) streak++
      else if (i > 0) break
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSubjects: subjects.length,
        totalTests: tests.length,
        averageScore:
          tests.length > 0
            ? Math.round(tests.reduce((a, b) => a + b.score, 0) / tests.length)
            : 0,
        streak,
        weakTopics,
        recentTests: tests.slice(0, 5).map((t) => ({
          _id: t._id.toString(),
          topic: t.topic,
          subjectName: subjectMap.get(t.subjectId.toString()) ?? 'Unknown',
          score: t.score,
          takenAt: t.takenAt,
        })),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
