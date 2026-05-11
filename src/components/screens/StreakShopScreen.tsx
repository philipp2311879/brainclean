import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { ShopOverlay } from '../overlays/ShopOverlay'

export function StreakShopScreen() {
  const { streakShopTeamId, teams, closeStreakShop } = useGameStore()
  const [shopVisible, setShopVisible] = useState(false)

  const team = teams.find((t) => t.id === streakShopTeamId)
  const streakLevel = team?.consecutiveFirstPlace ?? 2
  const isMegaStreak = streakLevel >= 3
  const flames = '🔥'.repeat(Math.min(streakLevel, 5))

  useEffect(() => {
    const t = setTimeout(() => setShopVisible(true), 1600)
    return () => clearTimeout(t)
  }, [])

  if (!team) return null

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #fef3c7 40%, #ffedd5 100%)' }}
    >
      {/* Background fire particles */}
      {Array.from({ length: 14 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl pointer-events-none select-none"
          style={{ left: `${6 + i * 6.5}%`, bottom: -40 }}
          animate={{ y: [0, -500], opacity: [0, 0.8, 0.8, 0], scale: [0.7, 1.2, 0.9, 0.5] }}
          transition={{ duration: 2.5 + Math.random() * 1.5, delay: i * 0.18, repeat: Infinity, ease: 'easeOut' }}
        >
          {i % 3 === 0 ? '🔥' : i % 3 === 1 ? '✨' : '💫'}
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 180 }}
        className="text-center relative z-10 px-8"
      >
        {/* Streak flames */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="text-7xl mb-2"
        >
          {flames}
        </motion.div>

        {/* Label */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-display mb-2"
          style={{
            fontSize: '3.5rem',
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {isMegaStreak ? 'MEGA-STREAK!' : 'STREAK!'}
        </motion.h1>

        {/* Team name */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-4xl border-3 border-[#f97316] shadow-lg"
            style={{ background: team.avatar.bgColor, borderWidth: 3, borderColor: team.avatar.color }}
          >
            {team.avatar.emoji}
          </div>
          <div className="text-left">
            <div className="font-display text-3xl text-[#0f172a]">{team.name}</div>
            <div className="font-body text-[#f97316] font-bold">
              {streakLevel}× in Folge 1. Platz!
            </div>
          </div>
        </motion.div>

        {/* Bonus crystal display */}
        {isMegaStreak && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#fef3c7] border-2 border-[#f59e0b] mb-4"
          >
            <span className="text-2xl">⭐</span>
            <span className="font-display text-xl text-[#d97706]">+50 Bonus-Kristalle!</span>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="font-body text-[#475569] text-lg"
        >
          Sofort-Zugang zum Shop! 🏪
        </motion.p>
      </motion.div>

      {/* Shop overlay appears after announcement */}
      <AnimatePresence>
        {shopVisible && (
          <ShopOverlay teamId={team.id} onClose={closeStreakShop} />
        )}
      </AnimatePresence>
    </div>
  )
}
