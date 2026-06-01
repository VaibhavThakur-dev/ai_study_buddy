import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Target, Flame, BookOpen } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Test from '@/models/Test'
import Subject from '@/models/Subject'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProgressChart from '@/components/progress-chart'

async function getProgressData(userId: string) {
  await connectDB()
  const [tests, subjects] = await Promise.all([
    Test.find({ userId }).sort({ takenAt: 1 }).lean(),
    Subject.find({ userId }).lean(),
  ])

  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]))

  const chartData = tests.slice(-20).map((t, i) => ({
    label: `#${i + 1}`,
    score: t.score,
  }))

  const topicMap = new Map<string, { scores: number[]; subjectName: string }>()
  for (const t of tests) {
    const key = `${t.subjectId}::${t.topic}`
    if (!topicMap.has(key)) {
      topicMap.set(key, { scores: [], subjectName: subjectMap.get(t.subjectId.toString()) ?? 'Unknown' })
    }
    topicMap.get(key)!.scores.push(t.score)
  }

  const topicStats = Array.from(topicMap.entries()).map(([key, { scores, subjectName }]) => ({
    topic: key.split('::')[1],
    subjectName,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length,
  }))

  const uniqueDays = [...new Set(tests.map((t) => new Date(t.takenAt).toDateString()))]
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (uniqueDays.includes(d.toDateString())) streak++
    else if (i > 0) break
  }

  const avg =
    tests.length > 0 ? Math.round(tests.reduce((a, b) => a + b.score, 0) / tests.length) : 0

  return { chartData, topicStats, streak, totalTests: tests.length, avg }
}

export default async function ProgressPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { chartData, topicStats, streak, totalTests, avg } = await getProgressData(session.user.id)

  const weak = topicStats.filter((t) => t.avg < 70).sort((a, b) => a.avg - b.avg).slice(0, 5)
  const strong = topicStats.filter((t) => t.avg >= 70).sort((a, b) => b.avg - a.avg).slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Progress</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Tests taken', value: totalTests },
            { icon: Trophy, label: 'Average score', value: `${avg}%` },
            { icon: Flame, label: 'Day streak', value: streak },
            { icon: Target, label: 'Topics studied', value: topicStats.length },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="pt-5 pb-4">
                <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Score over last 20 tests</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={chartData} type="line" />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-600 dark:text-red-400">
                Needs improvement (&lt;70%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weak.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weak topics — great work!</p>
              ) : (
                <div className="space-y-2">
                  {weak.map((t) => (
                    <div key={t.topic} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{t.topic}</p>
                        <p className="text-xs text-muted-foreground">{t.subjectName}</p>
                      </div>
                      <Badge variant="destructive">{t.avg}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-green-600 dark:text-green-400">
                Strong topics (≥70%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strong.length === 0 ? (
                <p className="text-sm text-muted-foreground">Take more tests to see strong topics.</p>
              ) : (
                <div className="space-y-2">
                  {strong.map((t) => (
                    <div key={t.topic} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{t.topic}</p>
                        <p className="text-xs text-muted-foreground">{t.subjectName}</p>
                      </div>
                      <Badge className="bg-green-600 hover:bg-green-700">{t.avg}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
