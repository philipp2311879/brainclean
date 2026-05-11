import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { HeaderBar } from './components/ui/HeaderBar'
import { GameBoard } from './components/board/GameBoard'
import { InfoOverlay } from './components/overlays/InfoOverlay'
import { TitleScreen } from './components/screens/TitleScreen'
import { SetupScreen } from './components/screens/SetupScreen'
import { TeamSetupScreen } from './components/screens/TeamSetupScreen'
import { MinigameScreen } from './components/screens/MinigameScreen'
import { PlacementScreen } from './components/screens/PlacementScreen'
import { CrystalAwardScreen } from './components/screens/CrystalAwardScreen'
import { ItemPhaseScreen } from './components/screens/ItemPhaseScreen'
import { RollingScreen } from './components/screens/RollingScreen'
import { WalkingScreen } from './components/screens/WalkingScreen'
import { MapSetupScreen } from './components/screens/MapSetupScreen'
import { RoundEndScreen } from './components/screens/RoundEndScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'
import { StreakShopScreen } from './components/screens/StreakShopScreen'
import { DatabaseBootstrap } from './components/bootstrap/DatabaseBootstrap'

const MAP_BUTTON_PHASES = new Set([
  'minigameAnnounce', 'minigameActive', 'placementInput',
  'crystalAward', 'itemPhase', 'rolling', 'roundEnd',
])

function Screen() {
  const phase = useGameStore((s) => s.phase)
  switch (phase) {
    case 'title':            return <TitleScreen />
    case 'setup':            return <SetupScreen />
    case 'teamSetup':        return <TeamSetupScreen />
    case 'mapSetup':         return <MapSetupScreen />
    case 'minigameAnnounce': return <MinigameScreen />
    case 'minigameActive':   return <MinigameScreen />
    case 'placementInput':   return <PlacementScreen />
    case 'streakShop':       return <StreakShopScreen />
    case 'crystalAward':     return <CrystalAwardScreen />
    case 'itemPhase':        return <ItemPhaseScreen />
    case 'rolling':          return <RollingScreen />
    case 'walking':          return <WalkingScreen />
    case 'roundEnd':         return <RoundEndScreen />
    case 'gameOver':         return <GameOverScreen />
    default:                 return <TitleScreen />
  }
}

function MapFloatButton() {
  const { phase, showMapOverlay, setShowMapOverlay, teams, fields, activeMines, jackpotFieldIndex } = useGameStore()
  if (!MAP_BUTTON_PHASES.has(phase)) return null

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowMapOverlay(true)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-2xl bg-white border-2 border-[#4f8cff] shadow-card-lg flex items-center justify-center text-2xl cursor-pointer"
        title="Karte anzeigen"
      >
        🗺️
      </motion.button>

      <AnimatePresence>
        {showMapOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
            onClick={() => setShowMapOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-card-lg"
              style={{ height: '78vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-[#e5e7eb]">
                <span className="font-display text-[#0f172a] text-xl">🗺️ SPIELKARTE</span>
                <div className="flex items-center gap-4">
                  {teams.map((t) => (
                    <div key={t.id} className="flex items-center gap-1.5">
                      <span className="text-lg">{t.avatar.emoji}</span>
                      <span className="font-display text-base" style={{ color: t.avatar.color }}>{t.crystals}</span>
                      <span className="text-[#f59e0b]">💎</span>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowMapOverlay(false)}
                    className="w-9 h-9 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] flex items-center justify-center text-[#475569] text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4" style={{ height: 'calc(100% - 52px)' }}>
                <GameBoard fields={fields} teams={teams} activeMines={activeMines} jackpotFieldIndex={jackpotFieldIndex} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const { showInfoOverlay, setShowInfoOverlay } = useGameStore()

  return (
    <DatabaseBootstrap>
    <div className="w-screen h-screen overflow-hidden relative">
      <HeaderBar />
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      <MapFloatButton />

      {/* Info overlay — triggered from HeaderBar via store */}
      <AnimatePresence>
        {showInfoOverlay && <InfoOverlay onClose={() => setShowInfoOverlay(false)} />}
      </AnimatePresence>
    </div>
    </DatabaseBootstrap>
  )
}
