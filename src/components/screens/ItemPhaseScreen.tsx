import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { ITEM_DEFS } from '../../data/items'
import type { ItemType } from '../../types'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import { soundManager } from '../../lib/soundManager'
import { ItemAnimationOverlay, type ItemAnimResult } from '../overlays/ItemAnimationOverlay'

const TURN_SECONDS = 20

interface Selecting {
  teamId: string
  itemId: string
  itemType: ItemType
}

export function ItemPhaseScreen() {
  const {
    teams, itemPhaseOrder, itemPhaseTeamIndex,
    useItem, advanceItemPhaseTeam,
    fields, activeMines, jackpotFieldIndex,
  } = useGameStore()

  const currentTeamId = itemPhaseOrder[itemPhaseTeamIndex]
  const currentTeam = teams.find((t) => t.id === currentTeamId)
  const usableItems = currentTeam?.items.filter((i) => i.type !== 'shield') ?? []
  const hasUsable = usableItems.length > 0

  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS)
  const [selecting, setSelecting] = useState<Selecting | null>(null)
  const [itemResult, setItemResult] = useState<ItemAnimResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // Auto-skip teams with no usable items
  useEffect(() => {
    if (!currentTeam || hasUsable) return
    const t = setTimeout(() => advanceItemPhaseTeam(), 400)
    return () => clearTimeout(t)
  }, [currentTeamId])

  // Per-team countdown
  useEffect(() => {
    if (!currentTeam || !hasUsable) return
    setTimeLeft(TURN_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          advanceItemPhaseTeam()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [currentTeamId])

  const takeSnapshot = () =>
    useGameStore.getState().teams.map((t) => ({ id: t.id, crystals: t.crystals, position: t.position }))
  const takeMinesSnapshot = () => [...useGameStore.getState().activeMines]

  const buildResult = (
    itemType: ItemType,
    usingTeamId: string,
    before: ReturnType<typeof takeSnapshot>,
    targetTeamId?: string,
    beforeMines?: ReturnType<typeof takeMinesSnapshot>,
    targetHadShield?: boolean,
  ): ItemAnimResult => {
    const after = useGameStore.getState().teams
    const crystalDeltas: Record<string, number> = {}
    before.forEach((bt) => {
      const at = after.find((t) => t.id === bt.id)
      if (at && at.crystals !== bt.crystals) crystalDeltas[bt.id] = at.crystals - bt.crystals
    })
    const wasBlocked = itemType === 'crystal_steal' ? (targetHadShield ?? false) : false
    let placedMineFieldIndex: number | null = null
    if (itemType === 'minefield' && beforeMines) {
      const afterMines = useGameStore.getState().activeMines
      const newMine = afterMines.find(
        (m) => !beforeMines.some((bm) => bm.fieldIndex === m.fieldIndex && bm.placedByTeamId === m.placedByTeamId),
      )
      placedMineFieldIndex = newMine?.fieldIndex ?? null
    }
    const swapFromPos = before.find((b) => b.id === usingTeamId)?.position ?? 0
    const swapToPos = before.find((b) => b.id === targetTeamId)?.position ?? 0
    return { itemType, usingTeamId, targetTeamId, crystalDeltas, wasBlocked, placedMineFieldIndex, swapFromPos, swapToPos }
  }

  const sfxForItem = (itemType: ItemType) => {
    switch (itemType) {
      case 'crystal_steal': soundManager.playSFX('steal'); break
      case 'position_swap': soundManager.playSFX('swap'); break
      case 'anchor':        soundManager.playSFX('anchor'); break
      case 'double_step':   soundManager.playSFX('speedup'); break
      case 'turbo':         soundManager.playSFX('turbo'); break
      case 'minefield':     soundManager.playSFX('mine_place'); break
      default:              soundManager.playSFX('item_use'); break
    }
  }

  const handleActivate = (teamId: string, itemId: string, itemType: ItemType) => {
    if (ITEM_DEFS[itemType].needsTarget) {
      setSelecting({ teamId, itemId, itemType })
    } else {
      clearInterval(timerRef.current)
      sfxForItem(itemType)
      const before = takeSnapshot()
      const beforeMines = takeMinesSnapshot()
      useItem(teamId, itemId)
      setItemResult(buildResult(itemType, teamId, before, undefined, beforeMines))
    }
  }

  const handleTarget = (targetId: string) => {
    if (!selecting) return
    const { teamId, itemId, itemType } = selecting
    clearInterval(timerRef.current)
    sfxForItem(itemType)
    const before = takeSnapshot()
    const beforeMines = takeMinesSnapshot()
    const targetHadShield = useGameStore.getState().teams.find((t) => t.id === targetId)?.hasShield ?? false
    useItem(teamId, itemId, targetId)
    setSelecting(null)
    setItemResult(buildResult(itemType, teamId, before, targetId, beforeMines, targetHadShield))
  }

  const tColor = currentTeam ? resolveTeamColor(currentTeam.jerseyColor, currentTeam.avatar.color) : '#4f8cff'
  const teamsDone = itemPhaseTeamIndex
  const teamsTotal = itemPhaseOrder.length

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center pt-16 pb-6 px-4"
      style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f5f3ff 50%,#fff7ed 100%)' }}
    >
      {/* Header */}
      <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
        <h1 className="font-display text-4xl md:text-5xl text-[#0f172a]">⚔️ ITEM-PHASE</h1>
        <p className="text-[#475569] text-base font-body mt-1">
          Team {teamsDone + 1} von {teamsTotal}
        </p>
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {itemPhaseOrder.map((id, idx) => (
          <div
            key={id}
            className="w-3 h-3 rounded-full transition-all"
            style={{
              background: idx < itemPhaseTeamIndex ? '#10b981' : idx === itemPhaseTeamIndex ? tColor : '#e2e8f0',
            }}
          />
        ))}
      </div>

      {currentTeam && hasUsable && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTeamId}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="card p-6 w-full max-w-md mb-6"
            style={{ borderColor: tColor, borderWidth: 2 }}
          >
            {/* Team header */}
            <div className="flex items-center gap-3 mb-4">
              <AvatarRingWrapper avatar={currentTeam.avatar} jerseyColor={currentTeam.jerseyColor} outerSize={56} />
              <div>
                <div className="font-display text-2xl text-[#0f172a]">{currentTeam.name}</div>
                <div className="font-body text-sm text-[#475569]">{currentTeam.crystals} 💎</div>
              </div>
              {/* Timer */}
              <div className="ml-auto text-right">
                <div
                  className="font-display text-3xl"
                  style={{ color: timeLeft < 8 ? '#ef4444' : tColor }}
                >
                  {timeLeft}s
                </div>
                <div className="w-20 h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: timeLeft < 8 ? '#ef4444' : tColor }}
                    animate={{ width: `${(timeLeft / TURN_SECONDS) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Usable items */}
            <div className="flex flex-col gap-2 mb-4">
              {usableItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleActivate(currentTeam.id, item.id, item.type)}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 bg-white cursor-pointer transition-all text-left"
                  style={{ borderColor: '#d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-body font-semibold text-[#0f172a]">{item.name}</div>
                    <div className="text-xs text-[#475569]">{ITEM_DEFS[item.type].description}</div>
                  </div>
                  <span className="text-sm text-[#4f8cff] font-body">einsetzen →</span>
                </motion.button>
              ))}
            </div>

            {/* Shield passive display */}
            {currentTeam.items.filter((i) => i.type === 'shield').map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-sm font-body mb-2">
                <span>🛡️</span>
                <span>Schild aktiv (passiv – blockt nächsten Angriff)</span>
              </div>
            ))}

            <Button size="lg" variant="secondary" fullWidth onClick={() => { clearInterval(timerRef.current); advanceItemPhaseTeam() }}>
              ÜBERSPRINGEN →
            </Button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Target selection overlay */}
      <AnimatePresence>
        {selecting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-8"
            onClick={() => setSelecting(null)}
          >
            <motion.div
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card p-6 max-w-sm w-full"
            >
              <h2 className="font-display text-2xl text-[#0f172a] mb-2 text-center">ZIEL AUSWÄHLEN</h2>
              <p className="text-[#475569] font-body text-sm text-center mb-4">
                {ITEM_DEFS[selecting.itemType].description}
              </p>
              <div className="flex flex-col gap-3">
                {teams.filter((t) => t.id !== selecting.teamId).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTarget(t.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#e5e7eb] hover:border-[#4f8cff] bg-white cursor-pointer transition-all"
                  >
                    <AvatarRingWrapper avatar={t.avatar} jerseyColor={t.jerseyColor} outerSize={40} />
                    <span className="font-display text-[#0f172a] text-lg flex-1 text-left">{t.name}</span>
                    {t.hasShield && <span>🛡️</span>}
                    <span className="font-display text-[#f59e0b]">{t.crystals} 💎</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item animation overlay */}
      <AnimatePresence>
        {itemResult && (
          <ItemAnimationOverlay
            {...itemResult}
            teams={teams}
            fields={fields}
            activeMines={activeMines}
            jackpotFieldIndex={jackpotFieldIndex}
            onDismiss={() => { setItemResult(null); advanceItemPhaseTeam() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
