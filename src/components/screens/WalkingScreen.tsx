import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { GameBoard } from '../board/GameBoard'
import { Button } from '../ui/Button'
import { ShopOverlay } from '../overlays/ShopOverlay'
import { EventOverlay } from '../overlays/EventOverlay'
import { FIELD_TOTAL } from '../../utils/mapGenerator'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import { soundManager } from '../../lib/soundManager'

const STEP_DELAY       = 600
const HIGHLIGHT_HOLD   = 200
const LAST_FIELD_PAUSE = 1000
const BETWEEN_TEAMS    = 1000
const ZOOM_SCALE       = 2.2

type CollisionStep = 'bang' | 'transfer' | 'result'

// Mid-walk shop state (shop triggered while passing through, not landing)
interface MidWalkShop {
  startPos: number
  step: number
  total: number
}

export function WalkingScreen() {
  const {
    teams, fields, activeMines, jackpotFieldIndex,
    diceResults, walkingTeamOrder, walkingTeamIndex,
    fieldEffectPending, collisionPending, lapBonusPending, currentEvent, shopTeamId,
    advanceWalkingTeam, confirmCollision, confirmFieldEffect, confirmLapBonus,
    confirmEvent, closeShop,
  } = useGameStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [animatingPosition, setAnimatingPosition] = useState<number | undefined>(undefined)
  const [highlightField, setHighlightField] = useState<number | undefined>(undefined)
  const [isMoving, setIsMoving] = useState(false)
  const [midWalkShop, setMidWalkShop] = useState<MidWalkShop | null>(null)

  const [collisionStep, setCollisionStep] = useState<CollisionStep>('bang')
  const collisionTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const currentTeamId = walkingTeamOrder[walkingTeamIndex]
  const currentTeam = teams.find((t) => t.id === currentTeamId)
  const dice = currentTeam ? (diceResults[currentTeam.id] ?? 0) : 0

  const zoomTargetIndex = highlightField ?? animatingPosition ?? currentTeam?.position ?? 0
  const zoomField = fields[zoomTargetIndex]
  const zoomX = zoomField?.x ?? 50
  const zoomY = zoomField?.y ?? 50

  // ── Start a team's walk ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTeam || fieldEffectPending || collisionPending || lapBonusPending || currentEvent || shopTeamId || midWalkShop) return
    setCurrentStep(0)
    setAnimatingPosition(currentTeam.position)
    setIsMoving(false)

    const delay = walkingTeamIndex === 0 ? 400 : BETWEEN_TEAMS
    const timer = setTimeout(() => {
      if (dice === 0) { advanceWalkingTeam(currentTeam.position, false); return }
      setIsMoving(true)
      moveStep(currentTeam.position, 0, dice)
    }, delay)
    return () => clearTimeout(timer)
  }, [walkingTeamIndex, currentTeamId])

  // ── Field-by-field movement ───────────────────────────────────────────────
  const moveStep = (startPos: number, step: number, total: number) => {
    if (step >= total) return
    setTimeout(() => {
      const nextStep = step + 1
      const nextPos = (startPos + nextStep) % FIELD_TOTAL
      setAnimatingPosition(nextPos)
      setHighlightField(nextPos)
      setCurrentStep(nextStep)

      const isLastStep = nextStep >= total
      const isShopHere = fields[nextPos]?.type === 'shop'

      if (isLastStep) {
        soundManager.playSFX('land')
        setTimeout(() => {
          setHighlightField(undefined)
          setIsMoving(false)
          advanceWalkingTeam(nextPos, startPos + total >= FIELD_TOTAL)
        }, LAST_FIELD_PAUSE)
      } else if (isShopHere) {
        soundManager.playSFX('step')
        setTimeout(() => {
          setHighlightField(undefined)
          setIsMoving(false)
          setMidWalkShop({ startPos, step: nextStep, total })
        }, HIGHLIGHT_HOLD + 200)
      } else {
        soundManager.playSFX('step')
        setTimeout(() => setHighlightField(undefined), HIGHLIGHT_HOLD)
        moveStep(startPos, nextStep, total)
      }
    }, STEP_DELAY)
  }

  // Resume walk after mid-walk shop is closed
  const resumeAfterShop = () => {
    if (!midWalkShop) return
    const { startPos, step, total } = midWalkShop
    setMidWalkShop(null)
    setTimeout(() => {
      setIsMoving(true)
      moveStep(startPos, step, total)
    }, 300)
  }

  // Clear animation state when an effect popup appears + play SFX
  useEffect(() => {
    if (fieldEffectPending) {
      setAnimatingPosition(undefined)
      setIsMoving(false)
      if (fieldEffectPending.crystalDelta > 0) soundManager.playSFX('crystal_gain')
      else if (fieldEffectPending.crystalDelta < 0) {
        // Mine trap vs normal trap
        const isMine = fieldEffectPending.fieldType === 'trap' && fieldEffectPending.crystalDelta === -120
        soundManager.playSFX(isMine ? 'mine_explode' : 'crystal_lose')
      }
    }
    if (collisionPending) {
      setAnimatingPosition(undefined)
      setIsMoving(false)
    }
    if (lapBonusPending) {
      setAnimatingPosition(undefined)
      setIsMoving(false)
      soundManager.playSFX('crystal_gain')
    }
  }, [fieldEffectPending, collisionPending, lapBonusPending])

  // ── Collision sequence ────────────────────────────────────────────────────
  useEffect(() => {
    if (!collisionPending) { setCollisionStep('bang'); return }
    clearTimeout(collisionTimerRef.current)
    setCollisionStep('bang')
    soundManager.playSFX(collisionPending.blocked ? 'shield_block' : 'collision')
    collisionTimerRef.current = setTimeout(() => {
      setCollisionStep('transfer')
      collisionTimerRef.current = setTimeout(() => setCollisionStep('result'), 1500)
    }, 1200)
    return () => clearTimeout(collisionTimerRef.current)
  }, [collisionPending])

  if (!currentTeam) return null

  const attackerTeam = collisionPending ? teams.find((t) => t.id === collisionPending.attackerTeamId) : null
  const defenderTeam = collisionPending ? teams.find((t) => t.id === collisionPending.defenderTeamId) : null

  return (
    <div className="w-full h-full flex flex-col pt-16 screen-base">
      {/* Team banner */}
      <div className="px-5 py-2.5 flex items-center gap-3 bg-white border-b border-[#e5e7eb] shadow-card flex-shrink-0">
        <AvatarRingWrapper
          avatar={currentTeam.avatar}
          jerseyColor={currentTeam.jerseyColor}
          outerSize={48}
          style={{ boxShadow: `0 0 12px ${resolveTeamColor(currentTeam.jerseyColor, currentTeam.avatar.color)}44`, flexShrink: 0 }}
        />
        <div>
          <span className="font-display text-[#0f172a] text-xl">{currentTeam.name}</span>
          <span className="text-[#475569] font-body text-sm ml-2">
            {dice === 0 ? '⚓ verankert' : `läuft ${dice} Schritt${dice !== 1 ? 'e' : ''}`}
          </span>
        </div>

        <div className="ml-4 flex gap-1.5 flex-wrap max-w-xs">
          {Array.from({ length: Math.min(dice, 12) }, (_, i) => (
            <div key={i} className="w-3 h-3 rounded-full transition-all duration-300"
              style={{ background: i < currentStep ? resolveTeamColor(currentTeam.jerseyColor, currentTeam.avatar.color) : '#e2e8f0', boxShadow: i < currentStep ? `0 0 6px ${resolveTeamColor(currentTeam.jerseyColor, currentTeam.avatar.color)}` : 'none' }} />
          ))}
          {dice > 12 && <span className="text-[#94a3b8] text-xs font-body">+{dice - 12}</span>}
        </div>

        <div className="ml-auto flex gap-2 items-center">
          {walkingTeamOrder.map((id, idx) => {
            const t = teams.find((x) => x.id === id)
            if (!t) return null
            return (
              <div key={id} style={{ opacity: idx < walkingTeamIndex ? 0.35 : 1 }}>
                <AvatarRingWrapper
                  avatar={t.avatar}
                  jerseyColor={t.jerseyColor}
                  outerSize={36}
                  style={{ boxShadow: idx === walkingTeamIndex ? `0 0 10px ${resolveTeamColor(t.jerseyColor, t.avatar.color)}66` : 'none' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 relative overflow-hidden p-4">
        <motion.div
          className="w-full h-full"
          animate={isMoving ? { scale: ZOOM_SCALE, x: `${ZOOM_SCALE * (50 - zoomX)}%`, y: `${ZOOM_SCALE * (50 - zoomY)}%` } : { scale: 1, x: '0%', y: '0%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <GameBoard fields={fields} teams={teams} activeMines={activeMines} jackpotFieldIndex={jackpotFieldIndex}
            highlightField={highlightField} animatingTeamId={currentTeamId} animatingPosition={animatingPosition} />
        </motion.div>
      </div>

      {/* ── Collision ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {collisionPending && attackerTeam && defenderTeam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
            <motion.div
              initial={{ scale: 0.5, y: 40 }}
              animate={collisionStep === 'bang' ? { scale: 1, y: 0, x: [0, -8, 8, -5, 5, 0] } : { scale: 1, y: 0, x: 0 }}
              transition={{ type: 'spring', damping: 16 }}
              className="card p-8 text-center max-w-md w-full mx-4"
              style={{ borderWidth: 3, borderColor: collisionPending.blocked ? '#10b981' : '#ef4444' }}
            >
              <div className="text-7xl mb-3">{collisionPending.blocked ? '🛡️' : collisionStep === 'bang' ? '💥' : collisionStep === 'transfer' ? '💫' : '✅'}</div>
              <h2 className="font-display text-3xl text-[#0f172a] mb-4">{collisionPending.blocked ? 'SCHILD AKTIVIERT!' : 'ZUSAMMENSTOSS!'}</h2>

              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.div animate={collisionStep === 'transfer' && !collisionPending.blocked ? { x: [0, 12, 0] } : {}} transition={{ duration: 0.6, repeat: 2 }} className="flex flex-col items-center gap-1">
                  <AvatarRingWrapper avatar={attackerTeam.avatar} jerseyColor={attackerTeam.jerseyColor} outerSize={64} />
                  <span className="font-display text-xs text-[#475569]">{attackerTeam.name}</span>
                </motion.div>
                <div className="relative w-20 flex items-center justify-center">
                  {collisionStep === 'transfer' && !collisionPending.blocked && (
                    <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: -30, opacity: [0, 1, 1, 0] }} transition={{ duration: 1.2 }} className="absolute font-display text-2xl">💎</motion.div>
                  )}
                  <span className="text-[#d1d5db] text-2xl">→</span>
                </div>
                <motion.div animate={collisionStep === 'transfer' && !collisionPending.blocked ? { x: [0, -12, 0] } : {}} transition={{ duration: 0.6, repeat: 2 }} className="flex flex-col items-center gap-1">
                  <AvatarRingWrapper avatar={defenderTeam.avatar} jerseyColor={defenderTeam.jerseyColor} outerSize={64} />
                  <span className="font-display text-xs text-[#475569]">{defenderTeam.name}</span>
                </motion.div>
              </div>

              {collisionPending.blocked ? (
                <p className="text-[#475569] font-body text-lg mb-5"><strong className="text-[#0f172a]">{defenderTeam.name}</strong> war durch einen Schild geschützt!</p>
              ) : (
                <div className="mb-5">
                  {collisionStep !== 'bang' && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div className="font-display text-5xl mb-1" style={{ color: '#10b981' }}>+{collisionPending.crystalsStolen} 💎</div>
                      <p className="text-[#475569] font-body text-base">
                        <strong style={{ color: resolveTeamColor(attackerTeam.jerseyColor, attackerTeam.avatar.color) }}>{attackerTeam.name}</strong>
                        {' stiehlt von '}
                        <strong style={{ color: resolveTeamColor(defenderTeam.jerseyColor, defenderTeam.avatar.color) }}>{defenderTeam.name}</strong>!
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {(collisionStep === 'result' || collisionPending.blocked) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button onClick={confirmCollision} size="lg" fullWidth>WEITER →</Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lap bonus ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lapBonusPending && !collisionPending && !fieldEffectPending && !currentEvent && !shopTeamId && !midWalkShop && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 flex items-center justify-center z-40">
            <motion.div initial={{ scale: 0.5, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }}
              className="card p-8 text-center max-w-sm w-full mx-4" style={{ borderWidth: 3, borderColor: '#d97706' }}>
              <div className="text-7xl mb-3">🏁</div>
              <div className="font-display text-3xl text-[#0f172a] mb-3">RUNDENBONUS!</div>
              <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="font-display text-6xl mb-4" style={{ color: '#d97706' }}>
                +{lapBonusPending.amount} 💎
              </motion.div>
              <p className="text-[#475569] font-body text-lg mb-5">
                {teams.find((t) => t.id === lapBonusPending.teamId)?.name} hat eine komplette Runde geschafft!
              </p>
              <Button onClick={confirmLapBonus} size="lg" fullWidth>WEITER →</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Field effect ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {fieldEffectPending && !currentEvent && !shopTeamId && !collisionPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-40"
            style={{ background: fieldEffectPending.isMine ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)' }}>

            {/* ── MINE BOOM popup ── */}
            {fieldEffectPending.isMine ? (
              <motion.div
                initial={{ scale: 0.3, y: 60 }}
                animate={{ scale: 1, y: 0, x: [0, -12, 12, -8, 8, -4, 4, 0] }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="card p-10 text-center max-w-sm w-full mx-4"
                style={{ borderWidth: 4, borderColor: '#ef4444', background: '#fff1f2' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 0.9, 1.2, 1], rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 0.6, repeat: 1 }}
                  className="text-8xl mb-4"
                >
                  💥
                </motion.div>
                <h2 className="font-display text-5xl text-[#ef4444] mb-2">BOOM!</h2>
                <p className="text-[#475569] font-body text-lg mb-4">
                  <strong style={{ color: resolveTeamColor(teams.find((t) => t.id === fieldEffectPending.teamId)?.jerseyColor ?? null, teams.find((t) => t.id === fieldEffectPending.teamId)?.avatar.color ?? '#0f172a') }}>
                    {teams.find((t) => t.id === fieldEffectPending.teamId)?.name}
                  </strong>
                  {' ist auf eine MINE gelaufen!'}
                </p>
                <motion.div
                  initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
                  className="font-display text-6xl mb-5" style={{ color: '#ef4444' }}
                >
                  {fieldEffectPending.crystalDelta} 💎
                </motion.div>
                <Button onClick={confirmFieldEffect} size="lg" fullWidth>WEITER →</Button>
              </motion.div>
            ) : (
            <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 22 }}
              className="card p-8 text-center max-w-sm w-full mx-4"
              style={{ borderWidth: 2, borderColor: fieldEffectPending.fieldType === 'bonus' ? '#3b82f6' : fieldEffectPending.fieldType === 'trap' ? '#ef4444' : '#e5e7eb' }}>
              <div className="text-7xl mb-3">
                {fieldEffectPending.fieldType === 'bonus' && '💎'}
                {fieldEffectPending.fieldType === 'trap' && '💀'}
                {fieldEffectPending.fieldType === 'item' && '🎁'}
                {fieldEffectPending.shopDenied && '🚫'}
                {(fieldEffectPending.fieldType === 'normal' || fieldEffectPending.fieldType === 'start') && '📍'}
              </div>
              <div className="font-display text-2xl text-[#0f172a] mb-2">
                {fieldEffectPending.fieldType === 'bonus' && 'BONUS-FELD!'}
                {fieldEffectPending.fieldType === 'trap' && 'FALLEN-FELD!'}
                {fieldEffectPending.fieldType === 'item' && 'ITEM-FELD!'}
                {fieldEffectPending.shopDenied && 'NICHT GENUG KRISTALLE!'}
                {fieldEffectPending.fieldType === 'normal' && 'Normales Feld'}
              </div>
              {fieldEffectPending.shopDenied && (
                <p className="text-[#475569] font-body mb-3">Mindestens 50 💎 nötig für den Shop.</p>
              )}
              {fieldEffectPending.crystalDelta > 0 && (
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                  className="font-display text-6xl mb-2" style={{ color: '#10b981' }}>
                  +{fieldEffectPending.crystalDelta} 💎
                </motion.div>
              )}
              {fieldEffectPending.crystalDelta < 0 && (
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                  className="font-display text-6xl mb-2" style={{ color: '#ef4444' }}>
                  {fieldEffectPending.crystalDelta} 💎
                </motion.div>
              )}
              {fieldEffectPending.itemFound && (
                <div className="font-display text-2xl mb-2" style={{ color: '#10b981' }}>
                  {fieldEffectPending.itemFound.icon} {fieldEffectPending.itemFound.name}!
                </div>
              )}
              <Button onClick={confirmFieldEffect} size="lg" fullWidth className="mt-2">WEITER →</Button>
            </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mid-walk shop (passing through) */}
      {midWalkShop && (
        <ShopOverlay teamId={currentTeamId} onClose={resumeAfterShop} />
      )}

      {currentEvent && <EventOverlay event={currentEvent} onConfirm={confirmEvent} />}
      {shopTeamId   && <ShopOverlay teamId={shopTeamId} onClose={closeShop} />}
    </div>
  )
}
