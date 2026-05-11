import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/Button'
import { useGameStore } from '../../store/gameStore'
import type { EventData, Team } from '../../types'

interface EventOverlayProps {
  event: EventData
  onConfirm: () => void
}

// ─── Per-event visual animations ───────────────────────────────────────────

function CrystalRainAnim() {
  const drops = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    delay: Math.random() * 1.5,
    size: 20 + Math.random() * 16,
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      {drops.map((d) => (
        <motion.div
          key={d.id}
          className="absolute select-none"
          style={{ left: `${d.x}%`, top: -40, fontSize: d.size }}
          animate={{ y: 500, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, delay: d.delay, repeat: Infinity, ease: 'easeIn' }}
        >
          💎
        </motion.div>
      ))}
    </div>
  )
}

function CrystalRainTeams({ teams }: { teams: Team[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      {teams.map((t) => (
        <motion.div
          key={t.id}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 0.3 }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2"
          style={{ borderColor: '#10b981', background: '#f0fdf4' }}
        >
          <span className="text-xl">{t.avatar.emoji}</span>
          <span className="font-display text-lg text-[#10b981]">+50 💎</span>
        </motion.div>
      ))}
    </div>
  )
}

function TaxAnim({ teams }: { teams: Team[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      {teams.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.6, repeat: 3 }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2"
          style={{ borderColor: '#ef4444', background: '#fee2e2' }}
        >
          <span className="text-xl">{t.avatar.emoji}</span>
          <span className="font-display text-lg text-[#ef4444]">−25%</span>
        </motion.div>
      ))}
    </div>
  )
}

function RevolutionAnim({ teams }: { teams: Team[] }) {
  const sorted = [...teams].sort((a, b) => b.crystals - a.crystals)
  const richest = sorted[0]
  const poorest = sorted[sorted.length - 1]
  if (!richest || !poorest || richest.id === poorest.id) return null

  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, 32, 0] }}
        transition={{ duration: 1.2, repeat: 2 }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-4xl">{richest.avatar.emoji}</span>
        <span className="font-display text-base text-[#f59e0b]">{richest.crystals} 💎</span>
        <span className="text-xs text-[#475569] font-body">reich</span>
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 0.4, repeat: 4 }}
        className="text-3xl"
      >
        ⇌
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, -32, 0] }}
        transition={{ duration: 1.2, repeat: 2 }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-4xl">{poorest.avatar.emoji}</span>
        <span className="font-display text-base text-[#94a3b8]">{poorest.crystals} 💎</span>
        <span className="text-xs text-[#475569] font-body">arm</span>
      </motion.div>
    </div>
  )
}

function EarthquakeAnim({ teams }: { teams: Team[] }) {
  return (
    <div className="mb-4">
      <motion.div
        animate={{ x: [0, -7, 7, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.8, repeat: 2 }}
        className="flex gap-3 justify-center mb-3"
      >
        {teams.map((t, i) => (
          <motion.div
            key={t.id}
            animate={{ y: [0, -14, 0, -9, 0], rotate: [0, -10, 10, -5, 0] }}
            transition={{ duration: 0.6, delay: i * 0.12, repeat: 2 }}
            className="text-3xl"
          >
            {t.avatar.emoji}
          </motion.div>
        ))}
      </motion.div>
      {/* New positions after shuffle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="flex flex-wrap gap-2 justify-center"
      >
        {teams.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-sm"
            style={{ borderColor: t.avatar.color, background: t.avatar.bgColor }}
          >
            <span>{t.avatar.emoji}</span>
            <span className="font-display" style={{ color: t.avatar.color }}>→ Feld {t.position}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function JackpotAnim({ jackpotFieldIndex }: { jackpotFieldIndex: number | null }) {
  if (jackpotFieldIndex === null) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14, delay: 0.4 }}
      className="mb-4 px-6 py-3 rounded-2xl border-2 border-[#f59e0b] bg-[#fffbeb] text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="font-display text-3xl text-[#f59e0b]"
      >
        ✨ Feld {jackpotFieldIndex} ✨
      </motion.div>
      <div className="font-body text-[#92400e] text-sm mt-1">
        Wer dieses Feld betritt, erhält 300 💎!
      </div>
    </motion.div>
  )
}

function BountyAnim({ teams, bountyTargetTeamId }: { teams: Team[]; bountyTargetTeamId: string | null }) {
  const target = teams.find((t) => t.id === bountyTargetTeamId)
  if (!target) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14, delay: 0.3 }}
      className="mb-4 px-6 py-3 rounded-2xl border-2 border-[#ef4444] bg-[#fee2e2] text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 0.7, repeat: Infinity }}
        className="text-4xl mb-1"
      >
        {target.avatar.emoji}
      </motion.div>
      <div className="font-display text-2xl text-[#ef4444]">{target.name}</div>
      <div className="font-body text-[#b91c1c] text-sm mt-1">
        Wer dieses Team beim Minispiel schlägt, erhält +150 💎!
      </div>
    </motion.div>
  )
}

function DarkRoundAnim() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-4 px-6 py-3 rounded-2xl border-2 border-[#475569] bg-[#f1f5f9] text-center"
    >
      <div className="font-display text-xl text-[#0f172a]">Nächste Runde: Platz 1 = 0 💎</div>
      <div className="font-body text-[#475569] text-sm mt-1">
        Wer das Minispiel gewinnt, schaut in die Röhre!
      </div>
    </motion.div>
  )
}

// ─── Main overlay ──────────────────────────────────────────────────────────

const AUTO_CONFIRM_DELAY = 3000

export function EventOverlay({ event, onConfirm }: EventOverlayProps) {
  const { teams, jackpotFieldIndex, bountyTargetTeamId } = useGameStore()
  const [canConfirm, setCanConfirm] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCanConfirm(true), AUTO_CONFIRM_DELAY)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: `radial-gradient(circle at 50% 40%, ${event.color}22 0%, rgba(0,0,0,0.45) 70%)` }}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -4 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 220 }}
        className="card p-8 text-center w-full max-w-lg mx-4 relative overflow-hidden"
        style={{ borderColor: event.color, borderWidth: 3 }}
      >
        {/* Colour bar */}
        <div className="absolute top-0 left-0 right-0 h-2 rounded-t-2xl" style={{ background: event.color }} />

        {/* Full-card background animation for crystal rain */}
        {event.id === 'crystal_rain' && <CrystalRainAnim />}

        <div className="relative z-10">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.0, repeat: Infinity }}
            className="text-8xl mb-3"
          >
            {event.icon}
          </motion.div>

          <h2 className="font-display text-4xl mb-3" style={{ color: event.color }}>
            {event.name}
          </h2>

          {/* Per-event content */}
          {event.id === 'crystal_rain'  && <CrystalRainTeams teams={teams} />}
          {event.id === 'revolution'    && <RevolutionAnim teams={teams} />}
          {event.id === 'earthquake'    && <EarthquakeAnim teams={teams} />}
          {event.id === 'tax'           && <TaxAnim teams={teams} />}
          {event.id === 'jackpot_field' && <JackpotAnim jackpotFieldIndex={jackpotFieldIndex} />}
          {event.id === 'bounty'        && <BountyAnim teams={teams} bountyTargetTeamId={bountyTargetTeamId} />}
          {event.id === 'dark_round'    && <DarkRoundAnim />}

          <p className="text-[#475569] font-body text-xl leading-relaxed mb-6">
            {event.description}
          </p>

          <AnimatePresence>
            {canConfirm ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Button size="xl" onClick={onConfirm} fullWidth>✅ VERSTANDEN!</Button>
              </motion.div>
            ) : (
              <motion.div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: event.color }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.9, delay: i * 0.3, repeat: Infinity }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
