'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, Sparkles, PenLine, GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ApiResponse, ISubject, IUserProfile } from '@/types'

/* ── constants ── */
const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const GRADE_LABELS: Record<number, string> = {
  3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th',
  8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th',
}

const schema = z.object({
  name: z.string().min(1, 'Subject name required').max(100),
  syllabus: z.string().optional(),
  manualTopics: z.string().optional(),
}).refine(
  (d) => (d.syllabus && d.syllabus.length >= 10) || (d.manualTopics && d.manualTopics.trim().length > 0),
  { message: 'Paste a syllabus OR type topics manually', path: ['syllabus'] }
)

type FormValues = z.infer<typeof schema>
type Step = 'grade' | 'subject'

export default function AddSubjectDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('subject')
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [userGrade, setUserGrade] = useState<number | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [savingGrade, setSavingGrade] = useState(false)
  const [checkingGrade, setCheckingGrade] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const manualTopicsValue = watch('manualTopics') ?? ''
  const previewTopics = manualTopicsValue.split(',').map((t) => t.trim()).filter(Boolean)

  /* On open: check if grade is set */
  async function handleOpen(willOpen: boolean) {
    if (!willOpen) {
      if (!isSubmitting && !savingGrade) {
        setOpen(false)
        reset()
        setStep('subject')
      }
      return
    }

    setOpen(true)
    setCheckingGrade(true)

    try {
      const res = await fetch('/api/user/profile')
      const json = (await res.json()) as { success: boolean; data: IUserProfile }
      if (json.success) {
        const grade = json.data.grade ?? null
        setUserGrade(grade)
        setSelectedGrade(grade)
        setStep(grade ? 'subject' : 'grade')
      }
    } catch {
      setStep('subject')
    } finally {
      setCheckingGrade(false)
    }
  }

  async function handleSaveGrade() {
    if (!selectedGrade) {
      toast.error('Please select your class')
      return
    }
    setSavingGrade(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: selectedGrade }),
    })
    const json = (await res.json()) as { success: boolean }
    if (json.success) {
      setUserGrade(selectedGrade)
      toast.success(`Class ${GRADE_LABELS[selectedGrade]} saved!`)
      setStep('subject')
    } else {
      toast.error('Failed to save class')
    }
    setSavingGrade(false)
  }

  async function onSubmit(data: FormValues) {
    let topics: string[] | undefined
    let syllabus = data.syllabus ?? ''

    if (mode === 'manual' && data.manualTopics) {
      topics = data.manualTopics.split(',').map((t) => t.trim()).filter(Boolean)
      if (!syllabus) syllabus = `Topics: ${topics.join(', ')}`
    }

    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, syllabus, manualTopics: topics }),
    })
    const json = (await res.json()) as ApiResponse<ISubject>

    if (!res.ok || !json.success) {
      toast.error(!json.success ? json.error : 'Failed to create subject')
      return
    }

    toast.success(
      mode === 'manual'
        ? `"${data.name}" added with ${previewTopics.length} topics!`
        : `"${data.name}" added — AI extracting topics!`
    )
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => void handleOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        {/* ── Step 1: Grade not set ── */}
        {checkingGrade ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Checking profile…</span>
          </div>
        ) : step === 'grade' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-5 w-5 text-primary" />
                <DialogTitle>Select your class first</DialogTitle>
              </div>
              <DialogDescription>
                AI will tailor lessons and questions to your class level.
                This only needs to be set once.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-5 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGrade(g)}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-semibold transition-all',
                      selectedGrade === g
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                        : 'bg-card border-border hover:bg-muted hover:border-primary/40'
                    )}
                  >
                    {GRADE_LABELS[g]}
                  </button>
                ))}
              </div>

              {selectedGrade && (
                <p className="text-xs text-muted-foreground">
                  Selected: <strong>Class {GRADE_LABELS[selectedGrade]}</strong>
                  {selectedGrade >= 11 ? ' — board exam level content' : ''}
                  {selectedGrade <= 5 ? ' — simple language and basic concepts' : ''}
                </p>
              )}

              <Button
                className="w-full"
                disabled={!selectedGrade || savingGrade}
                onClick={() => void handleSaveGrade()}
              >
                {savingGrade ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  <>Save &amp; Continue <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* ── Step 2: Add Subject ── */
          <>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                {userGrade
                  ? `For Class ${GRADE_LABELS[userGrade]} — paste your syllabus or type topics manually.`
                  : 'Paste your syllabus — AI will extract topics automatically.'}
              </DialogDescription>
            </DialogHeader>

            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-colors',
                  mode === 'ai' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI se Extract
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-colors',
                  mode === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <PenLine className="h-3.5 w-3.5" />
                Topics Manually
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Subject name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Mathematics, Science, History"
                  {...register('name')}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {mode === 'ai' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="syllabus">Syllabus</Label>
                  <Textarea
                    id="syllabus"
                    placeholder="Paste your full syllabus here — units, chapters, topics..."
                    className="min-h-[140px] resize-none"
                    {...register('syllabus')}
                    disabled={isSubmitting}
                  />
                  {errors.syllabus && (
                    <p className="text-xs text-destructive">{errors.syllabus.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="manualTopics">
                    Topics{' '}
                    <span className="text-muted-foreground font-normal">(comma-separated)</span>
                  </Label>
                  <Textarea
                    id="manualTopics"
                    placeholder="Profit and Loss, Simple Interest, Compound Interest, Percentages"
                    className="min-h-[100px] resize-none"
                    {...register('manualTopics')}
                    disabled={isSubmitting}
                  />
                  {previewTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {previewTopics.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                  {errors.syllabus && (
                    <p className="text-xs text-destructive">{errors.syllabus.message}</p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'ai' ? 'Extracting topics via AI…' : 'Creating subject…'}
                  </>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" />Add Subject</>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
