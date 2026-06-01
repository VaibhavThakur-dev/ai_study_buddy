import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import Navbar from '@/components/navbar'
import SubjectCard from '@/components/subject-card'
import AddSubjectDialog from '@/components/add-subject-dialog'
import type { ISubject } from '@/types'

async function getUserSubjects(userId: string): Promise<ISubject[]> {
  await connectDB()
  const docs = await Subject.find({ userId }).sort({ createdAt: -1 }).lean()
  return docs.map((d) => ({
    _id: d._id.toString(),
    userId: d.userId.toString(),
    name: d.name,
    syllabus: d.syllabus,
    topics: d.topics,
    createdAt: d.createdAt,
  }))
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const subjects = await getUserSubjects(session.user.id)
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Hello, {firstName}</h1>
            <p className="text-muted-foreground mt-1">
              {subjects.length === 0
                ? 'Add your first subject to start learning'
                : `${subjects.length} ${subjects.length === 1 ? 'subject' : 'subjects'} — ready to study`}
            </p>
          </div>
          <AddSubjectDialog />
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/25" />
            <h2 className="text-xl font-semibold">No subjects yet</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Paste your syllabus and AI will extract topics, generate lessons, and create tests for you.
            </p>
            <AddSubjectDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <SubjectCard key={subject._id} subject={subject} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
