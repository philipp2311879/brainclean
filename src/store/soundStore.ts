import { create } from 'zustand'
import { soundManager } from '../lib/soundManager'

interface SoundStore {
  sfxEnabled: boolean
  toggle: () => void
}

export const useSoundStore = create<SoundStore>((set, get) => ({
  sfxEnabled: true,
  toggle: () => {
    const next = !get().sfxEnabled
    set({ sfxEnabled: next })
    soundManager.setSFXEnabled(next)
  },
}))
