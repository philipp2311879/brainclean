import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'

const BLOBS = [
  { color: '#4f8cff22', size: 400, x: -10, y: -10 },
  { color: '#34d39922', size: 320, x: 70, y: 60 },
  { color: '#ffb83022', size: 280, x: 20, y: 65 },
]

export function TitleScreen() {
  const goToSetup = useGameStore((s) => s.goToSetup)

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Decorative blobs */}
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.08, 1], x: [0, 8, 0], y: [0, -8, 0] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size, height: b.size,
            background: b.color,
            left: `${b.x}%`, top: `${b.y}%`,
            filter: 'blur(60px)',
          }}
        />
      ))}

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 120 }}
        className="text-center mb-6 relative z-10"
      >
        <h1 className="font-display text-[88px] leading-none text-text-primary tracking-wide drop-shadow-sm">
          BRAIN<span className="text-accent-blue">ARENA</span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-text-secondary text-2xl font-body mt-3 tracking-widest uppercase"
        >
          Das ultimative Sport-Brettspiel
        </motion.p>
      </motion.div>

      {/* Science badges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex gap-3 mb-14 z-10"
      >
        {[
          { label: 'Kognitive Flexibilität', color: '#4f8cff' },
          { label: 'Inhibition', color: '#f43f5e' },
          { label: 'Arbeitsgedächtnis', color: '#34d399' },
        ].map(({ label, color }) => (
          <div
            key={label}
            className="px-5 py-2 rounded-full text-base font-body font-semibold bg-white border-2 shadow-card"
            style={{ borderColor: color, color }}
          >
            {label}
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="z-10"
      >
        <Button size="xl" onClick={goToSetup} variant="primary">
          🎮 SPIELEN
        </Button>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 text-text-secondary text-base font-body z-10 text-center"
      >
        Für das Smartboard optimiert · 2–4 Teams · Sportunterricht
      </motion.div>
    </div>
  )
}
