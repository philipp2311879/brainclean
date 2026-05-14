import type { Avatar } from '../../types'
import { resolveTeamColor } from '../../data/avatars'

interface AvatarDisplayProps {
  avatar: Avatar
  size: number
  mode?: 'head' | 'full'
  className?: string
  style?: React.CSSProperties
}

/**
 * Renders the avatar image or emoji.
 * Image avatars always sit on a white background so transparent PNGs look clean.
 */
export function AvatarDisplay({ avatar, size, mode = 'head', className, style }: AvatarDisplayProps) {
  if (avatar.type === 'image' && avatar.src) {
    const wrapH = mode === 'full' ? Math.round(size * 1.35) : size
    return (
      <div
        className={className}
        style={{
          width: size, height: wrapH,
          backgroundColor: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: mode === 'head' ? '50%' : 0,
          flexShrink: 0,
          ...style,
        }}
      >
        <img
          src={avatar.src}
          alt={avatar.name}
          draggable={false}
          style={{
            width: '100%', height: '100%',
            objectFit: mode === 'head' ? 'cover' : 'contain',
            objectPosition: mode === 'head' ? 'top center' : 'center bottom',
            display: 'block',
          }}
        />
      </div>
    )
  }

  const fontSize = mode === 'head' ? Math.round(size * 0.55) : Math.round(size * 0.65)
  return (
    <span
      className={className}
      style={{ fontSize, lineHeight: 1, display: 'block', textAlign: 'center', flexShrink: 0, ...style }}
    >
      {avatar.emoji ?? '❓'}
    </span>
  )
}

// ── AvatarRingWrapper ─────────────────────────────────────────────────────────
// Renders an avatar inside a colored ring (supports rainbow gradient).
// outerSize = total diameter including the ring.

const RAINBOW_BG = 'conic-gradient(#EF4444, #F97316, #EAB308, #22C55E, #3B82F6, #A855F7, #EF4444)'

interface RingProps {
  avatar: Avatar
  jerseyColor: string | null
  outerSize: number
  mode?: 'head' | 'full'
  className?: string
  style?: React.CSSProperties
}

export function AvatarRingWrapper({ avatar, jerseyColor, outerSize, mode = 'head', className, style }: RingProps) {
  const ringW = Math.max(3, Math.round(outerSize * 0.075))
  const innerSize = outerSize - ringW * 2
  const isRainbow = jerseyColor === 'rainbow'
  const ringBg = isRainbow ? RAINBOW_BG : (jerseyColor ?? '#e2e8f0')

  if (mode === 'full') {
    return (
      <div
        className={className}
        style={{ borderRadius: 14, padding: ringW, background: ringBg, flexShrink: 0, display: 'inline-flex', ...style }}
      >
        <div style={{ borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
          <AvatarDisplay avatar={avatar} size={innerSize} mode="full" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ width: outerSize, height: outerSize, borderRadius: '50%', padding: ringW, background: ringBg, flexShrink: 0, ...style }}
    >
      <div style={{ width: innerSize, height: innerSize, borderRadius: '50%', overflow: 'hidden', background: '#fff' }}>
        <AvatarDisplay avatar={avatar} size={innerSize} mode="head" />
      </div>
    </div>
  )
}

/** Returns a CSS color string for shadows, text, borders that can't use the rainbow gradient. */
export { resolveTeamColor }

export function avatarLabel(avatar: Avatar): string {
  return avatar.type === 'emoji' ? (avatar.emoji ?? '?') : avatar.name.charAt(0).toUpperCase()
}
