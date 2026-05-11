import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'

const P_LABELS = ['🥇 1. Platz', '🥈 2. Platz', '🥉 3. Platz', '4. Platz']
const P_COLORS = ['#d97706', '#64748b', '#ea580c', '#94a3b8']

export function PlacementScreen() {
  const { teams, setPlacement, confirmPlacements } = useGameStore()
  const allPlaced = teams.every((t) => t.placement !== null)
  const used = teams.map((t) => t.placement).filter(Boolean) as number[]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 pt-20" style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f5f3ff 50%,#fff7ed 100%)' }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <h1 className="font-display text-5xl text-[#0f172a]">
          PLATZIERUNGEN <span className="text-[#f59e0b]">EINGEBEN</span>
        </h1>
        <p className="text-[#475569] text-xl font-body mt-2">Wer hat das Minispiel gewonnen?</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-5 w-full max-w-3xl mb-10">
        {teams.map((team, idx) => (
          <motion.div
            key={team.id}
            initial={{ x: idx % 2 === 0 ? -24 : 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
          >
            <div
              className="card p-5"
              style={{ borderColor: team.placement ? P_COLORS[team.placement - 1] : '#e5e7eb', borderWidth: 2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 flex-shrink-0"
                  style={{ background: team.avatar.bgColor, borderColor: team.avatar.color, boxShadow: `0 4px 12px ${team.avatar.color}44` }}
                >
                  {team.avatar.emoji}
                </div>
                <div>
                  <div className="font-display text-2xl text-[#0f172a]">{team.name}</div>
                  {team.placement
                    ? <div className="font-display text-base" style={{ color: P_COLORS[team.placement - 1] }}>{P_LABELS[team.placement - 1]}</div>
                    : <div className="text-base font-body text-[#94a3b8]">Noch nicht gesetzt</div>
                  }
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: teams.length }, (_, i) => i + 1).map((p) => {
                  const isSelected = team.placement === p
                  const isTaken = used.includes(p) && !isSelected
                  return (
                    <motion.button
                      key={p}
                      whileTap={isTaken ? {} : { scale: 0.96 }}
                      onClick={() => !isTaken && setPlacement(team.id, p)}
                      disabled={isTaken}
                      className="py-3 rounded-xl font-display text-base transition-all cursor-pointer border-2"
                      style={
                        isSelected
                          ? { background: P_COLORS[p - 1], color: '#ffffff', borderColor: P_COLORS[p - 1], boxShadow: `0 3px 12px ${P_COLORS[p-1]}44` }
                          : isTaken
                          ? { background: '#f8fafc', color: '#d1d5db', borderColor: '#e5e7eb', cursor: 'not-allowed' }
                          : { background: '#ffffff', color: '#0f172a', borderColor: '#d1d5db' }
                      }
                    >
                      {P_LABELS[p - 1]}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <Button size="xl" onClick={confirmPlacements} disabled={!allPlaced} variant="gold">
          ✅ ERGEBNISSE BESTÄTIGEN!
        </Button>
      </motion.div>
    </div>
  )
}
