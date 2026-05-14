import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ItemType, Team, Field, Mine } from '../../types'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import { GameBoard } from '../board/GameBoard'

export interface ItemAnimResult {
  itemType: ItemType
  usingTeamId: string
  targetTeamId?: string
  crystalDeltas: Record<string, number>
  wasBlocked: boolean
  placedMineFieldIndex: number | null
  swapFromPos: number
  swapToPos: number
  specialMsg?: string
}

interface Props extends ItemAnimResult {
  teams: Team[]
  fields: Field[]
  activeMines: Mine[]
  jackpotFieldIndex: number | null
  onDismiss: () => void
}

const ANIM_MS: Partial<Record<ItemType, number>> = {
  crystal_steal: 3800,
  shield: 2800,
  anchor: 3400,
  double_step: 2800,
  position_swap: 4400,
  minefield: 5800,
  turbo: 2800,
  team_steal: 3400,
  double_or_nothing: 3400,
}

// ── Sub-animations ──────────────────────────────────────────────────────────

function AvatarCol({ team, label }: { team: Team; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <AvatarRingWrapper avatar={team.avatar} jerseyColor={team.jerseyColor} outerSize={64} />
      <span className="font-display text-sm text-[#0f172a]">{team.name}</span>
      {label && <span className="text-xs text-[#475569] font-body">{label}</span>}
    </div>
  )
}

function CrystalStealAnim({
  usingTeam, targetTeam, wasBlocked, crystalDeltas,
}: { usingTeam: Team; targetTeam: Team | null; wasBlocked: boolean; crystalDeltas: Record<string, number> }) {
  const stolen = Math.abs(Object.values(crystalDeltas).find((d) => d < 0) ?? 0)

  return (
    <div className="text-center">
      <div className="text-5xl mb-2">{wasBlocked ? '🛡️' : '💎🗡️'}</div>
      <h2 className="font-display text-2xl text-[#0f172a] mb-5">
        {wasBlocked ? 'ANGRIFF GEBLOCKT!' : 'KRISTALLRAUB!'}
      </h2>
      <div className="flex items-center justify-center gap-3 mb-5">
        <AvatarCol team={usingTeam} />
        <div className="relative w-20 h-14 flex items-center justify-center overflow-hidden flex-shrink-0">
          {wasBlocked ? (
            <>
              {[0, 1].map((i) => (
                <motion.div key={i}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: ['-30px', '20px', '-5px'], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.0, delay: 0.3 + i * 0.2, ease: 'easeInOut' }}
                  className="absolute text-lg font-display"
                >💎</motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
                transition={{ delay: 0.9, type: 'spring', stiffness: 300 }}
                className="absolute text-3xl"
              >🛡️</motion.div>
            </>
          ) : (
            [0, 1, 2].map((i) => (
              <motion.div key={i}
                initial={{ x: 35, y: (i - 1) * 10, opacity: 0 }}
                animate={{ x: -35, y: (i - 1) * 10, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.4, delay: 0.2 + i * 0.18, ease: 'easeInOut' }}
                className="absolute text-lg font-display"
              >💎</motion.div>
            ))
          )}
        </div>
        {targetTeam && <AvatarCol team={targetTeam} />}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0 }}
        className="font-display text-lg"
        style={{ color: wasBlocked ? '#10b981' : '#ef4444' }}
      >
        {wasBlocked
          ? `🛡️ ${targetTeam?.name}s Schild hat den Angriff geblockt!`
          : `${usingTeam.name} stiehlt ${stolen} 💎 von ${targetTeam?.name}!`}
      </motion.div>
    </div>
  )
}

function ShieldAnim({ usingTeam }: { usingTeam: Team }) {
  return (
    <div className="text-center">
      <div className="flex flex-col items-center gap-3 mb-4">
        <div className="relative">
          <AvatarRingWrapper avatar={usingTeam.avatar} jerseyColor={usingTeam.jerseyColor} outerSize={88} />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}
            className="absolute -top-4 -right-4 text-4xl"
          >🛡️</motion.div>
        </div>
        <div className="font-display text-xl text-[#0f172a]">{usingTeam.name}</div>
      </div>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.9, type: 'spring' }}
        className="font-display text-3xl text-[#10b981] mb-2"
      >🛡️ SCHILD AKTIVIERT!</motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="text-[#475569] font-body"
      >Nächster Angriff wird automatisch geblockt</motion.p>
    </div>
  )
}

function AnchorAnim({ usingTeam, targetTeam }: { usingTeam: Team; targetTeam: Team | null }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl text-[#0f172a] mb-4">ANKER!</h2>
      <div className="flex flex-col items-center gap-2">
        <motion.div
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.2 }}
          className="text-5xl"
        >⚓</motion.div>
        {targetTeam && (
          <motion.div
            animate={{ y: [0, 10, 2], rotate: [-4, 4, 0] }}
            transition={{ duration: 0.5, delay: 0.9, repeat: 2 }}
            className="flex flex-col items-center gap-1 mt-1"
          >
            <AvatarRingWrapper avatar={targetTeam.avatar} jerseyColor={targetTeam.jerseyColor} outerSize={72} />
            <span className="font-display text-base text-[#0f172a]">{targetTeam.name}</span>
          </motion.div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0 }}
        className="font-display text-lg text-[#475569] mt-4"
      >⚓ {targetTeam?.name} ist verankert! Kann diese Runde nicht laufen!</motion.div>
    </div>
  )
}

function DoubleStepAnim({ usingTeam }: { usingTeam: Team }) {
  const tColor = resolveTeamColor(usingTeam.jerseyColor, usingTeam.avatar.color)
  return (
    <div className="text-center">
      <div className="flex flex-col items-center gap-3 mb-4">
        <div className="relative">
          {[-14, -7, 0, 7, 14].map((offset, i) => (
            <motion.div key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1, 0], opacity: [0, 0.55, 0] }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.06, repeat: 4, repeatDelay: 0.25 }}
              className="absolute rounded-full"
              style={{ width: 56, height: 4, right: '100%', marginRight: 4, top: '50%', marginTop: offset, background: tColor, transformOrigin: 'right' }}
            />
          ))}
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.4, repeat: 5 }}>
            <AvatarRingWrapper avatar={usingTeam.avatar} jerseyColor={usingTeam.jerseyColor} outerSize={80} />
          </motion.div>
        </div>
        <div className="font-display text-xl text-[#0f172a]">{usingTeam.name}</div>
      </div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.0, type: 'spring' }}
        className="font-display text-4xl text-[#4f8cff] mb-2"
      >👟 ×2</motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-[#475569] font-body">
        Würfelergebnis wird verdoppelt!
      </motion.p>
    </div>
  )
}

function PositionSwapAnim({ usingTeam, targetTeam, swapFromPos, swapToPos }: {
  usingTeam: Team; targetTeam: Team | null; swapFromPos: number; swapToPos: number
}) {
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl text-[#0f172a] mb-6">PLATZTAUSCH!</h2>
      <div className="relative h-28 w-72 mx-auto overflow-hidden">
        <motion.div
          className="absolute flex flex-col items-center gap-0.5"
          style={{ left: 10, top: 0 }}
          initial={{ x: 0 }}
          animate={{ x: 148 }}
          transition={{ duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
        >
          <AvatarRingWrapper avatar={usingTeam.avatar} jerseyColor={usingTeam.jerseyColor} outerSize={64} />
          <span className="font-display text-xs text-[#0f172a]">{usingTeam.name}</span>
          <span className="text-[10px] text-[#475569]">{swapFromPos}→{swapToPos}</span>
        </motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="absolute text-2xl"
          style={{ left: '50%', top: 20, transform: 'translateX(-50%)' }}
        >🔄</motion.div>
        {targetTeam && (
          <motion.div
            className="absolute flex flex-col items-center gap-0.5"
            style={{ right: 10, top: 0 }}
            initial={{ x: 0 }}
            animate={{ x: -148 }}
            transition={{ duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
          >
            <AvatarRingWrapper avatar={targetTeam.avatar} jerseyColor={targetTeam.jerseyColor} outerSize={64} />
            <span className="font-display text-xs text-[#0f172a]">{targetTeam.name}</span>
            <span className="text-[10px] text-[#475569]">{swapToPos}→{swapFromPos}</span>
          </motion.div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8 }}
        className="font-display text-xl text-[#10b981] mt-3"
      >🔄 Plätze getauscht!</motion.div>
    </div>
  )
}

function MinefieldAnim({ usingTeam, targetFieldIndex, fields, teams, activeMines, jackpotFieldIndex }: {
  usingTeam: Team
  targetFieldIndex: number | null
  fields: Field[]
  teams: Team[]
  activeMines: Mine[]
  jackpotFieldIndex: number | null
}) {
  const [minePhase, setMinePhase] = useState<'flying' | 'impact' | 'hidden'>('flying')
  const targetField = targetFieldIndex !== null ? fields.find((f) => f.index === targetFieldIndex) ?? null : null

  const waypoints = useMemo(() => [
    { x: 20 + Math.random() * 25, y: 15 + Math.random() * 20 },
    { x: 58 + Math.random() * 22, y: 28 + Math.random() * 28 },
    { x: 25 + Math.random() * 28, y: 52 + Math.random() * 22 },
  ], [])

  useEffect(() => {
    const t1 = setTimeout(() => setMinePhase('impact'), 2800)
    const t2 = setTimeout(() => setMinePhase('hidden'), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const mineXs = [...waypoints.map((w) => `${w.x}%`), targetField ? `${targetField.x}%` : '50%']
  const mineYs = [...waypoints.map((w) => `${w.y}%`), targetField ? `${targetField.y}%` : '50%']

  return (
    <div className="text-center">
      <h2 className="font-display text-xl text-[#0f172a] mb-3">
        💣 {usingTeam.name} platziert eine Mine!
      </h2>
      <div className="relative w-full rounded-xl overflow-hidden mb-3" style={{ height: 230 }}>
        <GameBoard
          fields={fields} teams={teams} activeMines={[]}
          jackpotFieldIndex={jackpotFieldIndex} compact={true}
        />
        {/* Flying mine */}
        {minePhase === 'flying' && (
          <motion.div
            className="absolute pointer-events-none select-none"
            style={{ fontSize: 26, zIndex: 60, transform: 'translate(-50%,-50%)' }}
            initial={{ left: '50%', top: '8%' }}
            animate={{ left: mineXs, top: mineYs }}
            transition={{ duration: 2.6, ease: 'easeInOut', times: [0, 0.28, 0.62, 1] }}
          >💣</motion.div>
        )}
        {/* Impact */}
        <AnimatePresence>
          {minePhase === 'impact' && targetField && (
            <motion.div
              className="absolute pointer-events-none select-none"
              style={{
                left: `${targetField.x}%`, top: `${targetField.y}%`,
                transform: 'translate(-50%,-50%)', zIndex: 60, fontSize: 44,
              }}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: [0.2, 2.2, 1.3, 0.8], opacity: [1, 0.9, 0.7, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0 }}
            >💥</motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.4 }}
        className="font-display text-lg text-[#475569]"
      >💣 Mine wurde heimlich platziert!</motion.div>
    </div>
  )
}

function TurboAnim({ usingTeam }: { usingTeam: Team }) {
  return (
    <div className="text-center">
      <div className="flex flex-col items-center gap-2 mb-4">
        <motion.div
          animate={{ scaleY: [0.7, 1.3, 0.7], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.28, repeat: 10 }}
          className="text-3xl"
          style={{ transformOrigin: 'top' }}
        >🔥🔥🔥</motion.div>
        <motion.div
          animate={{ y: [0, -22, 0] }}
          transition={{ duration: 0.7, delay: 0.5, type: 'spring', stiffness: 240 }}
        >
          <AvatarRingWrapper avatar={usingTeam.avatar} jerseyColor={usingTeam.jerseyColor} outerSize={84} />
        </motion.div>
        <div className="font-display text-xl text-[#0f172a]">{usingTeam.name}</div>
      </div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.0, type: 'spring' }}
        className="font-display text-3xl text-[#f97316] mb-2"
      >🚀 TURBO!</motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-[#475569] font-body">
        Garantiert 6 beim Würfeln!
      </motion.p>
    </div>
  )
}

function TeamStealAnim({ usingTeam, targetTeam }: { usingTeam: Team; targetTeam: Team | null }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl text-[#0f172a] mb-5">TEAMKLAU!</h2>
      <div className="flex items-center justify-center gap-4 mb-5">
        <AvatarCol team={usingTeam} />
        <div className="relative w-16 h-12 flex items-center justify-center overflow-visible">
          <motion.div
            initial={{ x: -35, opacity: 0 }}
            animate={{ x: [-35, 0, 35], opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
            className="absolute text-3xl"
          >🦹</motion.div>
        </div>
        {targetTeam && (
          <div className="relative">
            <AvatarRingWrapper avatar={targetTeam.avatar} jerseyColor={targetTeam.jerseyColor} outerSize={64} />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 0.85], opacity: [0, 0.65, 0.5] }}
              transition={{ delay: 1.7, type: 'spring' }}
              className="absolute inset-0 flex items-center justify-center text-3xl pointer-events-none"
            >🦹</motion.div>
            <div className="font-display text-sm text-[#0f172a] text-center mt-1">{targetTeam.name}</div>
          </div>
        )}
      </div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0 }}
        className="text-[#475569] font-body text-base"
      >🦹 Platzierungen werden beim nächsten Minispiel getauscht!</motion.p>
    </div>
  )
}

function DoubleOrNothingAnim({ usingTeam, crystalDeltas }: { usingTeam: Team; crystalDeltas: Record<string, number> }) {
  const bet = Math.abs(crystalDeltas[usingTeam.id] ?? 0)
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl text-[#0f172a] mb-4">DOPPEL-ODER-NICHTS!</h2>
      <div className="flex flex-col items-center gap-3 mb-4 relative">
        <AvatarRingWrapper avatar={usingTeam.avatar} jerseyColor={usingTeam.jerseyColor} outerSize={72} />
        <div className="font-display text-xl text-[#0f172a]">{usingTeam.name}</div>
        <div className="relative h-14 w-full flex justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div key={i}
              initial={{ y: 0, x: (i - 1) * 22, opacity: 1 }}
              animate={{ y: -55, x: (i - 1) * 22, opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.2 + i * 0.14, ease: 'easeOut' }}
              className="absolute text-2xl"
            >💎</motion.div>
          ))}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.7, 1.15, 1], opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute text-3xl"
            style={{ top: -4 }}
          >💰</motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="font-display text-3xl text-[#f59e0b] mb-1"
      >{bet} 💎 gesetzt!</motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="text-[#475569] font-body text-sm">
        🎰 Bei 1. Platz: ×3 zurück. Sonst: verloren!
      </motion.p>
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────────────────

export function ItemAnimationOverlay({
  itemType, usingTeamId, targetTeamId,
  crystalDeltas, wasBlocked, placedMineFieldIndex, swapFromPos, swapToPos,
  teams, fields, activeMines, jackpotFieldIndex,
  onDismiss,
}: Props) {
  const duration = ANIM_MS[itemType] ?? 3400
  const usingTeam = teams.find((t) => t.id === usingTeamId)
  const targetTeam = targetTeamId ? (teams.find((t) => t.id === targetTeamId) ?? null) : null

  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [])

  if (!usingTeam) return null

  const isWide = itemType === 'minefield'

  let content: React.ReactNode = null
  switch (itemType) {
    case 'crystal_steal':
      content = <CrystalStealAnim usingTeam={usingTeam} targetTeam={targetTeam} wasBlocked={wasBlocked} crystalDeltas={crystalDeltas} />
      break
    case 'shield':
      content = <ShieldAnim usingTeam={usingTeam} />
      break
    case 'anchor':
      content = <AnchorAnim usingTeam={usingTeam} targetTeam={targetTeam} />
      break
    case 'double_step':
      content = <DoubleStepAnim usingTeam={usingTeam} />
      break
    case 'position_swap':
      content = <PositionSwapAnim usingTeam={usingTeam} targetTeam={targetTeam} swapFromPos={swapFromPos} swapToPos={swapToPos} />
      break
    case 'minefield':
      content = (
        <MinefieldAnim
          usingTeam={usingTeam} targetFieldIndex={placedMineFieldIndex}
          fields={fields} teams={teams} activeMines={activeMines} jackpotFieldIndex={jackpotFieldIndex}
        />
      )
      break
    case 'turbo':
      content = <TurboAnim usingTeam={usingTeam} />
      break
    case 'team_steal':
      content = <TeamStealAnim usingTeam={usingTeam} targetTeam={targetTeam} />
      break
    case 'double_or_nothing':
      content = <DoubleOrNothingAnim usingTeam={usingTeam} crystalDeltas={crystalDeltas} />
      break
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-6"
    >
      <motion.div
        initial={{ scale: 0.85, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260 }}
        className={`card p-6 w-full ${isWide ? 'max-w-2xl' : 'max-w-md'} relative overflow-hidden`}
        style={{ minHeight: 200 }}
      >
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-20"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.4, delay: 0.2 }}
          style={{ background: 'linear-gradient(90deg,transparent,white,transparent)', width: '50%' }}
        />
        {content}
      </motion.div>
    </motion.div>
  )
}
