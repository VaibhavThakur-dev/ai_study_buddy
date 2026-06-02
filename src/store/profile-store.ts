import { create } from 'zustand'
import type { IUserProfile } from '@/types'

interface ProfileState {
  profile: IUserProfile | null
  loading: boolean
  fetch: () => Promise<void>
  update: (data: Partial<IUserProfile>) => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,

  fetch: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await fetch('/api/user/profile')
      const json = (await res.json()) as { success: boolean; data: IUserProfile }
      if (json.success) set({ profile: json.data })
    } finally {
      set({ loading: false })
    }
  },

  update: (data) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : null,
    })),
}))
