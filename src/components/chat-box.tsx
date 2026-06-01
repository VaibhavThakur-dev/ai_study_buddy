'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { IChatMessage } from '@/types'

interface ChatBoxProps {
  subjectId: string
  topic: string
}

interface ApiMessage {
  _id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatBox({ subjectId, topic }: ChatBoxProps) {
  const [messages, setMessages] = useState<IChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(
          `/api/ai/chat?subjectId=${subjectId}&topic=${encodeURIComponent(topic)}`
        )
        const json = (await res.json()) as { success: boolean; data: ApiMessage[] }
        if (json.success) {
          setMessages(
            json.data.map((m) => ({
              ...m,
              subjectId,
              userId: '',
              topic,
              createdAt: new Date(),
            }))
          )
        }
      } catch {
        toast.error('Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }
    void loadHistory()
  }, [subjectId, topic])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: IChatMessage = {
      _id: Date.now().toString(),
      subjectId,
      userId: '',
      topic,
      role: 'user',
      content: text,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, topic, message: text }),
      })
      const json = (await res.json()) as { success: boolean; data: { response: string } }

      if (!json.success) throw new Error('AI error')

      const aiMsg: IChatMessage = {
        _id: (Date.now() + 1).toString(),
        subjectId,
        userId: '',
        topic,
        role: 'assistant',
        content: json.data.response,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      toast.error('Failed to get response')
    } finally {
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] border rounded-lg bg-card">
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-12 w-64 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Ask your AI tutor anything about <span className="font-medium mx-1">{topic}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3 flex gap-2 items-end">
        <Textarea
          placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
          className="resize-none min-h-[44px] max-h-[120px] text-sm"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={sending || loading}
        />
        <Button size="icon" onClick={() => void send()} disabled={!input.trim() || sending || loading}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
