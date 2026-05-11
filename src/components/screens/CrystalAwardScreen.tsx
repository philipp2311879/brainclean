import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣']
const MEDAL_COLORS = ['#d97706', '#64748b', '#ea580c', '#94a3b8']
const MEDAL_LABELS = ['1. Platz', '2. Platz', '3. Platz', '4. Platz']

function CrystalParticle({ color }: { color: string }) {
  const angle = Math.random() * 360
  const dist = 40 + Math.random() * 60
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ background: color, width: 10, height: 10, left: '50%', top: '50%', marginLeft: -5, marginTop: -5 }}
      initial={{ x: 0, y: 0, opacity: 1 }}
      animate={{ x: Math.cos(angle * Math.PI / 180) * dist, y: Math.sin(angle * Math.PI / 180) * dist, opacity: 0, scale: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
  )
}

export function CrystalAwardScreen() {
  const { teams, crystalAwards, finishCrystalAward } = useGameStore()

  // Sort by placement for display (1st place first)
  const sorted = [...teams]
    .filter((t) => t.placement !== null)
    .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99))

  // Animated award amounts (0 → actual award over time)
  const [animatedAwards, setAnimatedAwards] = useState<Record<string, number>>({})
  const [done, setDone] = useState(false)
  const [particles, setParticles] = useState<{ id: number; color: string }[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Small delay before starting, then animate all simultaneously
    const startDelay = setTimeout(() => {
      const duration = 2400
      const startTime = performance.now()

      // Spawn particles
      const pts = sorted.flatMap((t) =>
        Array.from({ length: 8 }, (_, i) => ({ id: Date.now() + i + Math.random() * 1000, color: t.avatar.color }))
      )
      setParticles(pts)

      const frame = (now: number) => {
        const elapsed = Math.min(now - startTime, duration)
        const t = 1 - Math.pow(1 - elapsed / duration, 2.5) // ease-out
        const newAwards: Record<string, number> = {}
        for (const team of sorted) {
          newAwards[team.id] = Math.round((crystalAwards[team.id] ?? 0) * t)
        }
        setAnimatedAwards(newAwards)
        if (elapsed < duration) {
          rafRef.current = requestAnimationFrame(frame)
        } else {
          setDone(true)
          setParticles([])
        }
      }
      rafRef.current = requestAnimationFrame(frame)
    }, 500)

    return () => {
      clearTimeout(startDelay)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center screen-base p-8 pt-20">
      {/* Title */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="font-display text-5xl text-[#0f172a]">
          💎 <span className="text-[#f59e0b]">KRISTALLVERGABE</span>
        </h1>
        <p className="text-[#475569] font-body text-xl mt-2">Alle Teams erhalten ihre Runden-Kristalle</p>
      </motion.div>

      {/* All teams grid */}
      <div className="flex flex-wrap gap-5 justify-center mb-10 w-full max-w-4xl">
        {sorted.map((team, rank) => {
          const award = crystalAwards[team.id] ?? 0
          const animated = animatedAwards[team.id] ?? 0
          const total = team.crystals + animated
          const teamParticles = particles.filter((p) => p.color === team.avatar.color)

          return (
            <motion.div
              key={team.id}
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: rank * 0.1, type: 'spring', damping: 18 }}
              className="card p-6 flex flex-col items-center w-52 relative overflow-hidden"
              style={{ borderColor: team.avatar.color, borderWidth: 2 }}
            >
              {/* Particles */}
              <div className="absolute inset-0 pointer-events-none">
                {teamParticles.map((p) => <CrystalParticle key={p.id} color={p.color} />)}
              </div>

              {/* Placement medal */}
              <div className="font-display text-4xl mb-1">{MEDALS[rank]}</div>
              <div className="font-body text-sm font-bold mb-3" style={{ color: MEDAL_COLORS[rank] }}>
                {MEDAL_LABELS[rank]}
              </div>

              {/* Avatar */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: rank * 0.3 }}
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 mb-3"
                style={{ background: team.avatar.bgColor, borderColor: team.avatar.color, boxShadow: `0 4px 14px ${team.avatar.color}44` }}
              >
                {team.avatar.emoji}
              </motion.div>

              <div className="font-display text-xl text-[#0f172a] mb-3">{team.name}</div>

              {/* Award counter */}
              <motion.div
                animate={animated > 0 ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="font-display text-4xl mb-1"
                style={{ color: '#10b981' }}
              >
                +{animated}
                <span className="text-2xl ml-0.5">💎</span>
              </motion.div>

              {/* Running total */}
              <div className="font-display text-base text-[#475569]">
                Gesamt: <span style={{ color: team.avatar.color }}>{total}</span> 💎
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Single CTA button — appears after animation */}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring' }}>
            <Button size="xl" variant="gold" onClick={finishCrystalAward}>
              🎲 WEITER ZUM WÜRFELN!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator while animating */}
      {!done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, delay: i * 0.3, repeat: Infinity }} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
