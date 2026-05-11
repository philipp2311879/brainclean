import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { ITEM_DEFS } from '../../data/items'
import type { ItemType, Team } from '../../types'

interface Selecting {
  teamId: string
  itemId: string
  itemType: ItemType
  step: 'target' | 'field' | 'amount'
}

interface ItemUsedResult {
  itemType: ItemType
  usingTeamId: string
  targetTeamId?: string
  crystalDeltas: Record<string, number>
  specialMsg?: string
}

function ItemResultOverlay({
  result,
  teams,
  onDismiss,
}: {
  result: ItemUsedResult
  teams: Team[]
  onDismiss: () => void
}) {
  const def = ITEM_DEFS[result.itemType]
  const usingTeam = teams.find((t) => t.id === result.usingTeamId)
  const targetTeam = result.targetTeamId ? teams.find((t) => t.id === result.targetTeamId) : null
  const affectedTeams = teams.filter((t) => result.crystalDeltas[t.id] !== undefined)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-6"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.7, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="card p-6 w-full max-w-md text-center"
        style={{ borderColor: '#4f8cff', borderWidth: 2 }}
      >
        <motion.div
          animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.5, repeat: 1 }}
          className="text-7xl mb-2"
        >
          {def.icon}
        </motion.div>

        <h2 className="font-display text-3xl text-[#0f172a] mb-1">{def.name}</h2>
        <p className="text-[#475569] font-body mb-4">
          <span className="font-semibold">{usingTeam?.avatar.emoji} {usingTeam?.name}</span>
          {targetTeam && <> → {targetTeam.avatar.emoji} {targetTeam.name}</>}
        </p>

        {affectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {affectedTeams.map((t) => {
              const delta = result.crystalDeltas[t.id]!
              return (
                <motion.div
                  key={t.id}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.15 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border-2"
                  style={{ borderColor: t.avatar.color, background: t.avatar.bgColor }}
                >
                  <span className="text-xl">{t.avatar.emoji}</span>
                  <span className="font-display text-lg" style={{ color: delta > 0 ? '#10b981' : '#ef4444' }}>
                    {delta > 0 ? '+' : ''}{delta} 💎
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}

        {result.specialMsg && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-[#0f172a] font-body text-base mb-4 bg-[#f8fafc] rounded-xl p-3 border border-[#e5e7eb]"
          >
            {result.specialMsg}
          </motion.p>
        )}

        <Button fullWidth onClick={onDismiss}>OK ✓</Button>
      </motion.div>
    </motion.div>
  )
}

export function ItemPhaseScreen() {
  const { teams, useItem, skipItemPhase, fields } = useGameStore()
  const [timeLeft, setTimeLeft] = useState(30)
  const [selecting, setSelecting] = useState<Selecting | null>(null)
  const [bet, setBet] = useState(50)
  const [itemResult, setItemResult] = useState<ItemUsedResult | null>(null)

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

  const buildResult = (
    itemType: ItemType,
    usingTeamId: string,
    before: ReturnType<typeof takeSnapshot>,
    targetTeamId?: string,
    fieldIndex?: number,
  ): ItemUsedResult => {
    const after = useGameStore.getState().teams

    const crystalDeltas: Record<string, number> = {}
    before.forEach((bt) => {
      const at = after.find((t) => t.id === bt.id)
      if (at && at.crystals !== bt.crystals) crystalDeltas[bt.id] = at.crystals - bt.crystals
    })

    let specialMsg: string | undefined
    switch (itemType) {
      case 'shield':
        specialMsg = '🛡️ Schild aktiviert – nächster Angriff wird abgeblockt'
        break
      case 'anchor': {
        const tgt = after.find((t) => t.id === targetTeamId)
        specialMsg = `⚓ ${tgt?.name ?? 'Ziel'} kann diese Runde nicht ziehen`
        break
      }
      case 'double_step':
        specialMsg = '⚡ Würfelwert × 2 für diesen Zug'
        break
      case 'position_swap': {
        const src = after.find((t) => t.id === usingTeamId)
        const tgt = after.find((t) => t.id === targetTeamId)
        specialMsg = `↔️ Positionen getauscht! ${src?.avatar.emoji} Feld ${src?.position} ↔ ${tgt?.avatar.emoji} Feld ${tgt?.position}`
        break
      }
      case 'minefield':
        specialMsg = `💣 Mine auf Feld ${fieldIndex ?? '?'} platziert`
        break
      case 'turbo':
        specialMsg = '🚀 Turbo aktiv – nächste Runde automatisch 6 Augen'
        break
      case 'team_steal':
        specialMsg = '🃏 Platzierungs-Tausch ausstehend – wirkt beim nächsten Minispiel'
        break
      case 'double_or_nothing': {
        const b0 = before.find((b) => b.id === usingTeamId)
        const a0 = after.find((t) => t.id === usingTeamId)
        const staked = (b0?.crystals ?? 0) - (a0?.crystals ?? 0)
        specialMsg = `🎰 ${staked} 💎 gesetzt – bei Platz 1: ×3 zurück, sonst verloren`
        break
      }
      case 'crystal_steal': {
        if (Object.keys(crystalDeltas).length === 0) {
          specialMsg = '🛡️ Schild des Ziels hat den Angriff abgeblockt!'
        }
        break
      }
    }

    return { itemType, usingTeamId, targetTeamId, crystalDeltas, specialMsg }
  }

  const handleActivate = (teamId: string, itemId: string, itemType: ItemType) => {
    const def = ITEM_DEFS[itemType]
    if (def.needsTarget)      setSelecting({ teamId, itemId, itemType, step: 'target' })
    else if (def.needsField)  setSelecting({ teamId, itemId, itemType, step: 'field' })
    else if (def.needsAmount) setSelecting({ teamId, itemId, itemType, step: 'amount' })
    else {
      const before = takeSnapshot()
      useItem(teamId, itemId)
      setItemResult(buildResult(itemType, teamId, before))
    }
  }

  const handleTarget = (targetId: string) => {
    if (!selecting) return
    const { teamId, itemId, itemType } = selecting
    const before = takeSnapshot()
    useItem(teamId, itemId, targetId)
    setSelecting(null)
    setItemResult(buildResult(itemType, teamId, before, targetId))
  }

  const handleField = (fi: number) => {
    if (!selecting) return
    const { teamId, itemId, itemType } = selecting
    const before = takeSnapshot()
    useItem(teamId, itemId, undefined, fi)
    setSelecting(null)
    setItemResult(buildResult(itemType, teamId, before, undefined, fi))
  }

  const handleAmount = () => {
    if (!selecting) return
    const { teamId, itemId, itemType } = selecting
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
          <div key={team.id} className="card p-4" style={{ borderColor: team.avatar.color, borderWidth: 2 }}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-2xl border-2 flex-shrink-0"
                style={{ background: team.avatar.bgColor, borderColor: team.avatar.color }}
              >
                {team.avatar.emoji}
              </div>
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

      {/* Target / field / amount selection overlay */}
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
                        <span className="text-3xl">{t.avatar.emoji}</span>
                        <span className="font-display text-[#0f172a] text-lg">{t.name}</span>
                        <span className="ml-auto font-display text-[#f59e0b]">{t.crystals} 💎</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selecting.step === 'field' && (
                <>
                  <h2 className="font-display text-2xl text-[#0f172a] mb-2 text-center">💣 MINE PLATZIEREN</h2>
                  <p className="text-[#475569] font-body text-base text-center mb-5">Wähle ein Feld</p>
                  <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                    {fields.filter((f) => f.type !== 'start').map((f) => (
                      <button
                        key={f.index}
                        onClick={() => handleField(f.index)}
                        className="aspect-square rounded-lg border-2 border-[#e5e7eb] bg-white hover:border-[#ef4444] hover:bg-[#fee2e2] font-display text-[#0f172a] text-sm cursor-pointer transition-all"
                      >
                        {f.index}
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

      {/* Item result overlay */}
      <AnimatePresence>
        {itemResult && (
          <ItemResultOverlay
            result={itemResult}
            teams={teams}
            onDismiss={() => setItemResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
