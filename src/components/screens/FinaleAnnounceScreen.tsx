import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { soundManager } from '../../lib/soundManager'

const STARS = Array.from({ length: 20 }, (_, i) => ({
  x: 5 + Math.random() * 90,
  y: 5 + Math.random() * 90,
  size: 12 + Math.random() * 20,
  delay: Math.random() * 0.8,
}))

export function FinaleAnnounceScreen() {
  const { darkRoundActive, totalRounds } = useGameStore()
  const nextPhase = useGameStore((s) => s.phase)
  const [_, setPhase] = useState(false)

  useEffect(() => {
    soundManager.playSFX('finale_announce')
    const t = setTimeout(() => {
      useGameStore.setState({ phase: 'minigameAnnounce' })
    }, 3500)
    return () => clearTimeout(t)
  }, [])

  const isQuadruple = darkRoundActive
  const label = isQuadruple ? '🔥 VIERFACHE KRISTALLE! 🔥' : '💎 DOPPELTE KRISTALLE! 💎'
  const sublabel = isQuadruple
    ? 'Finale + Dunkle Runde = 4× Kristalle für alle!'
    : 'Die letzte Runde zählt doppelt!'

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 80%, #1e3a5f 100%)' }}
    >
      {/* Stars */}
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-300 pointer-events-none select-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.8, delay: s.delay, repeat: Infinity }}
        >
          ✨
        </motion.div>
      ))}

      {/* FINALE text */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 180 }}
        className="text-center z-10"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-9xl mb-4"
        >
          🏆
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="font-display mb-3"
          style={{
            fontSize: '5.5rem',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fde68a, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            lineHeight: 1,
          }}
        >
          FINALE!
        </motion.h1>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.55, type: 'spring' }}
          className="font-display text-3xl mb-3"
          style={{ color: isQuadruple ? '#ef4444' : '#fbbf24' }}
        >
          {label}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="font-body text-[#cbd5e1] text-xl"
        >
          {sublabel}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="font-display text-[#475569] text-base mt-6"
        >
          Runde {totalRounds} von {totalRounds}
        </motion.p>
      </motion.div>
    </div>
  )
}
