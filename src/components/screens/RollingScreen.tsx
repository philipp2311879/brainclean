import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function DiceDisplay({ value, rolling, color }: { value: number; rolling: boolean; color: string }) {
  const [display, setDisplay] = useState(1)

  useEffect(() => {
    if (!rolling) { setDisplay(value); return }
    const interval = setInterval(() => setDisplay(Math.floor(Math.random() * 6) + 1), 80)
    return () => clearInterval(interval)
  }, [rolling, value])

  return (
    <motion.div
      animate={
        rolling
          ? { rotate: [0, 12, -12, 8, -8, 0], scale: [1, 1.08, 0.94, 1.04, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={{ duration: 0.45, repeat: rolling ? Infinity : 0 }}
      className="w-24 h-24 rounded-2xl flex items-center justify-center text-6xl select-none border-2"
      style={{
        background: rolling ? '#f8fafc' : '#ffffff',
        borderColor: rolling ? '#e2e8f0' : color,
        boxShadow: rolling ? '0 2px 8px rgba(0,0,0,0.08)' : `0 6px 20px ${color}44`,
      }}
    >
      {DICE_FACES[display - 1]}
    </motion.div>
  )
}

export function RollingScreen() {
  const { teams, diceResults, rollDice, finishRolling } = useGameStore()
  const [rolling, setRolling] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const handleRoll = () => {
    setRolling(true)
    setRevealed(false)
    rollDice()
    setTimeout(() => { setRolling(false); setRevealed(true) }, 2000)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center screen-base p-8 pt-20">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
        <h1 className="font-display text-5xl text-text-primary mb-2">
          🎲 <span className="text-accent-blue">WÜRFELN</span>
        </h1>
        <p className="text-text-secondary text-xl font-body">Alle Teams würfeln gleichzeitig</p>
      </motion.div>

      {/* Dice cards */}
      <div className="flex flex-wrap gap-6 justify-center mb-10">
        {teams.map((team, i) => (
          <motion.div
            key={team.id}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassPanel className="p-6 flex flex-col items-center gap-4 w-44" accent={team.avatar.color}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
                style={{
                  background: team.avatar.bgColor,
                  borderColor: team.avatar.color,
                  boxShadow: `0 4px 12px ${team.avatar.color}44`,
                }}
              >
                {team.avatar.emoji}
              </div>
              <div className="font-display text-text-primary text-lg">{team.name}</div>

              <DiceDisplay value={diceResults[team.id] ?? 1} rolling={rolling} color={team.avatar.color} />

              <AnimatePresence>
                {revealed && diceResults[team.id] !== undefined && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-2xl text-center"
                    style={{ color: team.avatar.color }}
                  >
                    {team.anchoredThisRound ? (
                      <span className="text-text-secondary text-base">⚓ 0 Schritte</span>
                    ) : (
                      <>
                        {diceResults[team.id]}
                        <span className="text-text-secondary text-base ml-1">
                          Schritt{diceResults[team.id] !== 1 ? 'e' : ''}
                        </span>
                        {team.turboThisRound && <span className="ml-1">🚀</span>}
                        {team.doubleStepThisRound && <span className="ml-1">👟</span>}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="roll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button size="xl" onClick={handleRoll} disabled={rolling}>
              {rolling ? '🎲 Würfelt…' : '🎲 WÜRFELN!'}
            </Button>
          </motion.div>
        ) : (
          <motion.div key="next" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Button size="xl" variant="gold" onClick={finishRolling}>
              🏃 AVATARE LAUFEN LASSEN!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
