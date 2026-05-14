import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { ITEM_DEFS } from '../../data/items'
import type { ItemType } from '../../types'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import { soundManager } from '../../lib/soundManager'
import { ItemAnimationOverlay, type ItemAnimResult } from '../overlays/ItemAnimationOverlay'

interface Selecting {
  teamId: string
  itemId: string
  itemType: ItemType
  step: 'target' | 'amount'
}

export function ItemPhaseScreen() {
  const { teams, useItem, skipItemPhase, fields, activeMines, jackpotFieldIndex } = useGameStore()
  const [timeLeft, setTimeLeft] = useState(30)
  const [selecting, setSelecting] = useState<Selecting | null>(null)
  const [bet, setBet] = useState(50)
  const [itemResult, setItemResult] = useState<ItemAnimResult | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); skipItemPhase(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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

    return {
      itemType, usingTeamId, targetTeamId,
      crystalDeltas, wasBlocked,
      placedMineFieldIndex, swapFromPos, swapToPos,
    }
  }

  const sfxForItem = (itemType: ItemType) => {
    switch (itemType) {
      case 'crystal_steal': soundManager.playSFX('steal'); break
      case 'position_swap': soundManager.playSFX('swap'); break
      case 'anchor':        soundManager.playSFX('anchor'); break
      case 'double_step':   soundManager.playSFX('speedup'); break
      case 'turbo':         soundManager.playSFX('turbo'); break
      case 'minefield':     soundManager.playSFX('mine_place'); break
      case 'shield':        soundManager.playSFX('shield_block'); break
      default:              soundManager.playSFX('item_use'); break
    }
  }

  const handleActivate = (teamId: string, itemId: string, itemType: ItemType) => {
    const def = ITEM_DEFS[itemType]
    if (def.needsTarget) {
      setSelecting({ teamId, itemId, itemType, step: 'target' })
    } else if (def.needsAmount) {
      setSelecting({ teamId, itemId, itemType, step: 'amount' })
    } else {
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
    sfxForItem(itemType)
    const before = takeSnapshot()
    const beforeMines = takeMinesSnapshot()
    const targetHadShield = useGameStore.getState().teams.find((t) => t.id === targetId)?.hasShield ?? false
    useItem(teamId, itemId, targetId)
    setSelecting(null)
    setItemResult(buildResult(itemType, teamId, before, targetId, beforeMines, targetHadShield))
  }

  const handleAmount = () => {
    if (!selecting) return
    const { teamId, itemId, itemType } = selecting
    sfxForItem(itemType)
    const before = takeSnapshot()
    useItem(teamId, itemId, undefined, undefined, bet)
    setSelecting(null)
    setItemResult(buildResult(itemType, teamId, before))
  }

  return (
    <div className="w-full h-full flex flex-col items-center pt-20 pb-6 px-6 overflow-auto" style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f5f3ff 50%,#fff7ed 100%)' }}>
      <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-5">
        <h1 className="font-display text-4xl text-[#0f172a]">🎒 ITEM-PHASE</h1>
        <p className="text-[#475569] text-lg font-body">Jedes Team kann EIN Item einsetzen</p>
      </motion.div>

      <div className="font-display text-5xl mb-5" style={{ color: timeLeft < 10 ? '#ef4444' : '#4f8cff' }}>
        ⏱ {timeLeft}s
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-4xl mb-6">
        {teams.map((team) => (
          <div key={team.id} className="card p-4" style={{ borderColor: resolveTeamColor(team.jerseyColor, team.avatar.color), borderWidth: 2 }}>
            <div className="flex items-center gap-3 mb-3">
              <AvatarRingWrapper avatar={team.avatar} jerseyColor={team.jerseyColor} outerSize={44} />
              <div>
                <div className="font-display text-[#0f172a] text-lg">{team.name}</div>
                {team.usedItemThisRound && <div className="text-sm text-[#10b981] font-body font-bold">✅ Item eingesetzt</div>}
              </div>
            </div>

            {team.items.length === 0
              ? <div className="text-[#94a3b8] text-sm font-body text-center py-2">Keine Items</div>
              : (
                <div className="flex flex-col gap-2">
                  {team.items.map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={team.usedItemThisRound ? {} : { scale: 0.97 }}
                      onClick={() => !team.usedItemThisRound && handleActivate(team.id, item.id, item.type)}
                      disabled={team.usedItemThisRound}
                      className="flex items-center gap-2 p-3 rounded-xl text-left transition-all border-2 cursor-pointer"
                      style={
                        team.usedItemThisRound
                          ? { background: '#f8fafc', borderColor: '#e5e7eb', cursor: 'not-allowed', opacity: 0.5 }
                          : { background: '#ffffff', borderColor: '#d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
                      }
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-body text-[#0f172a] text-base font-semibold">{item.name}</span>
                      {!team.usedItemThisRound && <span className="ml-auto text-sm text-[#4f8cff] font-body">einsetzen →</span>}
                    </motion.button>
                  ))}
                </div>
              )
            }
          </div>
        ))}
      </div>

      <Button size="lg" variant="secondary" onClick={skipItemPhase}>⏭ ÜBERSPRINGEN → WÜRFELN</Button>

      {/* Target / amount selection overlay */}
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
              className="card p-8 max-w-md w-full"
            >
              {selecting.step === 'target' && (
                <>
                  <h2 className="font-display text-2xl text-[#0f172a] mb-2 text-center">ZIEL AUSWÄHLEN</h2>
                  <p className="text-[#475569] font-body text-base text-center mb-5">{ITEM_DEFS[selecting.itemType].description}</p>
                  <div className="flex flex-col gap-3">
                    {teams.filter((t) => t.id !== selecting.teamId).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTarget(t.id)}
                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#e5e7eb] hover:border-[#4f8cff] bg-white cursor-pointer transition-all"
                      >
                        <AvatarRingWrapper avatar={t.avatar} jerseyColor={t.jerseyColor} outerSize={40} />
                        <span className="font-display text-[#0f172a] text-lg">{t.name}</span>
                        {t.hasShield && <span className="ml-1 text-base">🛡️</span>}
                        <span className="ml-auto font-display text-[#f59e0b]">{t.crystals} 💎</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selecting.step === 'amount' && (
                <>
                  <h2 className="font-display text-2xl text-[#0f172a] mb-2 text-center">🎰 EINSATZ</h2>
                  <p className="text-[#475569] font-body text-base text-center mb-5">
                    Gewinn: {bet * 3} 💎 · Verlust: {bet} 💎
                  </p>
                  <input
                    type="range"
                    min={50}
                    max={Math.min(500, teams.find((t) => t.id === selecting.teamId)?.crystals ?? 200)}
                    step={50}
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    className="w-full mb-3"
                  />
                  <div className="text-center font-display text-3xl text-[#f59e0b] mb-5">{bet} 💎</div>
                  <Button onClick={handleAmount} fullWidth>BESTÄTIGEN</Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item animation overlay — auto-dismisses */}
      <AnimatePresence>
        {itemResult && (
          <ItemAnimationOverlay
            {...itemResult}
            teams={teams}
            fields={fields}
            activeMines={activeMines}
            jackpotFieldIndex={jackpotFieldIndex}
            onDismiss={() => setItemResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
