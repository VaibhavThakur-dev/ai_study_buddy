'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, MessageCircle, ClipboardList, Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/navbar'

interface SubjectData {
  _id: string
  name: string
  topics: string[]
}

export default function SubjectPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [subject, setSubject] = useState<SubjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [addInput, setAddInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingTopic, setRemovingTopic] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/subjects/${params.id}`)
        const json = (await res.json()) as { success: boolean; data: SubjectData }
        if (json.success) setSubject(json.data)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.id])

  async function handleAddTopics() {
    if (!addInput.trim()) return
    const newTopics = addInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    if (!newTopics.length) return

    setAdding(true)
    const res = await fetch(`/api/subjects/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addTopics', topics: newTopics }),
    })
    const json = (await res.json()) as { success: boolean; data?: { topics: string[] } }

    if (json.success && json.data) {
      setSubject((s) => s ? { ...s, topics: json.data!.topics } : s)
      setAddInput('')
      toast.success(`${newTopics.length} topic${newTopics.length > 1 ? 's' : ''} added`)
      router.refresh()
    } else {
      toast.error('Failed to add topics')
    }
    setAdding(false)
  }

  async function handleRemoveTopic(topic: string) {
    setRemovingTopic(topic)
    const res = await fetch(`/api/subjects/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeTopic', topic }),
    })
    const json = (await res.json()) as { success: boolean; data?: { topics: string[] } }

    if (json.success && json.data) {
      setSubject((s) => s ? { ...s, topics: json.data!.topics } : s)
      toast.success(`"${topic}" removed`)
    } else {
      toast.error('Failed to remove topic')
    }
    setRemovingTopic(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-24 text-muted-foreground">Subject not found.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{subject.name}</h1>
            <Badge variant="secondary">
              {subject.topics.length} {subject.topics.length === 1 ? 'topic' : 'topics'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Select a topic to learn, chat with AI tutor, or take a test.
          </p>
        </div>

        {/* ── Add topics ── */}
        <div className="mb-6 flex gap-2">
          <Input
            placeholder="Add topics — separate multiple with commas (e.g. Fractions, Ratios, Percentages)"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !adding && void handleAddTopics()}
            disabled={adding}
            className="flex-1"
          />
          <Button onClick={() => void handleAddTopics()} disabled={adding || !addInput.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-1.5">Add</span>
          </Button>
        </div>

        {/* ── Topics list ── */}
        {subject.topics.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No topics yet. Add topics above or re-create the subject with a syllabus.
          </div>
        ) : (
          <div className="space-y-3">
            {subject.topics.map((topic: string, index: number) => (
              <Card key={index} className="hover:shadow-sm transition-shadow group">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Topic {index + 1}</p>
                  </div>

                  <div className="flex gap-2 shrink-0 items-center">
                    <Link href={`/subjects/${subject._id}/lesson?topic=${encodeURIComponent(topic)}`}>
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Learn</span>
                      </Button>
                    </Link>
                    <Link href={`/subjects/${subject._id}/chat?topic=${encodeURIComponent(topic)}`}>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Chat</span>
                      </Button>
                    </Link>
                    <Link href={`/subjects/${subject._id}/test?topic=${encodeURIComponent(topic)}`}>
                      <Button variant="outline" size="sm">
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Test</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={() => void handleRemoveTopic(topic)}
                      disabled={removingTopic === topic}
                    >
                      {removingTopic === topic
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <X className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
