import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navbar'
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-3xl flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/subjects/${id}`}>
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <h1 className="font-semibold">{topic || 'Chat Tutor'}</h1>
              <Badge variant="secondary" className="text-xs">AI Tutor</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ask anything — your conversation is saved automatically
            </p>
          </div>
        </div>

        <ChatBox subjectId={id} topic={topic} />
      </main>
    </div>
  )
}
