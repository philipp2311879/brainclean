import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { GameBoard } from '../board/GameBoard'
import { Button } from '../ui/Button'
import { generateMap, normalCount, DEFAULT_CONFIG, type MapConfig } from '../../utils/mapGenerator'
import type { Field } from '../../types'

const FIELD_TOTAL = 30
const MIN_NORMAL   = 8

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

export function MapSetupScreen() {
  const { startGameFromMapSetup, goBackToPreviousDecision } = useGameStore()

  const [cfg, setCfg] = useState<MapConfig>({ ...DEFAULT_CONFIG })
  const [fields, setFields] = useState<Field[]>([])
  const [mapKey, setMapKey] = useState(0) // forces GameBoard re-animation

  const normals = normalCount(cfg)
  const isValid = normals >= MIN_NORMAL

  // Max per type: ensure at least MIN_NORMAL + all other specials fit
  const maxFor = (type: keyof MapConfig) => {
    const others = Object.entries(cfg)
      .filter(([k]) => k !== type)
      .reduce((s, [, v]) => s + v, 0)
    return FIELD_TOTAL - 1 - MIN_NORMAL - others // 1 = start
  }

  const regen = useCallback(() => {
    setFields(generateMap(cfg))
    setMapKey((k) => k + 1)
  }, [cfg])

  // Generate initial map on mount
  useEffect(() => { regen() }, [])
  // Re-generate automatically when config changes (instant feedback)
  useEffect(() => { if (isValid) regen() }, [cfg])

  const set = (type: keyof MapConfig, val: number) =>
    setCfg((c) => ({ ...c, [type]: val }))

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
              Felder anpassen, Karte vorschauen — dann Spiel starten!
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

        {/* Right: Settings panel */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white border-l border-[#e5e7eb] p-6 gap-5">
          <h2 className="font-display text-xl text-[#0f172a]">Karte anpassen</h2>

          {/* Field count rows */}
          <div className="flex flex-col gap-4">
            <FieldRow label="Bonus-Felder"  emoji="💎" color="#3b82f6" value={cfg.bonus} min={1} max={maxFor('bonus')} onChange={(v) => set('bonus', v)} />
            <FieldRow label="Fallen-Felder" emoji="💀" color="#ef4444" value={cfg.trap}  min={1} max={maxFor('trap')}  onChange={(v) => set('trap',  v)} />
            <FieldRow label="Event-Felder"  emoji="⚡" color="#8b5cf6" value={cfg.event} min={1} max={maxFor('event')} onChange={(v) => set('event', v)} />
            <FieldRow label="Shop-Felder"   emoji="🏪" color="#f97316" value={cfg.shop}  min={1} max={Math.min(3, maxFor('shop'))} onChange={(v) => set('shop',  v)} />
          </div>

          {/* Normal count display */}
          <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${isValid ? 'bg-[#f0fdf4] border-[#10b981]' : 'bg-[#fff1f2] border-[#ef4444]'}`}>
            <span className="text-2xl">·</span>
            <div>
              <div className="font-display text-xl" style={{ color: isValid ? '#10b981' : '#ef4444' }}>
                Normale Felder: {normals}
              </div>
              {!isValid && (
                <div className="text-[#ef4444] font-body text-sm">
                  Minimum {MIN_NORMAL} erforderlich!
                </div>
              )}
            </div>
          </div>

          {/* Field count legend */}
          <div className="text-[#94a3b8] font-body text-sm leading-relaxed">
            Gesamt: 30 Felder
            <br />
            (1 Start + {cfg.shop} Shop + {cfg.bonus} Bonus + {cfg.trap} Falle + {cfg.event} Event + {normals} Normal)
          </div>

          <div className="flex-1" />

          {/* Buttons */}
          <div className="flex flex-col gap-3">
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
              disabled={!isValid || fields.length === 0}
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
