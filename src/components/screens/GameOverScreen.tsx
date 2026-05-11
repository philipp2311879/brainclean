import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { CountingNumber } from '../ui/CountingNumber'

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

const PODIUM_H = ['h-44', 'h-32', 'h-24', 'h-16']
const PODIUM_MEDALS = ['🥇', '🥈', '🥉', '🏅']
const PODIUM_COLORS = ['#eab308', '#94a3b8', '#f97316', '#94a3b8']

export function GameOverScreen() {
  const { teams, newGame } = useGameStore()
  const [step, setStep] = useState(0)

  const sorted = [...teams].sort((a, b) => b.crystals - a.crystals)

  useEffect(() => {
    const delays = [600, 1300, 2000, 2700]
    const timers = delays.map((d, i) => setTimeout(() => setStep(i + 1), d))
    return () => timers.forEach(clearTimeout)
  }, [])

  const winner = sorted[0]

  // Build podium order: 2nd, 1st, 3rd (classic podium layout), 4th on right
  const podiumOrder = [sorted[1], sorted[0], sorted[2], sorted[3]].filter(Boolean)
  const podiumRanks = [1, 0, 2, 3] // indices into sorted

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-yellow-50 p-8 overflow-hidden relative">
      {step >= sorted.length && <Confetti />}

      {/* Title */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8 z-10"
      >
        <h1 className="font-display text-6xl text-text-primary drop-shadow-sm">
          🏆 SIEGEREHRUNG
        </h1>
        {winner && step >= sorted.length && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-text-secondary font-body text-2xl mt-2"
          >
            Glückwunsch,{' '}
            <span className="font-display" style={{ color: winner.avatar.color }}>
              {winner.name}
            </span>
            !
          </motion.p>
        )}
      </motion.div>

      {/* Podium */}
      <div className="flex items-end gap-4 mb-10 z-10">
        {/* 2nd place */}
        <AnimatePresence>
          {step >= 2 && sorted[1] && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4"
                style={{
                  background: sorted[1].avatar.bgColor,
                  borderColor: sorted[1].avatar.color,
                  boxShadow: `0 6px 20px ${sorted[1].avatar.color}66`,
                }}
              >
                {sorted[1].avatar.emoji}
              </motion.div>
              <div className="font-display text-text-primary text-base">{sorted[1].name}</div>
              <div className="font-display text-accent-gold text-lg">{sorted[1].crystals} 💎</div>
              <div
                className={`w-28 ${PODIUM_H[1]} rounded-t-2xl flex items-end justify-center pb-3 border-2`}
                style={{ background: PODIUM_COLORS[1] + '22', borderColor: PODIUM_COLORS[1] + '66' }}
              >
                <span className="font-display text-3xl">{PODIUM_MEDALS[1]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1st place */}
        <AnimatePresence>
          {step >= sorted.length && sorted[0] && (
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="w-32 h-32 rounded-full flex items-center justify-center text-6xl border-4"
                style={{
                  background: sorted[0].avatar.bgColor,
                  borderColor: sorted[0].avatar.color,
                  boxShadow: `0 10px 40px ${sorted[0].avatar.color}88`,
                }}
              >
                {sorted[0].avatar.emoji}
              </motion.div>
              <div className="font-display text-text-primary text-xl">{sorted[0].name}</div>
              <div className="font-display text-2xl text-accent-gold">
                <CountingNumber target={sorted[0].crystals} duration={2000} suffix=" 💎" />
              </div>
              <div
                className={`w-36 ${PODIUM_H[0]} rounded-t-2xl flex items-end justify-center pb-3 border-2`}
                style={{ background: PODIUM_COLORS[0] + '33', borderColor: PODIUM_COLORS[0] + '88' }}
              >
                <span className="font-display text-4xl">{PODIUM_MEDALS[0]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3rd place */}
        <AnimatePresence>
          {step >= 3 && sorted[2] && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.7 }}
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
                style={{
                  background: sorted[2].avatar.bgColor,
                  borderColor: sorted[2].avatar.color,
                  boxShadow: `0 4px 14px ${sorted[2].avatar.color}44`,
                  border: `3px solid ${sorted[2].avatar.color}`,
                }}
              >
                {sorted[2].avatar.emoji}
              </motion.div>
              <div className="font-display text-text-primary text-sm">{sorted[2].name}</div>
              <div className="font-display text-accent-gold text-base">{sorted[2].crystals} 💎</div>
              <div
                className={`w-24 ${PODIUM_H[2]} rounded-t-2xl flex items-end justify-center pb-3 border-2`}
                style={{ background: PODIUM_COLORS[2] + '22', borderColor: PODIUM_COLORS[2] + '66' }}
              >
                <span className="font-display text-2xl">{PODIUM_MEDALS[2]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4th place */}
        <AnimatePresence>
          {step >= 1 && sorted[3] && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2"
                style={{ background: sorted[3].avatar.bgColor, borderColor: sorted[3].avatar.color }}
              >
                {sorted[3].avatar.emoji}
              </div>
              <div className="font-display text-text-secondary text-sm">{sorted[3].name}</div>
              <div className="font-display text-text-secondary text-sm">{sorted[3].crystals} 💎</div>
              <div
                className={`w-20 ${PODIUM_H[3]} rounded-t-2xl flex items-end justify-center pb-2 border-2`}
                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                <span className="font-display text-xl">{PODIUM_MEDALS[3]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step >= sorted.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10"
        >
          <Button size="xl" onClick={newGame}>
            🔄 NEUES SPIEL
          </Button>
        </motion.div>
      )}
    </div>
  )
}
