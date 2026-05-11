import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'

const MINIGAME = {
  name: 'Signal Surge',
  subtitle: 'Kognitive Flexibilität & Inhibition',
  icon: '⚡',
  description: `Alle Teams stehen in der Halle. Das Smartboard zeigt Signale.\n\n🟢 Normales Signal → Sprint zum nächsten Hütchen!\n💀 Vergiftetes Signal (Totenkopf) → EINFRIEREN!\n\nNach der Runde: Welches Team hat die wenigsten Fehler gemacht?`,
  category: 'Inhibition + Reaktion',
}

export function MinigameScreen() {
  const { phase, startMinigame, endMinigame, currentRound, totalRounds, darkRoundActive } = useGameStore()

  const isActive = phase === 'minigameActive'

  if (isActive) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center screen-base p-8 pt-20">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="text-8xl mb-4">{MINIGAME.icon}</div>
          <h1 className="font-display text-5xl text-text-primary mb-2">{MINIGAME.name}</h1>
          {darkRoundActive && (
            <div className="mt-3 px-6 py-2.5 rounded-full bg-purple-100 border-2 border-accent-purple text-accent-purple font-display text-lg">
              🌑 DUNKLE RUNDE AKTIV
            </div>
          )}
        </motion.div>

        {/* Description */}
        <GlassPanel className="max-w-lg p-6 mb-8 text-center">
          <p className="text-text-secondary font-body text-xl leading-relaxed whitespace-pre-line">
            {MINIGAME.description}
          </p>
        </GlassPanel>

        <Button size="xl" variant="danger" onClick={endMinigame}>
          🏁 MINISPIEL BEENDEN
        </Button>
      </div>
    )
  }

  // Announce phase
  return (
    <div className="w-full h-full flex flex-col items-center justify-center screen-base p-8 pt-20">
      {/* Round banner */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160 }}
        className="mb-8 text-center"
      >
        <div className="font-display text-7xl text-text-primary">
          RUNDE{' '}
          <span className="text-accent-blue">{currentRound}</span>
          <span className="text-text-secondary/40 text-4xl"> /{totalRounds}</span>
        </div>
      </motion.div>

      {/* Minigame card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="w-full max-w-2xl mb-8"
      >
        <GlassPanel className="p-8" accent="#4f8cff">
          <div className="flex items-center gap-5 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-5xl border-2 border-accent-blue flex-shrink-0">
              {MINIGAME.icon}
            </div>
            <div>
              <div className="text-text-secondary text-base font-body font-semibold uppercase tracking-widest">
                {MINIGAME.category}
              </div>
              <h2 className="font-display text-4xl text-text-primary">{MINIGAME.name}</h2>
            </div>
          </div>
          <div className="border-t border-border-subtle pt-5 text-text-secondary font-body text-xl leading-relaxed whitespace-pre-line">
            {MINIGAME.description}
          </div>
        </GlassPanel>
      </motion.div>

      {/* Dark round warning */}
      {darkRoundActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 px-6 py-3 rounded-2xl bg-purple-100 border-2 border-accent-purple text-accent-purple font-display text-xl"
        >
          🌑 DUNKLE RUNDE: Sieger würfelt 2×, Letzter bekommt 0 Kristalle!
        </motion.div>
      )}

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-4"
      >
        <Button size="xl" onClick={startMinigame}>
          ⚡ MINISPIEL STARTEN!
        </Button>
      </motion.div>
    </div>
  )
}
