'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  MessageCircle,
  ClipboardList,
  BarChart2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/* ─── Scroll-reveal hook ────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── FadeUp wrapper ────────────────────────────────────────────── */
function FadeUp({
  children,
  className,
  delay = 'delay-0',
}: {
  children: React.ReactNode
  className?: string
  delay?: string
}) {
  const { ref, visible } = useInView()
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        delay,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  )
}

/* ─── Data ──────────────────────────────────────────────────────── */
const features = [
  {
    icon: BookOpen,
    title: 'AI-Generated Lessons',
    desc: 'Paste your syllabus, pick a topic, and get a detailed markdown lesson with examples — generated in seconds.',
  },
  {
    icon: MessageCircle,
    title: 'Chat Tutor',
    desc: 'WhatsApp-style AI tutor that answers your doubts in simple language. All conversations are saved.',
  },
  {
    icon: ClipboardList,
    title: 'MCQ Tests',
    desc: '10 AI-generated multiple-choice questions per topic. Timer, per-question navigation, instant score.',
  },
  {
    icon: BarChart2,
    title: 'Progress Tracking',
    desc: 'See your scores over time, identify weak topics, and track your daily study streak.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Paste Your Syllabus',
    desc: 'Add a subject and paste your course syllabus — any format works.',
  },
  {
    num: '02',
    title: 'AI Extracts Topics',
    desc: 'Our AI reads your syllabus and breaks it into individual study topics automatically.',
  },
  {
    num: '03',
    title: 'Learn, Chat & Test',
    desc: 'Generate lessons with flashcards, chat with the AI tutor, and take MCQ tests per topic.',
  },
]

const stats = [
  { value: '< 5s', label: 'Lesson generated' },
  { value: '10', label: 'MCQs per test' },
  { value: '15', label: 'Topics from syllabus' },
  { value: '100%', label: 'Free to use' },
]

/* ─── Page ──────────────────────────────────────────────────────── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-5 w-5" />
            AI Study Buddy
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/25 via-background to-background -z-10" />
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl -z-10"
        />

        <div className="container mx-auto max-w-4xl">
          <div
            className={cn(
              'transition-all duration-500 delay-75',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Badge variant="secondary" className="mb-6 gap-1.5 py-1 px-3">
              <Sparkles className="h-3 w-3" />
              Powered by Meta Llama 3.1 — Free forever
            </Badge>
          </div>

          <h1
            className={cn(
              'text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6 transition-all duration-600 delay-150',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            Study Smarter
            <br />
            <span className="text-primary">with AI</span>
          </h1>

          <p
            className={cn(
              'text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-600 delay-200',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            Paste your syllabus. AI extracts topics, generates lessons with flashcards,
            runs a personal chat tutor, creates MCQ tests, and tracks your progress — all free.
          </p>

          <div
            className={cn(
              'flex gap-3 justify-center flex-wrap mb-6 transition-all duration-600 delay-300',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
          >
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 h-12 text-base">
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 text-base">
                Sign In
              </Button>
            </Link>
          </div>

          <div
            className={cn(
              'flex items-center justify-center gap-6 text-xs text-muted-foreground transition-all duration-600 delay-400',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {['No credit card required', 'Free AI model', 'Open source'].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'mt-16 transition-all duration-700 delay-500',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div className="container mx-auto max-w-sm">
            <div className="grid grid-cols-4 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="bg-card border rounded-xl py-4 px-2 text-center shadow-sm">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <ChevronDown className="h-5 w-5 text-muted-foreground animate-bounce" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <FadeUp className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to ace your exams</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              One platform for lessons, tutoring, testing, and analytics — powered entirely by free AI.
            </p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <FadeUp key={f.title} delay={`delay-${[0, 100, 200, 300][i]}`}>
                <Card className="h-full hover:shadow-md transition-shadow duration-300 border-border/60">
                  <CardContent className="pt-6 pb-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <FadeUp className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">From syllabus to mastery in 3 steps</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No setup, no complex configuration — just paste your syllabus and start learning.
            </p>
          </FadeUp>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
              {steps.map((s, i) => (
                <FadeUp key={s.num} delay={`delay-${[0, 150, 300][i]}`} className="text-center">
                  <div className="relative inline-flex w-16 h-16 rounded-2xl bg-primary text-primary-foreground items-center justify-center text-xl font-bold mb-5 shadow-md">
                    {s.num}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature highlight row ── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <FadeUp>
              <Badge variant="outline" className="mb-4">Smart flashcards</Badge>
              <h2 className="text-3xl font-bold mb-4 leading-snug">
                Lessons with built-in flashcards
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Every AI-generated lesson automatically includes flip-card flashcards so you
                can reinforce what you just read without leaving the page.
              </p>
              <ul className="space-y-2 text-sm">
                {['Click to flip between question and answer', 'Navigate with arrow keys or buttons', 'Cached — instant on revisit'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </FadeUp>

            <FadeUp delay="delay-200">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Flashcard preview</p>
                <div className="bg-muted rounded-xl p-5 text-center min-h-[140px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/70 transition-colors">
                  <Badge variant="secondary" className="text-xs">Question</Badge>
                  <p className="font-medium text-sm">What is the difference between RAM and ROM?</p>
                  <p className="text-xs text-muted-foreground">Click to flip</p>
                </div>
                <div className="flex justify-center gap-2">
                  {['←', '↺ Restart', '→'].map((b) => (
                    <div key={b} className="px-3 py-1.5 bg-muted rounded-md text-xs text-muted-foreground">
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Test preview highlight ── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <FadeUp delay="delay-200" className="order-2 md:order-1">
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">MCQ Test</p>
                  <Badge variant="outline" className="text-xs gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                    2:34 elapsed
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">2. What does CPU stand for?</p>
                  {['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'].map((opt, i) => (
                    <div
                      key={opt}
                      className={cn(
                        'text-xs px-3 py-2.5 rounded-lg border',
                        i === 0 ? 'bg-primary/10 border-primary text-primary font-medium' : 'border-border'
                      )}
                    >
                      <span className="font-medium mr-2">{['A','B','C','D'][i]}.</span>{opt}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-1">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button size="sm">Next</Button>
                </div>
              </div>
            </FadeUp>

            <FadeUp className="order-1 md:order-2">
              <Badge variant="outline" className="mb-4">MCQ Tests</Badge>
              <h2 className="text-3xl font-bold mb-4 leading-snug">
                10 questions, instant score, full review
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                AI generates 10 topic-specific multiple choice questions. Take the test with a
                running timer, jump between questions, and review every answer after submission.
              </p>
              <ul className="space-y-2 text-sm">
                {['Timer + question navigator', 'Score saved to your progress', 'Review correct answers after test'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-4 bg-gradient-to-b from-muted/30 to-background">
        <FadeUp className="text-center container mx-auto max-w-2xl">
          <h2 className="text-4xl sm:text-5xl font-bold mb-5">
            Start learning today
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Free account. No credit card. AI-powered lessons, chat tutor, and MCQ tests — ready in minutes.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 h-12 text-base">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 text-base">
                Already have an account?
              </Button>
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <BookOpen className="h-4 w-4" />
            AI Study Buddy
          </div>
          <p>Built with Next.js · MongoDB · OpenRouter · shadcn/ui</p>
          <p>© 2025 — Free forever</p>
        </div>
      </footer>
    </div>
  )
}
