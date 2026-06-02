import { create } from 'zustand'
import type { ISubject } from '@/types'

interface SubjectState {
  subjects: ISubject[]
  loading: boolean
  fetch: () => Promise<void>
  add: (subject: ISubject) => void
  remove: (id: string) => void
}

export const useSubjectStore = create<SubjectState>((set) => ({
  subjects: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/subjects')
      const json = (await res.json()) as { success: boolean; data: ISubject[] }
      if (json.success) set({ subjects: json.data })
    } finally {
      set({ loading: false })
    }
  },

  add: (subject) =>
    set((state) => ({ subjects: [subject, ...state.subjects] })),

  remove: (id) =>
    set((state) => ({ subjects: state.subjects.filter((s) => s._id !== id) })),
}))
