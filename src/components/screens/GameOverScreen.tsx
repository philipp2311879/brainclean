import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { CountingNumber } from '../ui/CountingNumber'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import type { Team } from '../../types'

const TITLE_PAUSE = 2000
const PER_PLACE   = 2500
const FIRST_EXTRA = 1500

const PODIUM_COLORS = ['#eab308', '#94a3b8', '#f97316', '#64748b']
const PODIUM_MEDALS = ['🥇', '🥈', '🥉', '🏅']

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#4f8cff', '#ffb830', '#f43f5e', '#34d399', '#8b5cf6'][i % 5],
    size: Math.random() * 10 + 4,
    delay: Math.random() * 3,
    duration: Math.random() * 3 + 3,
    rotate: Math.random() * 360,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color }}
          animate={{ y: window.innerHeight + 40, rotate: p.rotate + 720, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: Infinity }}
        />
      ))}
    </div>
  )
}

interface RankGroup {
  rank: number
  crystals: number
  teams: Team[]
}

function buildRankGroups(teams: Team[]): RankGroup[] {
  const sorted = [...teams].sort((a, b) => b.crystals - a.crystals)
  const groups: RankGroup[] = []
  let rank = 1
  let i = 0
  while (i < sorted.length) {
    const crystals = sorted[i].crystals
    const group: Team[] = []
    while (i < sorted.length && sorted[i].crystals === crystals) {
      group.push(sorted[i])
      i++
    }
    groups.push({ rank, crystals, teams: group })
    rank += group.length
  }
  return groups
}

interface PodiumColumnProps {
  group: RankGroup
  gi: number      // 0 = 1st place, 1 = 2nd, etc.
  visible: boolean
}

function PodiumColumn({ group, gi, visible }: PodiumColumnProps) {
  const isFirst = gi === 0
  const color = PODIUM_COLORS[Math.min(gi, 3)]

  const avatarSizes = [120, 70, 60, 52]
  const avatarSize = isFirst && group.teams.length > 1 ? 96 : avatarSizes[Math.min(gi, 3)]

  const podiumH = [176, 128, 96, 64][Math.min(gi, 3)]
  const podiumW = Math.max(
    [144, 112, 96, 80][Math.min(gi, 3)],
    group.teams.length > 1 ? group.teams.length * 96 : 0
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={isFirst ? { y: -80, opacity: 0, scale: 0.75 } : { y: 70, opacity: 0 }}
          animate={isFirst ? { y: 0, opacity: 1, scale: 1 } : { y: 0, opacity: 1 }}
          transition={{ duration: isFirst ? 1.1 : 0.85, ease: 'easeInOut' }}
          className="flex flex-col items-center"
        >
          {/* Avatars */}
          <div className="flex gap-1.5 justify-center mb-2">
            {group.teams.map((t, idx) => (
              <motion.div
                key={t.id}
                animate={{ y: [0, isFirst ? -10 : -5, 0] }}
                transition={{ duration: isFirst ? 1.8 : 2.3, repeat: Infinity, delay: idx * 0.35 }}
              >
                <AvatarRingWrapper
                  avatar={t.avatar}
                  jerseyColor={t.jerseyColor}
                  outerSize={avatarSize}
                  style={{
                    boxShadow: `0 ${isFirst ? 10 : 4}px ${isFirst ? 32 : 14}px ${resolveTeamColor(t.jerseyColor, t.avatar.color)}${isFirst ? '88' : '44'}`,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Team name(s) */}
          <div
            className={`font-display text-center text-[#0f172a] leading-tight mb-0.5 ${isFirst ? 'text-xl' : 'text-sm'}`}
          >
            {group.teams.map((t) => t.name).join(' & ')}
          </div>

          {/* Crystals */}
          <div className={`font-display text-[#f59e0b] mb-2 ${isFirst ? 'text-2xl' : 'text-sm'}`}>
            {isFirst
              ? <CountingNumber target={group.crystals} duration={1800} suffix=" 💎" />
              : `${group.crystals} 💎`
            }
          </div>

          {/* Podium bar */}
          <motion.div
            className="rounded-t-2xl flex items-end justify-center pb-3 border-2"
            style={{
              width: podiumW,
              height: podiumH,
              background: color + (isFirst ? '33' : '20'),
              borderColor: color + (isFirst ? '99' : '55'),
            }}
            animate={isFirst ? {
              boxShadow: [`0 0 0px ${color}00`, `0 0 28px ${color}66`, `0 0 0px ${color}00`],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className={`font-display ${isFirst ? 'text-4xl' : 'text-2xl'}`}>
              {PODIUM_MEDALS[Math.min(gi, 3)]}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function GameOverScreen() {
  const { teams, newGame } = useGameStore()
  const [revealedCount, setRevealedCount] = useState(0)
  const [allDone, setAllDone] = useState(false)

  const rankGroups = buildRankGroups(teams)
  const totalGroups = rankGroups.length

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let idx = 0; idx < totalGroups; idx++) {
      timers.push(
        setTimeout(() => setRevealedCount(idx + 1), TITLE_PAUSE + idx * PER_PLACE)
      )
    }
    timers.push(
      setTimeout(
        () => setAllDone(true),
        TITLE_PAUSE + (totalGroups - 1) * PER_PLACE + FIRST_EXTRA
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // gi=0 (1st) is visible last (revealedCount >= totalGroups)
  // gi=totalGroups-1 (worst) is visible first (revealedCount >= 1)
  const isRevealed = (gi: number) => revealedCount >= totalGroups - gi

  const g0 = rankGroups[0]
  const g1 = rankGroups[1]
  const g2 = rankGroups[2]
  const g3 = rankGroups[3]

  return (
    <div
      className="w-full h-full flex flex-col pt-16 overflow-hidden relative"
      style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #eef2ff 40%, #fefce8 100%)' }}
    >
      {allDone && <Confetti />}

      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 text-center py-5 px-4 z-10"
      >
        <h1 className="font-display text-5xl text-[#0f172a] drop-shadow-sm">
          🏆 SIEGEREHRUNG 🏆
        </h1>
        <AnimatePresence mode="wait">
          {allDone && g0 ? (
            <motion.p
              key="winner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-body text-xl text-[#475569] mt-1"
            >
              {g0.teams.length > 1 ? 'Geteilter 1. Platz: ' : 'Glückwunsch, '}
              {g0.teams.map((t, idx) => (
                <span key={t.id}>
                  {idx > 0 && ' & '}
                  <span className="font-display" style={{ color: resolveTeamColor(t.jerseyColor, t.avatar.color) }}>
                    {t.name}
                  </span>
                </span>
              ))}!
            </motion.p>
          ) : revealedCount > 0 ? (
            <motion.div
              key="dots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center gap-1.5 mt-3"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-[#4f8cff]"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 0.9, delay: i * 0.28, repeat: Infinity }}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Podium — display order: 2nd | 1st | 3rd | 4th */}
      <div className="flex-1 flex items-end justify-center gap-4 px-6 pb-4 z-10">
        {g1 && <PodiumColumn group={g1} gi={1} visible={isRevealed(1)} />}
        {g0 && <PodiumColumn group={g0} gi={0} visible={isRevealed(0)} />}
        {g2 && <PodiumColumn group={g2} gi={2} visible={isRevealed(2)} />}
        {g3 && <PodiumColumn group={g3} gi={3} visible={isRevealed(3)} />}
      </div>

      {/* Fixed footer */}
      <div
        className="flex-shrink-0 bg-white border-t border-[#e5e7eb] p-4 flex justify-center z-10"
        style={{ minHeight: 80 }}
      >
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <Button size="xl" onClick={newGame}>🔄 NEUES SPIEL</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
