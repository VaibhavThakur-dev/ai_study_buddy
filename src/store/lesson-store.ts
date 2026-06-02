import { create } from 'zustand'
import type { IFlashcard } from '@/types'

interface LessonData {
  content: string
  flashcards: IFlashcard[]
}

interface LessonState {
  // keyed by `${subjectId}:${topic}`
  lessons: Record<string, LessonData>
  loading: Record<string, boolean>
  errors: Record<string, string>

  fetch: (subjectId: string, topic: string, force?: boolean) => Promise<void>
  clear: (subjectId: string, topic: string) => void
}

export const useLessonStore = create<LessonState>((set, get) => ({
  lessons: {},
  loading: {},
  errors: {},

  fetch: async (subjectId, topic, force = false) => {
    const key = `${subjectId}:${topic}`
    if (get().loading[key]) return
    if (!force && get().lessons[key]) return

    set((s) => ({ loading: { ...s.loading, [key]: true }, errors: { ...s.errors, [key]: '' } }))

    try {
      const url = `/api/ai/generate-lesson?subjectId=${subjectId}&topic=${encodeURIComponent(topic)}${force ? '&force=true' : ''}`
      const res = await fetch(url)
      const json = (await res.json()) as { success: boolean; data: LessonData; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Failed')
      set((s) => ({ lessons: { ...s.lessons, [key]: json.data } }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate lesson'
      set((s) => ({ errors: { ...s.errors, [key]: msg } }))
    } finally {
      set((s) => ({ loading: { ...s.loading, [key]: false } }))
    }
  },

  clear: (subjectId, topic) => {
    const key = `${subjectId}:${topic}`
    set((s) => {
      const lessons = { ...s.lessons }
      delete lessons[key]
      return { lessons }
    })
  },
}))
