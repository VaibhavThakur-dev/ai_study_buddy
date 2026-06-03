import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AppShell from '@/components/app-shell'
import ChatBox from '@/components/chat-box'

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ topic?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { topic = '' } = await searchParams

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-3xl flex-1 flex flex-col">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Link href={`/subjects/${id}`}>
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <h1 className="font-semibold text-sm sm:text-base truncate">{topic || 'Chat Tutor'}</h1>
              <Badge variant="secondary" className="text-xs">AI Tutor</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Ask anything — your conversation is saved automatically
            </p>
          </div>
        </div>

        <ChatBox subjectId={id} topic={topic} />
      </div>
    </AppShell>
  )
}
