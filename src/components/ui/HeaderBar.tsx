import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { AvatarRingWrapper } from './AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import type { Team } from '../../types'

// ── Phases where back / info button appear ──────────────────────────────────
const BACK_PHASES = new Set([
  'setup', 'teamSetup', 'mapSetup', 'minigameActive',
  'placementInput', 'crystalAward', 'itemPhase', 'rolling',
])
const INFO_PHASES = new Set([
  'minigameAnnounce', 'minigameActive', 'placementInput',
  'crystalAward', 'itemPhase', 'rolling', 'walking', 'roundEnd', 'streakShop',
])
const ABORT_PHASES = new Set([
  'finaleAnnounce', 'minigameAnnounce', 'minigameActive', 'placementInput',
  'streakShop', 'crystalAward', 'itemPhase', 'rolling', 'walking', 'roundEnd',
])

// ── Animated crystal counter per team ────────────────────────────────────────
function CrystalCounter({ team }: { team: Team }) {
  const [displayed, setDisplayed] = useState(team.crystals)
  const [delta, setDelta] = useState<number | null>(null)
  const prevRef = useRef(team.crystals)
  const rafRef = useRef<number>(0)
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const newVal = team.crystals
    const oldVal = prevRef.current
    if (newVal === oldVal) return
    prevRef.current = newVal

    const diff = newVal - oldVal
    setDelta(diff)

    cancelAnimationFrame(rafRef.current)
    clearTimeout(badgeTimerRef.current)

    const start = displayed
    const startTime = performance.now()
    const duration = Math.min(1600, 400 + Math.abs(diff) * 4)

    const animate = (now: number) => {
      const elapsed = Math.min(now - startTime, duration)
      const t = 1 - Math.pow(1 - elapsed / duration, 2.5)
      setDisplayed(Math.round(start + diff * t))
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayed(newVal)
        badgeTimerRef.current = setTimeout(() => setDelta(null), 1600)
      }
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(badgeTimerRef.current)
    }
  }, [team.crystals])

  const isGain = delta !== null && delta > 0
  const isLoss = delta !== null && delta < 0
  const jc = team.jerseyColor
  const tColor = resolveTeamColor(jc, team.avatar.color)
  const textColor = isGain ? '#10b981' : isLoss ? '#ef4444' : tColor

  const streakFlames = team.consecutiveFirstPlace >= 2
    ? '🔥'.repeat(Math.min(team.consecutiveFirstPlace - 1, 4))
    : ''

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-1.5 border-2 relative select-none"
      style={{ background: '#f8fafc', borderColor: tColor, minWidth: 90 }}
    >
      <AvatarRingWrapper avatar={team.avatar} jerseyColor={jc} outerSize={32} />
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-body text-[#475569] font-bold leading-none mb-0.5 truncate max-w-[60px]">
          {team.name}{streakFlames && <span className="ml-0.5">{streakFlames}</span>}
        </span>
        <motion.span
          animate={isGain || isLoss ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="font-display text-lg leading-none transition-colors duration-150"
          style={{ color: textColor }}
        >
          {displayed}
          <span className="text-[#f59e0b] ml-0.5 text-sm">💎</span>
        </motion.span>
      </div>

      <AnimatePresence>
        {delta !== null && (
          <motion.span
            key={`${team.id}-${delta}-${Date.now()}`}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -26 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute -top-0.5 left-1/2 font-display text-base whitespace-nowrap pointer-events-none"
            style={{
              color: isGain ? '#10b981' : '#ef4444',
              transform: 'translateX(-50%)',
              textShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
          >
            {isGain ? '+' : ''}{delta}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Header bar ───────────────────────────────────────────────────────────────
export function HeaderBar() {
  const {
    teams, currentRound, totalRounds, phase,
    goBackToPreviousDecision, showInfoOverlay, setShowInfoOverlay, abortGame,
  } = useGameStore()

  const [showAbortConfirm, setShowAbortConfirm] = useState(false)

  if (phase === 'title' || phase === 'setup' || phase === 'teamSetup' || phase === 'mapSetup' || phase === 'fredEvent') return null

  const showBack = BACK_PHASES.has(phase)
  const showInfo = INFO_PHASES.has(phase)
  const showAbort = ABORT_PHASES.has(phase)

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#e5e7eb] shadow-card flex items-center px-4 gap-2">
        {/* Left: back + info + round */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={goBackToPreviousDecision}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#d1d5db] bg-white text-[#475569] font-body font-semibold text-sm cursor-pointer hover:border-[#4f8cff] hover:text-[#4f8cff] transition-all"
            >
              ←
            </motion.button>
          )}
          {showInfo && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowInfoOverlay(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#d1d5db] bg-white text-[#475569] font-body font-semibold text-sm cursor-pointer hover:border-[#4f8cff] hover:text-[#4f8cff] transition-all"
            >
              ℹ️
            </motion.button>
          )}
          <div className="font-display text-[#475569] text-base whitespace-nowrap ml-1">
            <span className="text-[#4f8cff]">{currentRound}</span>
            <span className="text-[#d1d5db]">/{totalRounds}</span>
          </div>
        </div>

        {/* Center: logo */}
        <div className="flex-1 flex justify-center">
          <span className="font-display text-lg tracking-widest text-[#0f172a]">
            BRAIN<span className="text-[#4f8cff]">ARENA</span>
          </span>
        </div>

        {/* Right: abort button + crystal counters */}
        <div className="flex gap-2 items-center flex-shrink-0">
          {showAbort && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAbortConfirm(true)}
              title="Spiel beenden"
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#d1d5db] bg-white text-[#475569] cursor-pointer hover:border-[#ef4444] hover:text-[#ef4444] transition-all text-base select-none"
            >
              🏁
            </motion.button>
          )}
          {teams.map((team) => (
            <CrystalCounter key={team.id} team={team} />
          ))}
        </div>
      </div>

      {/* Abort confirmation modal */}
      <AnimatePresence>
        {showAbortConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
            onClick={() => setShowAbortConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border-2 border-[#ef4444]"
            >
              <div className="text-5xl text-center mb-4">🏁</div>
              <h2 className="font-display text-2xl text-[#0f172a] mb-2 text-center">Spiel beenden?</h2>
              <p className="font-body text-[#475569] text-center mb-6">
                Zur Siegerehrung mit dem aktuellen Kristallstand?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAbortConfirm(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-[#d1d5db] font-display text-[#475569] hover:border-[#94a3b8] transition-all cursor-pointer"
                >
                  ABBRECHEN
                </button>
                <button
                  onClick={() => { abortGame(); setShowAbortConfirm(false) }}
                  className="flex-1 py-3 rounded-xl border-2 border-[#ef4444] bg-[#ef4444] font-display text-white hover:bg-[#dc2626] transition-all cursor-pointer"
                >
                  JA, BEENDEN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
