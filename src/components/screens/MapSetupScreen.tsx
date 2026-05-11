import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useMinigameStore } from '../../store/minigameStore'
import { GameBoard } from '../board/GameBoard'
import { Button } from '../ui/Button'
import { generateMap, normalCount, DEFAULT_CONFIG, type MapConfig } from '../../utils/mapGenerator'
import type { Field } from '../../types'

const FIELD_TOTAL = 30
const MIN_NORMAL   = 8

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  inhibition:  { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
  updating:    { bg: '#dbeafe', text: '#1d4ed8', border: '#3b82f6' },
  flexibility: { bg: '#fef9c3', text: '#92400e', border: '#f59e0b' },
  flexibilität:{ bg: '#fef9c3', text: '#92400e', border: '#f59e0b' },
  kombi:       { bg: '#fef3c7', text: '#92400e', border: '#d97706' },
}

function catStyle(cat: string | null) {
  if (!cat) return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  return CATEGORY_COLORS[cat.toLowerCase()] ?? { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
}

// ── Field count row ──────────────────────────────────────────────────────────

interface FieldRowProps {
  label:    string
  emoji:    string
  color:    string
  value:    number
  min?:     number
  max:      number
  onChange: (n: number) => void
}

function FieldRow({ label, emoji, color, value, min = 0, max, onChange }: FieldRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <span className="font-body font-semibold flex-1 text-[#0f172a] text-lg">{label}</span>
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-xl font-display text-xl flex items-center justify-center cursor-pointer border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: color, color }}
        >−</motion.button>
        <span className="font-display text-2xl w-8 text-center" style={{ color }}>
          {value}
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 rounded-xl font-display text-xl flex items-center justify-center cursor-pointer border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ borderColor: color, color }}
        >+</motion.button>
      </div>
    </div>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function MapSetupScreen() {
  const { startGameFromMapSetup, goBackToPreviousDecision, totalRounds } = useGameStore()
  const { minigames, selectedIds, toggleSelected, selectAll, deselectAll } = useMinigameStore()

  const [cfg, setCfg] = useState<MapConfig>({ ...DEFAULT_CONFIG })
  const [fields, setFields] = useState<Field[]>([])
  const [mapKey, setMapKey] = useState(0)

  const normals  = normalCount(cfg)
  const isValid  = normals >= MIN_NORMAL
  const allSelected  = selectedIds.length === minigames.length && minigames.length > 0
  const noneSelected = selectedIds.length === 0
  const tooFewMinigames = selectedIds.length < totalRounds && selectedIds.length > 0

  const maxFor = (type: keyof MapConfig) => {
    const others = Object.entries(cfg)
      .filter(([k]) => k !== type)
      .reduce((s, [, v]) => s + v, 0)
    return FIELD_TOTAL - 1 - MIN_NORMAL - others
  }

  const regen = useCallback(() => {
    setFields(generateMap(cfg))
    setMapKey((k) => k + 1)
  }, [cfg])

  useEffect(() => { regen() }, [])
  useEffect(() => { if (isValid) regen() }, [cfg])

  const set = (type: keyof MapConfig, val: number) =>
    setCfg((c) => ({ ...c, [type]: val }))

  const canStart = isValid && fields.length > 0 && !noneSelected

  return (
    <div className="w-full h-full flex flex-col screen-base">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={goBackToPreviousDecision}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#d1d5db] bg-white text-[#475569] font-body font-semibold text-base cursor-pointer hover:border-[#4f8cff] hover:text-[#4f8cff] transition-all"
          >
            ← Zurück
          </motion.button>
          <div>
            <h1 className="font-display text-3xl text-[#0f172a]">
              🗺️ KARTE <span className="text-[#4f8cff]">VORBEREITEN</span>
            </h1>
            <p className="text-[#475569] font-body text-base">
              Felder &amp; Minispiele anpassen, dann Spiel starten!
            </p>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Map preview */}
        <div className="flex-1 p-4 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={mapKey}
              initial={{ opacity: 0.4, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {fields.length > 0 && (
                <GameBoard
                  fields={fields}
                  teams={[]}
                  activeMines={[]}
                  jackpotFieldIndex={null}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Settings panel (scrollable) */}
        <div className="w-88 flex-shrink-0 flex flex-col bg-white border-l border-[#e5e7eb] overflow-hidden" style={{ width: 340 }}>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

            {/* ── Karte anpassen ─────────────────────────────────── */}
            <div>
              <h2 className="font-display text-xl text-[#0f172a] mb-3">Karte anpassen</h2>
              <div className="flex flex-col gap-4">
                <FieldRow label="Bonus-Felder"  emoji="💎" color="#3b82f6" value={cfg.bonus} min={1} max={maxFor('bonus')} onChange={(v) => set('bonus', v)} />
                <FieldRow label="Fallen-Felder" emoji="💀" color="#ef4444" value={cfg.trap}  min={1} max={maxFor('trap')}  onChange={(v) => set('trap',  v)} />
                <FieldRow label="Event-Felder"  emoji="⚡" color="#8b5cf6" value={cfg.event} min={1} max={maxFor('event')} onChange={(v) => set('event', v)} />
                <FieldRow label="Shop-Felder"   emoji="🏪" color="#f97316" value={cfg.shop}  min={1} max={Math.min(3, maxFor('shop'))} onChange={(v) => set('shop',  v)} />
              </div>

              <div className={`mt-4 p-3 rounded-2xl border-2 flex items-center gap-3 ${isValid ? 'bg-[#f0fdf4] border-[#10b981]' : 'bg-[#fff1f2] border-[#ef4444]'}`}>
                <span className="text-xl">·</span>
                <div>
                  <div className="font-display text-lg" style={{ color: isValid ? '#10b981' : '#ef4444' }}>
                    Normale Felder: {normals}
                  </div>
                  {!isValid && (
                    <div className="text-[#ef4444] font-body text-xs">Minimum {MIN_NORMAL} erforderlich!</div>
                  )}
                </div>
              </div>

              <div className="mt-2 text-[#94a3b8] font-body text-xs leading-relaxed">
                Gesamt: 30 Felder (1 Start + {cfg.shop} Shop + {cfg.bonus} Bonus + {cfg.trap} Falle + {cfg.event} Event + {normals} Normal)
              </div>
            </div>

            {/* ── Divider ────────────────────────────────────────── */}
            <div className="border-t border-[#e5e7eb]" />

            {/* ── Minispiele ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-xl text-[#0f172a]">Minispiele</h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={selectAll}
                    disabled={allSelected}
                    className="text-xs px-2 py-1 rounded-lg border border-[#d1d5db] text-[#475569] hover:border-[#4f8cff] hover:text-[#4f8cff] disabled:opacity-40 cursor-pointer transition-all font-body"
                  >
                    Alle ✓
                  </button>
                  <button
                    onClick={deselectAll}
                    disabled={noneSelected}
                    className="text-xs px-2 py-1 rounded-lg border border-[#d1d5db] text-[#475569] hover:border-[#ef4444] hover:text-[#ef4444] disabled:opacity-40 cursor-pointer transition-all font-body"
                  >
                    Keine ✗
                  </button>
                </div>
              </div>

              {/* Warnings */}
              {noneSelected && (
                <div className="mb-2 p-2.5 rounded-xl bg-[#fff1f2] border border-[#ef4444] text-[#ef4444] font-body text-xs">
                  ⚠️ Mindestens 1 Minispiel muss ausgewählt sein!
                </div>
              )}
              {tooFewMinigames && (
                <div className="mb-2 p-2.5 rounded-xl bg-[#fffbeb] border border-[#f59e0b] text-[#92400e] font-body text-xs">
                  ℹ️ Weniger Minispiele als Runden – manche werden wiederholt.
                </div>
              )}

              <div className="flex flex-col gap-2">
                {minigames.map((mg) => {
                  const selected = selectedIds.includes(mg.id)
                  const cs = catStyle(mg.category)
                  return (
                    <motion.div
                      key={mg.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSelected(mg.id)}
                      className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                      style={selected
                        ? { borderColor: '#4f8cff', background: '#f0f7ff' }
                        : { borderColor: '#e5e7eb', background: '#f8fafc' }
                      }
                    >
                      <div
                        className="mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: selected ? '#4f8cff' : '#d1d5db', background: selected ? '#4f8cff' : 'white' }}
                      >
                        {selected && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-body font-semibold text-[#0f172a] text-sm">{mg.name}</span>
                          {mg.category && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full border font-body font-semibold"
                              style={{ background: cs.bg, color: cs.text, borderColor: cs.border }}
                            >
                              {mg.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[#94a3b8] text-xs leading-snug line-clamp-1">{mg.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <p className="mt-2 text-[#94a3b8] font-body text-xs">
                {selectedIds.length}/{minigames.length} ausgewählt · Neue Minispiele in Supabase einfügen
              </p>
            </div>
          </div>

          {/* Sticky buttons at bottom */}
          <div className="flex-shrink-0 border-t border-[#e5e7eb] p-4 flex flex-col gap-3 bg-white">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={regen}
              disabled={!isValid}
            >
              🔄 Neue Karte generieren
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canStart}
              onClick={() => startGameFromMapSetup(fields)}
            >
              ▶️ SPIEL STARTEN!
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
