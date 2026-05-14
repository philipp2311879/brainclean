import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { ACHIEVEMENT_DEFS } from '../../lib/achievements'
import { soundManager } from '../../lib/soundManager'

const AUTO_DISMISS_MS = 4000

export function AchievementDisplay() {
  const { achievementQueue, dismissAchievement } = useGameStore()
  const current = achievementQueue[0] ?? null

  useEffect(() => {
    if (!current) return
    soundManager.playSFX('achievement')
    const t = setTimeout(() => dismissAchievement(), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [current?.achievementId, current?.teamId])

  const def = current ? ACHIEVEMENT_DEFS.find((a) => a.id === current.achievementId) : null

  return (
    <AnimatePresence>
      {current && def && (
        <motion.div
          key={`${current.achievementId}_${current.teamId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[300] pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <motion.div
            initial={{ scale: 0.5, y: -40, rotate: -4 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200 }}
            onClick={dismissAchievement}
            className="pointer-events-auto cursor-pointer text-center p-8 max-w-md w-full mx-4 rounded-3xl border-4 shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 40%, #fbbf24 100%)',
              borderColor: '#d97706',
            }}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 opacity-30 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.2, delay: 0.3 }}
              style={{ background: 'linear-gradient(90deg, transparent, white, transparent)', width: '60%' }}
            />

            {/* Trophy badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d97706] text-white font-body font-bold text-sm mb-4">
              🏅 ACHIEVEMENT FREIGESCHALTET!
            </div>

            {/* Achievement icon */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="text-8xl mb-3"
            >
              {def.icon}
            </motion.div>

            {/* Name */}
            <h2 className="font-display text-4xl text-[#0f172a] mb-2">{def.name}</h2>
            <p className="text-[#475569] font-body text-lg mb-4">{def.description}</p>

            {/* Team */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-[#d97706]">
              <span className="text-2xl">{current.teamEmoji}</span>
              <span className="font-display text-[#0f172a] text-lg">{current.teamName}</span>
            </div>

            <p className="text-[#92400e] font-body text-sm mt-4 opacity-70">Tippen zum Schließen</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
