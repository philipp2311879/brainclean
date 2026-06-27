import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'

const P_LABELS = ['1. Platz', '2. Platz', '3. Platz', '4. Platz']
const P_COLORS = ['#d97706', '#64748b', '#ea580c', '#94a3b8']
const P_MEDALS = ['🥇', '🥈', '🥉', '4️⃣']

export function PlacementScreen() {
  const { teams, numTeams, setPlacement, confirmPlacements } = useGameStore()
  const allPlaced = teams.every((t) => t.placement !== null)
  const places = Array.from({ length: numTeams }, (_, i) => i + 1)

  return (
    <div className="w-full h-full flex flex-col pt-16 overflow-hidden" style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f5f3ff 50%,#fff7ed 100%)' }}>
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-shrink-0 text-center py-4 px-8">
        <h1 className="font-display text-5xl text-[#0f172a]">
          PLATZIERUNGEN <span className="text-[#f59e0b]">EINGEBEN</span>
        </h1>
        <p className="text-[#475569] text-lg font-body mt-1">
          Wer hat das Minispiel gewonnen? Gleichstand ist erlaubt!
        </p>
      </motion.div>

      {/* Scrollable teams grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-2 scrollbar-hide">
        <div className="grid grid-cols-2 gap-5 w-full max-w-3xl mx-auto">
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
                {/* Team header */}
                <div className="flex items-center gap-3 mb-4">
                  <AvatarRingWrapper
                    avatar={team.avatar}
                    jerseyColor={team.jerseyColor}
                    outerSize={56}
                    style={{ boxShadow: `0 4px 12px ${resolveTeamColor(team.jerseyColor, team.avatar.color)}44` }}
                  />
                  <div>
                    <div className="font-display text-2xl text-[#0f172a]">{team.name}</div>
                    {team.placement
                      ? (
                        <div className="font-display text-base flex items-center gap-1" style={{ color: P_COLORS[team.placement - 1] }}>
                          {P_MEDALS[team.placement - 1]} {P_LABELS[team.placement - 1]}
                        </div>
                      )
                      : <div className="text-base font-body text-[#94a3b8]">Noch nicht gesetzt</div>
                    }
                  </div>
                </div>

                {/* Placement buttons — only places valid for current team count */}
                <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${places.length}, 1fr)` }}>
                  {places.map((p) => {
                    const isSelected = team.placement === p
                    return (
                      <motion.button
                        key={p}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setPlacement(team.id, p)}
                        className="py-2.5 rounded-xl font-display text-sm transition-all cursor-pointer border-2 flex flex-col items-center gap-0.5"
                        style={
                          isSelected
                            ? { background: P_COLORS[p - 1], color: '#ffffff', borderColor: P_COLORS[p - 1], boxShadow: `0 3px 12px ${P_COLORS[p - 1]}44` }
                            : { background: '#ffffff', color: '#0f172a', borderColor: '#d1d5db' }
                        }
                      >
                        <span style={{ fontSize: 16 }}>{P_MEDALS[p - 1]}</span>
                        <span style={{ fontSize: 11 }}>{p}. Platz</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fixed footer button */}
      <div className="flex-shrink-0 bg-white border-t border-[#e5e7eb] p-4 flex justify-center">
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button size="xl" onClick={confirmPlacements} disabled={!allPlaced} variant="gold">
            ✅ ERGEBNISSE BESTÄTIGEN!
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
