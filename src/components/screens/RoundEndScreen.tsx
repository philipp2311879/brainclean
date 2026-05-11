import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'

export function RoundEndScreen() {
  const { teams, currentRound, totalRounds, nextRound } = useGameStore()

  const sorted = [...teams].sort((a, b) => b.crystals - a.crystals)
  const isLastRound = currentRound >= totalRounds

  return (
    <div className="w-full h-full flex flex-col items-center justify-center screen-base p-8 pt-20">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-5xl text-text-primary">
          RUNDE <span className="text-accent-blue">{currentRound}</span>
          <span className="text-text-secondary text-3xl"> /{totalRounds}</span>
        </h1>
        <p className="text-text-secondary text-xl font-body mt-2">
          {isLastRound ? '🏆 Letzte Runde abgeschlossen!' : 'Aktueller Spielstand'}
        </p>
      </motion.div>

      {/* Leaderboard */}
      <div className="flex flex-col gap-3 w-full max-w-lg mb-10">
        {sorted.map((team, rank) => (
          <motion.div
            key={team.id}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: rank * 0.08 }}
          >
            <GlassPanel
              className={`p-4 flex items-center gap-4 ${rank === 0 ? 'border-2' : ''}`}
              accent={rank === 0 ? team.avatar.color : undefined}
            >
              <div className="w-10 text-center font-display text-2xl text-text-secondary">
                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`}
              </div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 flex-shrink-0"
                style={{
                  background: team.avatar.bgColor,
                  borderColor: team.avatar.color,
                  boxShadow: rank === 0 ? `0 4px 16px ${team.avatar.color}66` : 'none',
                }}
              >
                {team.avatar.emoji}
              </div>
              <div className="flex-1">
                <div className="font-display text-text-primary text-xl">{team.name}</div>
                <div className="text-text-secondary text-sm font-body">
                  Feld {team.position}
                  {team.items.length > 0 && ` · ${team.items.length} Item${team.items.length > 1 ? 's' : ''}`}
                  {team.hasShield && ' · 🛡️'}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-3xl" style={{ color: team.avatar.color }}>{team.crystals}</span>
                <span className="text-xl">💎</span>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          size="xl"
          variant={isLastRound ? 'gold' : 'primary'}
          onClick={nextRound}
        >
          {isLastRound ? '🏆 SIEGEREHRUNG!' : `RUNDE ${currentRound + 1} STARTEN →`}
        </Button>
      </motion.div>
    </div>
  )
}
