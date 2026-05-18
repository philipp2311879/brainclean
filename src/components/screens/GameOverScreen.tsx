import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { CountingNumber } from '../ui/CountingNumber'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import { soundManager } from '../../lib/soundManager'

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#4f8cff', '#ffb830', '#f43f5e', '#34d399', '#8b5cf6'][i % 5],
    size: Math.random() * 10 + 4,
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 2,
    rotate: Math.random() * 360,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-30">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color }}
          animate={{ y: window.innerHeight + 40, rotate: p.rotate + 720, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: Infinity }}
        />
      ))}
    </div>
  )
}

interface RankGroup {
  rank: number
  crystals: number
  teams: import('../../types').Team[]
}

const PODIUM_COLORS = ['#eab308', '#94a3b8', '#f97316', '#64748b']
const PODIUM_MEDALS = ['🥇', '🥈', '🥉', '🏅']
const PODIUM_HEIGHTS = ['h-44', 'h-32', 'h-24', 'h-16']

export function GameOverScreen() {
  const { teams, newGame } = useGameStore()
  const [step, setStep] = useState(0)

  // Build rank groups (ties share a rank)
  const sortedTeams = [...teams].sort((a, b) => b.crystals - a.crystals)
  const rankGroups: RankGroup[] = []
  let rank = 1
  let i = 0
  while (i < sortedTeams.length) {
    const crystals = sortedTeams[i].crystals
    const group: typeof sortedTeams = []
    while (i < sortedTeams.length && sortedTeams[i].crystals === crystals) {
      group.push(sortedTeams[i])
      i++
    }
    rankGroups.push({ rank, crystals, teams: group })
    rank += group.length
  }

  const totalGroups = rankGroups.length

  useEffect(() => {
    // Reveal groups in reverse order (worst first), 700ms apart
    const timers = rankGroups.map((_, idx) =>
      setTimeout(() => setStep(totalGroups - idx), (idx + 1) * 700),
    )
    const winnerTimer = setTimeout(() => soundManager.playSFX('winner'), totalGroups * 700)
    return () => { timers.forEach(clearTimeout); clearTimeout(winnerTimer) }
  }, [])

  const allRevealed = step >= totalGroups

  // Podium order: rank2 left, rank1 center, rank3 right, rank4+ far right
  // Build display order from rankGroups
  const g0 = rankGroups[0]  // 1st place group
  const g1 = rankGroups[1]  // 2nd place group
  const g2 = rankGroups[2]  // 3rd place group
  const g3 = rankGroups[3]  // 4th place group

  const revealStep = (groupIdx: number) => step >= totalGroups - groupIdx

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-yellow-50 p-4 md:p-8 overflow-hidden relative">
      {allRevealed && <Confetti />}

      {/* Title */}
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-6 z-10">
        <h1 className="font-display text-5xl md:text-6xl text-text-primary drop-shadow-sm">
          🏆 SIEGEREHRUNG
        </h1>
        {g0 && allRevealed && (
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-text-secondary font-body text-xl mt-2">
            {g0.teams.length > 1 ? 'Geteilter 1. Platz: ' : 'Glückwunsch, '}
            {g0.teams.map((t, idx) => (
              <span key={t.id}>
                {idx > 0 && ' & '}
                <span className="font-display" style={{ color: resolveTeamColor(t.jerseyColor, t.avatar.color) }}>
                  {t.name}
                </span>
              </span>
            ))}
            !
          </motion.p>
        )}
      </motion.div>

      {/* Podium */}
      <div className="flex items-end gap-3 mb-8 z-10 flex-wrap justify-center">

        {/* 2nd place group */}
        <AnimatePresence>
          {g1 && revealStep(1) && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-2">
              <div className="flex gap-1 justify-center">
                {g1.teams.map((t) => (
                  <motion.div key={t.id} animate={{ y: [0, -5, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}>
                    <AvatarRingWrapper avatar={t.avatar} jerseyColor={t.jerseyColor} outerSize={70}
                      style={{ boxShadow: `0 6px 18px ${resolveTeamColor(t.jerseyColor, t.avatar.color)}55` }} />
                  </motion.div>
                ))}
              </div>
              <div className="font-display text-text-primary text-sm text-center">
                {g1.teams.map((t) => t.name).join(' & ')}
              </div>
              <div className="font-display text-accent-gold text-base">{g1.crystals} 💎</div>
              <div
                className={`${g1.teams.length > 1 ? 'w-44' : 'w-28'} ${PODIUM_HEIGHTS[1]} rounded-t-2xl flex items-end justify-center pb-3 border-2`}
                style={{ background: PODIUM_COLORS[1] + '22', borderColor: PODIUM_COLORS[1] + '66' }}
              >
                <span className="font-display text-3xl">{PODIUM_MEDALS[1]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1st place group */}
        <AnimatePresence>
          {g0 && revealStep(0) && (
            <motion.div initial={{ y: -60, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14 }} className="flex flex-col items-center gap-2">
              <div className="flex gap-2 justify-center">
                {g0.teams.map((t) => (
                  <motion.div key={t.id} animate={{ y: [0, -10, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                    <AvatarRingWrapper avatar={t.avatar} jerseyColor={t.jerseyColor} outerSize={g0.teams.length > 1 ? 96 : 120}
                      style={{ boxShadow: `0 10px 36px ${resolveTeamColor(t.jerseyColor, t.avatar.color)}88` }} />
                  </motion.div>
                ))}
              </div>
              <div className="font-display text-text-primary text-lg text-center">
                {g0.teams.map((t) => t.name).join(' & ')}
              </div>
              <div className="font-display text-2xl text-accent-gold">
                <CountingNumber target={g0.crystals} duration={2000} suffix=" 💎" />
              </div>
              <div
                className={`${g0.teams.length > 1 ? 'w-52' : 'w-36'} ${PODIUM_HEIGHTS[0]} rounded-t-2xl flex items-end justify-center pb-3 border-2`}
                style={{ background: PODIUM_COLORS[0] + '33', borderColor: PODIUM_COLORS[0] + '88' }}
              >
                <span className="font-display text-4xl">{PODIUM_MEDALS[0]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3rd place group */}
        <AnimatePresence>
          {g2 && revealStep(2) && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-2">
              <div className="flex gap-1 justify-center">
                {g2.teams.map((t) => (
                  <motion.div key={t.id} animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.7 }}>
                    <AvatarRingWrapper avatar={t.avatar} jerseyColor={t.jerseyColor} outerSize={60}
                      style={{ boxShadow: `0 4px 14px ${resolveTeamColor(t.jerseyColor, t.avatar.color)}44` }} />
                  </motion.div>
                ))}
              </div>
              <div className="font-display text-text-primary text-sm text-center">
                {g2.teams.map((t) => t.name).join(' & ')}
              </div>
              <div className="font-display text-accent-gold text-sm">{g2.crystals} 💎</div>
              <div
                className={`${g2.teams.length > 1 ? 'w-36' : 'w-24'} ${PODIUM_HEIGHTS[2]} rounded-t-2xl flex items-end justify-center pb-3 border-2`}
                style={{ background: PODIUM_COLORS[2] + '22', borderColor: PODIUM_COLORS[2] + '66' }}
              >
                <span className="font-display text-2xl">{PODIUM_MEDALS[2]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4th place group */}
        <AnimatePresence>
          {g3 && revealStep(3) && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-2">
              <div className="flex gap-1 justify-center">
                {g3.teams.map((t) => (
                  <AvatarRingWrapper key={t.id} avatar={t.avatar} jerseyColor={t.jerseyColor} outerSize={52} />
                ))}
              </div>
              <div className="font-display text-text-secondary text-xs text-center">
                {g3.teams.map((t) => t.name).join(' & ')}
              </div>
              <div className="font-display text-text-secondary text-xs">{g3.crystals} 💎</div>
              <div
                className={`${g3.teams.length > 1 ? 'w-32' : 'w-20'} ${PODIUM_HEIGHTS[3]} rounded-t-2xl flex items-end justify-center pb-2 border-2`}
                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                <span className="font-display text-xl">{PODIUM_MEDALS[3]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {allRevealed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10">
          <Button size="xl" onClick={newGame}>🔄 NEUES SPIEL</Button>
        </motion.div>
      )}
    </div>
  )
}
