import { motion } from 'framer-motion'
import type { Field, Team, Mine } from '../../types'
import { POSITIONS } from '../../utils/mapGenerator'

interface GameBoardProps {
  fields: Field[]
  teams: Team[]
  activeMines: Mine[]
  jackpotFieldIndex: number | null
  highlightField?: number
  animatingTeamId?: string
  animatingPosition?: number
  compact?: boolean
}

interface FieldStyle {
  bg: string
  border: string
  icon: string
  label?: string
  size: number
  shadow: string
  textColor: string
}

const FIELD_STYLES: Record<string, FieldStyle> = {
  start:  { bg: 'linear-gradient(135deg,#fef9c3,#fde68a)', border: '#d97706', icon: '🏁', label: 'START', size: 78, shadow: '0 4px 16px rgba(217,119,6,0.45)', textColor: '#92400e' },
  normal: { bg: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', border: '#94a3b8', icon: '',   size: 64, shadow: '0 2px 8px rgba(0,0,0,0.10)',  textColor: '#64748b' },
  bonus:  { bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', border: '#3b82f6', icon: '💎', size: 72, shadow: '0 4px 14px rgba(59,130,246,0.35)', textColor: '#1e40af' },
  trap:   { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', border: '#ef4444', icon: '💀', size: 72, shadow: '0 4px 14px rgba(239,68,68,0.35)',  textColor: '#991b1b' },
  item:   { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '#10b981', icon: '🎁', size: 72, shadow: '0 4px 14px rgba(16,185,129,0.35)', textColor: '#065f46' },
  event:  { bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', border: '#8b5cf6', icon: '⚡', size: 72, shadow: '0 4px 14px rgba(139,92,246,0.35)', textColor: '#5b21b6' },
  shop:   { bg: 'linear-gradient(135deg,#ffedd5,#fed7aa)', border: '#f97316', icon: '🏪', size: 72, shadow: '0 4px 14px rgba(249,115,22,0.35)', textColor: '#9a3412' },
}

// Decorative emoji placed between the path rows (won't overlap with fields)
const DECORATIONS = [
  // Between row 1 (y=18) and row 2 (y=50)
  { emoji: '🌲', x: 15, y: 32 }, { emoji: '🌸', x: 29, y: 28 },
  { emoji: '🪨', x: 43, y: 34 }, { emoji: '💎', x: 57, y: 30 },
  { emoji: '🌿', x: 71, y: 33 }, { emoji: '🌺', x: 85, y: 30 },
  // Between row 2 (y=50) and row 3 (y=82)
  { emoji: '🌲', x: 14, y: 64 }, { emoji: '🌻', x: 27, y: 67 },
  { emoji: '🪨', x: 38, y: 63 }, { emoji: '🌊', x: 50, y: 66 },
  { emoji: '🍀', x: 62, y: 64 }, { emoji: '🦋', x: 74, y: 68 },
  { emoji: '🌸', x: 86, y: 65 },
  // Edges / top / bottom
  { emoji: '☁️', x: 30, y:  7 }, { emoji: '☁️', x: 65, y:  6 },
  { emoji: '✨', x: 48, y:  8 },
  { emoji: '🌱', x: 35, y: 92 }, { emoji: '🌱', x: 56, y: 93 },
]

export function GameBoard({
  fields, teams, activeMines, jackpotFieldIndex,
  highlightField, animatingTeamId, animatingPosition, compact,
}: GameBoardProps) {
  const scale = compact ? 0.72 : 1

  const teamsByPos: Record<number, Team[]> = {}
  for (const t of teams) {
    const pos = t.id === animatingTeamId && animatingPosition !== undefined ? animatingPosition : t.position
    if (!teamsByPos[pos]) teamsByPos[pos] = []
    teamsByPos[pos].push(t)
  }

  // Build SVG polyline through all fields in order
  const polyPoints = POSITIONS.map((p) => `${p.x},${p.y}`).join(' ')

  // Closing bezier from last field (92,82) back to first (8,18)
  const closingPath = `M 92,82 C 100,82 100,10 8,18`

  return (
    <div className="relative w-full h-full board-bg overflow-hidden">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #a8b4c0 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Decorative elements */}
      {DECORATIONS.map((d, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            transform: 'translate(-50%,-50%)',
            fontSize: compact ? 14 : 20,
            zIndex: 1,
            opacity: 0.7,
          }}
        >
          {d.emoji}
        </div>
      ))}

      {/* SVG: path + arrows + closing segment */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ zIndex: 2 }}
      >
        {/* Main path (solid) */}
        <polyline
          points={polyPoints}
          fill="none"
          stroke="#c5a87a"
          strokeWidth={compact ? 2 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={compact ? '4 4' : '7 5'}
        />
        {/* Closing loop (dashed, subtle) */}
        <path
          d={closingPath}
          fill="none"
          stroke="#c5a87a"
          strokeWidth={compact ? 1.5 : 2}
          strokeDasharray="5 5"
          opacity="0.5"
        />
        {/* Direction arrows every 3 fields */}
        {POSITIONS.filter((_, i) => i % 3 === 1 && i < POSITIONS.length - 1).map((pos, i) => {
          const next = POSITIONS[i * 3 + 2]
          if (!next) return null
          const angle = Math.atan2(next.y - pos.y, next.x - pos.x) * (180 / Math.PI)
          return (
            <g key={i} transform={`translate(${(pos.x + next.x) / 2},${(pos.y + next.y) / 2}) rotate(${angle})`}>
              <polygon points="-2,-1.4 2,0 -2,1.4" fill="#b8987a" opacity="0.8" />
            </g>
          )
        })}
      </svg>

      {/* Fields */}
      {fields.map((field) => {
        const isJackpot = jackpotFieldIndex === field.index
        const isHighlight = highlightField === field.index
        const hasMine = activeMines.some((m) => m.fieldIndex === field.index)
        const teamsHere = teamsByPos[field.index] ?? []

        const style: FieldStyle = isJackpot
          ? { bg: 'linear-gradient(135deg,#fef08a,#fde047)', border: '#d97706', icon: '🎰', size: 72, shadow: '0 4px 20px rgba(217,119,6,0.6)', textColor: '#713f12' }
          : (FIELD_STYLES[field.type] ?? FIELD_STYLES.normal)

        const sz = Math.round(style.size * scale)
        const iconSize = Math.round(sz * (field.type === 'normal' ? 0 : 0.44))

        return (
          <div
            key={field.index}
            className="absolute"
            style={{ left: `${field.x}%`, top: `${field.y}%`, transform: 'translate(-50%,-50%)', zIndex: 10 }}
          >
            <motion.div
              animate={
                isJackpot
                  ? { scale: [1, 1.1, 1], boxShadow: [style.shadow, '0 6px 30px rgba(217,119,6,0.7)', style.shadow] }
                  : isHighlight
                  ? { scale: [1, 1.22, 1.12] }
                  : {}
              }
              transition={{ duration: isJackpot ? 1.4 : 0.25, repeat: isJackpot ? Infinity : 0 }}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 select-none"
              style={{
                width: sz,
                height: sz,
                background: style.bg,
                borderColor: isHighlight ? '#4f8cff' : style.border,
                borderWidth: isHighlight ? 3 : 2,
                boxShadow: isHighlight ? `0 0 0 4px rgba(79,140,255,0.3), ${style.shadow}` : style.shadow,
              }}
            >
              {field.type === 'normal' && !isJackpot ? (
                <span className="font-display" style={{ fontSize: Math.round(sz * 0.28), color: style.textColor }}>
                  {field.index}
                </span>
              ) : (
                <span style={{ fontSize: iconSize, lineHeight: 1 }}>{style.icon}</span>
              )}

              {field.type === 'start' && (
                <span className="font-display mt-0.5" style={{ fontSize: Math.round(sz * 0.16), color: style.textColor }}>
                  START
                </span>
              )}

              {(field.type === 'bonus' || field.type === 'trap') && field.value && (
                <span
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-display rounded-full px-2 py-0.5 border text-white"
                  style={{
                    fontSize: 11,
                    background: style.border,
                    borderColor: style.border,
                  }}
                >
                  {field.type === 'trap' ? '-' : '+'}{field.value}
                </span>
              )}

              {hasMine && (
                <span className="absolute -top-2 -right-2 text-sm bg-white rounded-full border border-red-300 p-0.5">💣</span>
              )}
            </motion.div>

            {/* Avatars */}
            {teamsHere.length > 0 && (
              <div
                className="absolute flex"
                style={{ top: -Math.round(sz * 0.52), left: '50%', transform: 'translateX(-50%)' }}
              >
                {teamsHere.map((team, idx) => {
                  const avSz = Math.round(sz * 0.68)
                  // Use position as key so the bounce animation re-fires each time the avatar hops
                  const isAnimating = team.id === animatingTeamId
                  const posKey = isAnimating ? `${team.id}-${animatingPosition}` : team.id
                  return (
                    <motion.div
                      key={posKey}
                      initial={{ y: isAnimating ? -24 : -14, scaleY: isAnimating ? 0.6 : 1, opacity: 0 }}
                      animate={{ y: 0, scaleY: 1, opacity: 1 }}
                      transition={
                        isAnimating
                          ? { type: 'spring', stiffness: 420, damping: 18, mass: 0.7 }
                          : { type: 'spring', stiffness: 500, damping: 22 }
                      }
                      className="rounded-full flex items-center justify-center border-2"
                      style={{
                        width: avSz, height: avSz,
                        background: team.avatar.bgColor,
                        borderColor: team.avatar.color,
                        boxShadow: `0 3px 10px ${team.avatar.color}66`,
                        fontSize: Math.round(avSz * 0.6),
                        zIndex: idx + 1,
                        marginLeft: idx > 0 ? -Math.round(avSz * 0.28) : 0,
                      }}
                    >
                      {team.avatar.emoji}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
