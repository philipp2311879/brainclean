import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'

const ROUND_OPTIONS = [3, 5, 7, 9]
const TEAM_OPTIONS = [2, 3, 4]

export function SetupScreen() {
  const { totalRounds, numTeams, setTotalRounds, setNumTeams, startTeamSetup } = useGameStore()

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8" style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f5f3ff 50%,#fff7ed 100%)' }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
        <h1 className="font-display text-5xl text-[#0f172a] mb-2">
          SPIEL <span className="text-[#4f8cff]">SETUP</span>
        </h1>
        <p className="text-[#475569] text-xl font-body">Konfiguriere deine Arena</p>
      </motion.div>

      <div className="flex gap-8 w-full max-w-2xl">
        {/* Rounds */}
        <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1">
          <div className="card p-6" style={{ borderColor: '#4f8cff', borderWidth: 2 }}>
            <h2 className="font-display text-xl text-[#4f8cff] mb-5 text-center">RUNDENANZAHL</h2>
            <div className="grid grid-cols-2 gap-3">
              {ROUND_OPTIONS.map((n) => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTotalRounds(n)}
                  className="py-5 rounded-2xl font-display text-4xl transition-all duration-150 cursor-pointer border-2"
                  style={
                    totalRounds === n
                      ? { background: '#4f8cff', color: '#ffffff', borderColor: '#4f8cff', boxShadow: '0 4px 16px rgba(79,140,255,0.40)' }
                      : { background: '#ffffff', color: '#0f172a', borderColor: '#d1d5db' }
                  }
                >
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Teams */}
        <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="flex-1">
          <div className="card p-6" style={{ borderColor: '#ef4444', borderWidth: 2 }}>
            <h2 className="font-display text-xl text-[#ef4444] mb-5 text-center">TEAMANZAHL</h2>
            <div className="grid grid-cols-3 gap-3">
              {TEAM_OPTIONS.map((n) => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNumTeams(n)}
                  className="py-5 rounded-2xl font-display text-4xl transition-all duration-150 cursor-pointer border-2"
                  style={
                    numTeams === n
                      ? { background: '#ef4444', color: '#ffffff', borderColor: '#ef4444', boxShadow: '0 4px 16px rgba(239,68,68,0.35)' }
                      : { background: '#ffffff', color: '#0f172a', borderColor: '#d1d5db' }
                  }
                >
                  {n}
                </motion.button>
              ))}
            </div>
            <div className="mt-5 text-center text-[#475569] text-lg font-body font-semibold">
              {numTeams} Teams · {totalRounds} Runden
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="mt-10">
        <Button size="xl" onClick={startTeamSetup}>TEAMS EINRICHTEN →</Button>
      </motion.div>
    </div>
  )
}
