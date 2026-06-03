import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Subject from '@/models/Subject'
import AppShell from '@/components/app-shell'
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
    <AppShell>
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-5 sm:mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Hello, {firstName}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {subjects.length === 0
                ? 'Add your first subject to start learning'
                : `${subjects.length} ${subjects.length === 1 ? 'subject' : 'subjects'} — ready to study`}
            </p>
          </div>
          <AddSubjectDialog />
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 sm:py-20 lg:py-24 gap-4 text-center">
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/25" />
            <h2 className="text-lg sm:text-xl font-semibold">No subjects yet</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Paste your syllabus and AI will extract topics, generate lessons, and create tests for you.
            </p>
            <AddSubjectDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {subjects.map((subject) => (
              <SubjectCard key={subject._id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
