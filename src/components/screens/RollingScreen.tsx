import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function SingleDie({ value, rolling, color }: { value: number; rolling: boolean; color: string }) {
  const [display, setDisplay] = useState(value || 1)

  useEffect(() => {
    if (!rolling) { setDisplay(value || 1); return }
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
      className="w-14 h-14 rounded-xl flex items-center justify-center text-4xl select-none border-2"
      style={{
        background: rolling ? '#f8fafc' : '#ffffff',
        borderColor: rolling ? '#e2e8f0' : color,
        boxShadow: rolling ? '0 2px 8px rgba(0,0,0,0.08)' : `0 4px 14px ${color}44`,
      }}
    >
      {value === 0 ? '⚀' : DICE_FACES[(display - 1) % 6]}
    </motion.div>
  )
}

export function RollingScreen() {
  const { teams, diceResults, dicePairs, darkRoundActive, rollDice, finishRolling } = useGameStore()
  const [rolling, setRolling] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const handleRoll = () => {
    setRolling(true)
    setRevealed(false)
    rollDice()
    setTimeout(() => {
      setRolling(false)
      setRevealed(true)
    }, 2000)
  }

  return (
    <div className="w-full h-full flex flex-col pt-16 overflow-hidden screen-base">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-shrink-0 text-center py-4 px-4">
        <h1 className="font-display text-4xl md:text-5xl text-text-primary mb-1">
          🎲 <span className="text-accent-blue">WÜRFELN</span>
        </h1>
        <p className="text-text-secondary text-lg font-body">Alle Teams würfeln gleichzeitig</p>
        {darkRoundActive && (
          <div className="inline-block mt-1 px-4 py-1 rounded-full bg-purple-100 border-2 border-purple-400 text-purple-700 font-display text-sm">
            🌑 DUNKLE RUNDE: Sieger würfelt 2×!
          </div>
        )}
      </motion.div>

      {/* Dice cards — centered in remaining space */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        <div className="flex flex-wrap gap-4 justify-center">
          {teams.map((team, i) => {
            const tColor = resolveTeamColor(team.jerseyColor, team.avatar.color)
            const pair = dicePairs[team.id] ?? [1, 1]
            const total = diceResults[team.id] ?? 2

            return (
              <motion.div
                key={team.id}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassPanel className="p-4 flex flex-col items-center gap-3 w-40" accent={tColor}>
                  <AvatarRingWrapper avatar={team.avatar} jerseyColor={team.jerseyColor} outerSize={56}
                    style={{ boxShadow: `0 4px 12px ${tColor}44` }} />
                  <div className="font-display text-text-primary text-base leading-tight text-center">{team.name}</div>

                  {/* Dice */}
                  {team.anchoredThisRound ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-4xl">⚓</span>
                    </div>
                  ) : pair.length === 4 ? (
                    // Dark round winner: 2×2 dice
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <SingleDie value={pair[0]} rolling={rolling} color={tColor} />
                        <span className="font-display text-[#94a3b8] text-xs">+</span>
                        <SingleDie value={pair[1]} rolling={rolling} color={tColor} />
                      </div>
                      <span className="font-display text-[#8b5cf6] text-xs">🌑 +</span>
                      <div className="flex items-center gap-1">
                        <SingleDie value={pair[2]} rolling={rolling} color={tColor} />
                        <span className="font-display text-[#94a3b8] text-xs">+</span>
                        <SingleDie value={pair[3]} rolling={rolling} color={tColor} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <SingleDie value={pair[0]} rolling={rolling} color={tColor} />
                      <span className="font-display text-[#94a3b8] text-base">+</span>
                      <SingleDie value={pair[1]} rolling={rolling} color={tColor} />
                    </div>
                  )}

                  {/* Result */}
                  <AnimatePresence>
                    {revealed && diceResults[team.id] !== undefined && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="font-display text-2xl text-center"
                        style={{ color: tColor }}
                      >
                        {team.anchoredThisRound ? (
                          <span className="text-text-secondary text-base">0 Schritte</span>
                        ) : (
                          <>
                            <span className="text-3xl">{total}</span>
                            <span className="text-text-secondary text-sm ml-1">
                              Schritt{total !== 1 ? 'e' : ''}
                            </span>
                            {pair.length === 4 && <div className="text-sm text-[#8b5cf6]">🌑 2× Wurf</div>}
                            {team.turboThisRound && <div className="text-sm">🚀 Turbo!</div>}
                            {team.doubleStepThisRound && <div className="text-sm">👟 ×2</div>}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Fixed footer button */}
      <div className="flex-shrink-0 bg-white border-t border-[#e5e7eb] p-4 flex items-center justify-center" style={{ minHeight: 80 }}>
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
    </div>
  )
}
