import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Minigame } from '../types'

const DEFAULT_MINIGAMES = [
  {
    name: 'Signal Surge',
    description:
      'Alle Teams stehen verteilt in der Halle. Das Smartboard zeigt in schneller Folge Signale – Farben und Symbole. Jedes Signal bedeutet eine Aktion. ABER: Manche Signale sind "vergiftet" (Totenkopf-Symbol) – dann muss man das Gegenteil tun! Nach der Runde wird gezählt welches Team die wenigsten Fehler hatte.',
    video_url: null,
    has_audio: true,
    category: 'inhibition',
  },
  {
    name: 'Code Sprint',
    description:
      'Der Kapitän jedes Teams sieht am Smartboard einen verschlüsselten Code – eine Sequenz aus Symbolen die für Zahlen stehen. Der Kapitän muss sich den Code merken, zum Team sprinten, und gemeinsam entschlüsseln. Dann rennt jemand zurück und tippt die Lösung ein. Schnellstes Team mit richtiger Lösung gewinnt!',
    video_url: null,
    has_audio: true,
    category: 'updating',
  },
  {
    name: 'Shapeshifter',
    description:
      'Das Smartboard zeigt eine Formation – Dreieck, Kreis, Pfeil etc. Das Team muss sich in der Halle in diese Formation stellen. Alle 20 Sekunden wechselt die Formation und es kommt eine neue Regel dazu: gespiegelt, rückwärts, größter Spieler an der Spitze. Wer am schnellsten die richtige Formation steht bekommt die Punkte!',
    video_url: null,
    has_audio: true,
    category: 'flexibility',
  },
]

type LoadStatus = 'idle' | 'loading' | 'error' | 'setup_required' | 'ready'

interface MinigameState {
  minigames: Minigame[]
  selectedIds: number[]
  usedIds: number[]
  currentMinigame: Minigame | null
  loadStatus: LoadStatus
  errorMessage: string | null
}

interface MinigameStore extends MinigameState {
  load: () => Promise<void>
  toggleSelected: (id: number) => void
  selectAll: () => void
  deselectAll: () => void
  pickNext: () => void
}

function isTableMissingError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST200' ||
    (error.message?.toLowerCase().includes('does not exist') ?? false) ||
    (error.message?.toLowerCase().includes('relation') ?? false)
  )
}

export const useMinigameStore = create<MinigameStore>((set, get) => ({
  minigames: [],
  selectedIds: [],
  usedIds: [],
  currentMinigame: null,
  loadStatus: 'idle',
  errorMessage: null,

  load: async () => {
    set({ loadStatus: 'loading', errorMessage: null })
    try {
      const { data, error } = await supabase.from('minigames').select('*').order('created_at')

      if (error) {
        if (isTableMissingError(error)) {
          set({ loadStatus: 'setup_required' })
          return
        }
        set({ loadStatus: 'error', errorMessage: error.message })
        return
      }

      if (!data || data.length === 0) {
        // Insert defaults, then reload
        const { error: insertError } = await supabase.from('minigames').insert(DEFAULT_MINIGAMES)
        if (insertError) {
          set({ loadStatus: 'error', errorMessage: `Fehler beim Einfügen der Beispieldaten: ${insertError.message}` })
          return
        }
        const { data: data2, error: err2 } = await supabase.from('minigames').select('*').order('created_at')
        if (err2 || !data2) {
          set({ loadStatus: 'error', errorMessage: err2?.message ?? 'Unbekannter Fehler' })
          return
        }
        set({ minigames: data2 as Minigame[], selectedIds: (data2 as Minigame[]).map((m) => m.id), usedIds: [], loadStatus: 'ready' })
        return
      }

      const ms = data as Minigame[]
      set({ minigames: ms, selectedIds: ms.map((m) => m.id), usedIds: [], loadStatus: 'ready' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Netzwerkfehler'
      set({ loadStatus: 'error', errorMessage: msg })
    }
  },

  toggleSelected: (id) => {
    const { selectedIds } = get()
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    set({ selectedIds: next })
  },

  selectAll: () => {
    const { minigames } = get()
    set({ selectedIds: minigames.map((m) => m.id) })
  },

  deselectAll: () => set({ selectedIds: [] }),

  pickNext: () => {
    const { minigames, selectedIds, usedIds } = get()
    const selected = minigames.filter((m) => selectedIds.includes(m.id))
    if (selected.length === 0) {
      // Fallback: use all minigames
      const all = minigames
      if (all.length === 0) { set({ currentMinigame: null }); return }
      const next = all[Math.floor(Math.random() * all.length)]
      set({ currentMinigame: next, usedIds: [next.id] })
      return
    }

    let remaining = selected.filter((m) => !usedIds.includes(m.id))
    if (remaining.length === 0) {
      remaining = selected
      set({ usedIds: [] })
    }

    const next = remaining[Math.floor(Math.random() * remaining.length)]
    set({ currentMinigame: next, usedIds: [...get().usedIds, next.id] })
  },
}))
