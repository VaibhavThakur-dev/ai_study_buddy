'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { ISubject } from '@/types'

interface SubjectCardProps {
  subject: ISubject
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const toastId = toast.loading(`Deleting "${subject.name}"…`)

    const res = await fetch(`/api/subjects/${subject._id}`, { method: 'DELETE' })

    if (res.ok) {
      toast.success(`"${subject.name}" deleted`, { id: toastId })
      router.refresh()
    } else {
      toast.error('Failed to delete subject', { id: toastId })
      setDeleting(false)
    }
  }

  const createdDate = new Date(subject.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{subject.name}</CardTitle>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                disabled={deleting}
                aria-label="Delete subject"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{subject.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  This subject and all its lessons, chats, and tests will be permanently deleted.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleDelete()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Badge variant="secondary" className="w-fit text-xs">
          {subject.topics.length} {subject.topics.length === 1 ? 'topic' : 'topics'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <p className="text-xs text-muted-foreground">{createdDate}</p>
        <Link href={`/subjects/${subject._id}`}>
          <Button className="w-full" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Start Learning
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
