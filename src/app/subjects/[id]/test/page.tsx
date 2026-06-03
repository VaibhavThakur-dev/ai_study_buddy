'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle2, Loader2, RefreshCw, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import MCQCard from '@/components/mcq-card'
import type { IMCQQuestion } from '@/types'

type Phase = 'setup' | 'loading' | 'taking' | 'submitting' | 'result' | 'error'

interface TestResult {
  score: number
  correct: number
  total: number
}

const TOAST_ID = 'test-generate'
const COUNT_OPTIONS = [5, 10, 15, 20]

export default function TestPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const topic = searchParams.get('topic') ?? ''

  const [phase, setPhase] = useState<Phase>('setup')
  const [questionCount, setQuestionCount] = useState(10)
  const [errorMsg, setErrorMsg] = useState('')
  const [questions, setQuestions] = useState<IMCQQuestion[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [current, setCurrent] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState<TestResult | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)

  async function loadTest(count: number) {
    setPhase('loading')
    setErrorMsg('')
    toast.loading(`Generating ${count} questions via AI…`, { id: TOAST_ID })

    try {
      const res = await fetch(
        `/api/ai/generate-test?subjectId=${params.id}&topic=${encodeURIComponent(topic)}&count=${count}`
      )
      const json = (await res.json()) as {
        success: boolean
        data?: { questions: IMCQQuestion[] }
        error?: string
      }

      if (!json.success || !json.data) {
        throw new Error(json.error ?? 'Failed to generate test')
      }

      setQuestions(json.data.questions)
      setAnswers(new Array<null>(json.data.questions.length).fill(null))
      setPhase('taking')
      toast.success(`${json.data.questions.length} questions ready! Good luck.`, { id: TOAST_ID })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate test'
      setErrorMsg(msg)
      setPhase('error')
      toast.error(msg, { id: TOAST_ID })
    }
  }

  useEffect(() => {
    if (phase !== 'taking') return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  const submit = useCallback(async () => {
    if (answers.some((a) => a === null)) {
      toast.error('Please answer all questions before submitting')
      return
    }
    setPhase('submitting')
    try {
      const res = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: params.id,
          topic,
          questions,
          userAnswers: answers,
          timeTaken: seconds,
        }),
      })
      const json = (await res.json()) as { success: boolean; data: TestResult; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Submit failed')
      setResult(json.data)
      setPhase('result')
      const s = json.data.score
      if (s >= 80) toast.success(`Excellent! You scored ${s}%`)
      else if (s >= 50) toast.success(`Test done — ${s}%. Keep practising!`)
      else toast.error(`Needs improvement — ${s}%. Try again after revision.`)
    } catch {
      toast.error('Failed to submit test')
      setPhase('taking')
    }
  }, [answers, params.id, topic, questions, seconds])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const answered = answers.filter((a) => a !== null).length

  /* Setup */
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-nav lg:pb-0">
        <div className="w-full max-w-md space-y-5 sm:space-y-6">
          <Link href={`/subjects/${params.id}`}>
            <Button variant="ghost" size="sm" className="-ml-2 mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>

          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">{topic}</h1>
            <p className="text-muted-foreground text-sm mt-1">Configure your test</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Number of questions</p>
            <div className="grid grid-cols-4 gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`py-2.5 sm:py-3 rounded-lg border text-sm font-semibold transition-colors ${
                    questionCount === n
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {questionCount} questions · AI generates unique questions
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={() => void loadTest(questionCount)}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Start Test
          </Button>
        </div>
      </div>
    )
  }

  /* Loading */
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pb-nav lg:pb-0">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Generating test questions via AI…</p>
        <p className="text-xs text-muted-foreground">This may take 10–20 seconds</p>
      </div>
    )
  }

  /* Error */
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 pb-nav lg:pb-0">
        <div className="text-center max-w-md space-y-3">
          <p className="text-destructive font-medium">Failed to generate test</p>
          {errorMsg && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3 text-left wrap-break-word">
              {errorMsg}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => void loadTest(questionCount)}>
            <RefreshCw className="h-4 w-4 mr-2" />Try again
          </Button>
          <Link href={`/subjects/${params.id}`}>
            <Button variant="ghost" size="sm">Go back</Button>
          </Link>
        </div>
      </div>
    )
  }

  /* Result */
  if (phase === 'result' && result) {
    const pct = result.score
    const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
    return (
      <div className="min-h-screen bg-background pb-nav lg:pb-0">
        <div className="container mx-auto px-4 py-6 sm:py-10 max-w-2xl">
          <Card>
            <CardHeader className="text-center pb-2">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-xl sm:text-2xl">Test Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className={`text-5xl sm:text-6xl font-bold ${color}`}>{pct}%</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {result.correct} / {result.total} correct · {fmt(seconds)}
                </p>
              </div>

              <Progress value={pct} className="h-3" />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAnswers((v) => !v)}
                >
                  {showAnswers ? 'Hide answers' : 'Review answers'}
                </Button>
                <Link href={`/subjects/${params.id}`} className="flex-1">
                  <Button className="w-full">Back to topics</Button>
                </Link>
              </div>

              {showAnswers && (
                <div className="space-y-4 sm:space-y-6 pt-4 border-t">
                  {questions.map((q, i) => (
                    <MCQCard
                      key={i}
                      question={q}
                      index={i}
                      selectedAnswer={answers[i]}
                      showResult
                      onSelect={() => {}}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /* Taking test */
  const q = questions[current]

  return (
    <div className="min-h-screen bg-background pb-nav lg:pb-0">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link href={`/subjects/${params.id}`}>
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quit
            </Button>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {answered}/{questions.length} answered
            </Badge>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {fmt(seconds)}
            </div>
          </div>
        </div>

        <div className="mb-3 sm:mb-4">
          <h2 className="font-semibold text-sm sm:text-base mb-1 truncate">{topic}</h2>
          <Progress value={(answered / questions.length) * 100} className="h-1.5" />
        </div>

        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <MCQCard
              question={q}
              index={current}
              selectedAnswer={answers[current]}
              showResult={false}
              onSelect={(i) =>
                setAnswers((prev) => { const n = [...prev]; n[current] = i; return n })
              }
            />
          </CardContent>
        </Card>

        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
          >
            Previous
          </Button>
          {current < questions.length - 1 ? (
            <Button className="flex-1" onClick={() => setCurrent((c) => c + 1)}>
              Next
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => void submit()}
              disabled={phase === 'submitting'}
            >
              {phase === 'submitting' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
              ) : (
                'Submit test'
              )}
            </Button>
          )}
        </div>

        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-xs font-medium transition-colors ${
                i === current
                  ? 'bg-primary text-primary-foreground'
                  : answers[i] !== null
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
