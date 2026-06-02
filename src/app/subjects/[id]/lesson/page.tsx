'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Flashcard from '@/components/flashcard'
import MCQCard from '@/components/mcq-card'
import type { IFlashcard, IMCQQuestion } from '@/types'
import { cn } from '@/lib/utils'

// Ensure display math ($$...$$) is on its own paragraph line so remark-math parses it correctly
function normalizeMath(content: string): string {
  return content
    .replace(/([^\n])\$\$/g, '$1\n\n$$')   // add newline before $$
    .replace(/\$\$([^\n])/g, '$$\n\n$1')   // add newline after $$
    .replace(/\n{3,}/g, '\n\n')             // collapse excessive blank lines
}

interface LessonData {
  content: string
  flashcards: IFlashcard[]
}

const LESSON_TOAST = 'lesson-generate'
const EXAM_TOAST = 'exam-generate'

export default function LessonPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const topic = searchParams.get('topic') ?? ''

  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Quick Exam state
  const [examQuestions, setExamQuestions] = useState<IMCQQuestion[]>([])
  const [examAnswers, setExamAnswers] = useState<(number | null)[]>([])
  const [examPhase, setExamPhase] = useState<'idle' | 'loading' | 'taking' | 'result'>('idle')
  const [examCurrent, setExamCurrent] = useState(0)
  const [examScore, setExamScore] = useState(0)

  async function loadLesson(isRegenerate = false) {
    setLoading(true)
    setError('')
    toast.loading(isRegenerate ? 'Regenerating lesson…' : 'Generating lesson…', { id: LESSON_TOAST })

    try {
      const res = await fetch(
        `/api/ai/generate-lesson?subjectId=${params.id}&topic=${encodeURIComponent(topic)}${isRegenerate ? '&force=true' : ''}`
      )
      const json = (await res.json()) as {
        success: boolean; data: LessonData; cached?: boolean; error?: string
      }
      if (!json.success) throw new Error(json.error ?? 'Failed')
      setLesson(json.data)
      toast.success(
        isRegenerate ? 'Lesson regenerated!' : json.cached ? 'Loaded from cache' : 'Lesson ready!',
        { id: LESSON_TOAST }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate lesson.'
      setError(msg)
      toast.error(msg, { id: LESSON_TOAST })
    } finally {
      setLoading(false)
    }
  }

  async function startExam() {
    setExamPhase('loading')
    setExamCurrent(0)
    setExamAnswers([])
    toast.loading('Generating 5 practice questions…', { id: EXAM_TOAST })

    try {
      const res = await fetch(
        `/api/ai/generate-test?subjectId=${params.id}&topic=${encodeURIComponent(topic)}&count=5`
      )
      const json = (await res.json()) as {
        success: boolean; data?: { questions: IMCQQuestion[] }; error?: string
      }
      if (!json.success || !json.data) throw new Error(json.error ?? 'Failed')
      setExamQuestions(json.data.questions)
      setExamAnswers(new Array<null>(json.data.questions.length).fill(null))
      setExamPhase('taking')
      toast.success('Quick exam ready!', { id: EXAM_TOAST })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate exam'
      toast.error(msg, { id: EXAM_TOAST })
      setExamPhase('idle')
    }
  }

  function submitExam() {
    const correct = examAnswers.filter((a, i) => a === examQuestions[i]?.correct).length
    const score = Math.round((correct / examQuestions.length) * 100)
    setExamScore(score)
    setExamPhase('result')
    if (score >= 80) toast.success(`Excellent! ${score}% in quick exam`)
    else if (score >= 50) toast.success(`${score}% — keep practising!`)
    else toast.error(`${score}% — review the lesson again`)
  }

  useEffect(() => {
    if (topic) void loadLesson()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, params.id])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/subjects/${params.id}`}>
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </Link>
          {!loading && lesson && (
            <Button variant="outline" size="sm" onClick={() => void loadLesson(true)}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Regenerate
            </Button>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{topic}</h1>
          <Badge variant="secondary" className="mt-1">Lesson</Badge>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" /><Skeleton className="h-32 w-full mt-6" />
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button onClick={() => void loadLesson()}>Try again</Button>
          </div>
        ) : lesson ? (
          <Tabs defaultValue="lesson">
            <TabsList className="mb-6">
              <TabsTrigger value="lesson">Lesson</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards ({lesson.flashcards.length})</TabsTrigger>
              <TabsTrigger value="exam">Quick Exam</TabsTrigger>
            </TabsList>

            {/* ── Lesson ── */}
            <TabsContent value="lesson">
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed
                [&_table]:w-full [&_table]:border-collapse
                [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted
                [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
                [&_.math-display]:overflow-x-auto [&_.math-display]:py-2">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {normalizeMath(lesson.content)}
                </ReactMarkdown>
              </div>
            </TabsContent>

            {/* ── Flashcards ── */}
            <TabsContent value="flashcards">
              <Flashcard flashcards={lesson.flashcards} />
            </TabsContent>

            {/* ── Quick Exam ── */}
            <TabsContent value="exam">
              {examPhase === 'idle' && (
                <div className="text-center py-16 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Test your understanding with 5 AI-generated questions on this topic.
                  </p>
                  <Button onClick={() => void startExam()}>Start Quick Exam (5 questions)</Button>
                </div>
              )}

              {examPhase === 'loading' && (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Generating questions…</p>
                </div>
              )}

              {examPhase === 'taking' && examQuestions.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {examAnswers.filter((a) => a !== null).length}/{examQuestions.length} answered
                    </p>
                    <div className="flex gap-1.5">
                      {examQuestions.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setExamCurrent(i)}
                          className={cn(
                            'w-7 h-7 rounded text-xs font-medium transition-colors',
                            i === examCurrent ? 'bg-primary text-primary-foreground' :
                            examAnswers[i] !== null ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          )}
                        >{i + 1}</button>
                      ))}
                    </div>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <MCQCard
                        question={examQuestions[examCurrent]}
                        index={examCurrent}
                        selectedAnswer={examAnswers[examCurrent]}
                        showResult={false}
                        onSelect={(i) => setExamAnswers((prev) => {
                          const n = [...prev]; n[examCurrent] = i; return n
                        })}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button variant="outline" disabled={examCurrent === 0}
                      onClick={() => setExamCurrent((c) => c - 1)}>Previous</Button>
                    {examCurrent < examQuestions.length - 1 ? (
                      <Button className="flex-1" onClick={() => setExamCurrent((c) => c + 1)}>Next</Button>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={submitExam}
                        disabled={examAnswers.some((a) => a === null)}
                      >Submit Exam</Button>
                    )}
                  </div>
                </div>
              )}

              {examPhase === 'result' && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6 text-center space-y-3">
                      <p className={cn(
                        'text-5xl font-bold',
                        examScore >= 80 ? 'text-green-600' : examScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                      )}>{examScore}%</p>
                      <p className="text-muted-foreground text-sm">
                        {examAnswers.filter((a, i) => a === examQuestions[i]?.correct).length} / {examQuestions.length} correct
                      </p>
                      <Progress value={examScore} className="h-2" />
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <p className="text-sm font-medium">Review answers:</p>
                    {examQuestions.map((q, i) => (
                      <MCQCard key={i} question={q} index={i}
                        selectedAnswer={examAnswers[i]} showResult onSelect={() => {}} />
                    ))}
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => void startExam()}>
                    <RefreshCw className="h-4 w-4 mr-2" />Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  )
}
