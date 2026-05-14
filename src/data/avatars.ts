import type { Avatar } from '../types'

// ── Image-based characters ────────────────────────────────────────────────────
// To add a new character: drop a PNG in public/avatars/ and add one entry here.
// bgColor is always #ffffff so transparent PNGs render cleanly on a white background.
export const AVATARS: Avatar[] = [
  { id: 'potato',    type: 'image', src: '/avatars/potato.png',    name: 'Potato',    color: '#D4A537', bgColor: '#ffffff' },
  { id: 'dragon',    type: 'image', src: '/avatars/dragon.png',    name: 'Dragon',    color: '#F97316', bgColor: '#ffffff' },
  { id: 'fox',       type: 'image', src: '/avatars/fox.png',       name: 'Fox',       color: '#FB923C', bgColor: '#ffffff' },
  { id: 'melon',     type: 'image', src: '/avatars/melon.png',     name: 'Melon',     color: '#4ADE80', bgColor: '#ffffff' },
  { id: 'muscleboy', type: 'image', src: '/avatars/muscleboy.png', name: 'Muscleboy', color: '#3B82F6', bgColor: '#ffffff' },
  { id: 'alien',     type: 'image', src: '/avatars/alien.png',     name: 'Alien',     color: '#22D3EE', bgColor: '#ffffff' },
  { id: 'donut',     type: 'image', src: '/avatars/donut.png',     name: 'Donut',     color: '#F472B6', bgColor: '#ffffff' },
  { id: 'fireboy',   type: 'image', src: '/avatars/fireboy.png',   name: 'Fireboy',   color: '#EF4444', bgColor: '#ffffff' },
  { id: 'ghost',     type: 'image', src: '/avatars/ghost.png',     name: 'Ghost',     color: '#A78BFA', bgColor: '#ffffff' },
  { id: 'ninja',     type: 'image', src: '/avatars/ninja.png',     name: 'Ninja',     color: '#818CF8', bgColor: '#ffffff' },
  { id: 'penguin',   type: 'image', src: '/avatars/penguin.png',   name: 'Penguin',   color: '#60A5FA', bgColor: '#ffffff' },
  { id: 'plantboy',  type: 'image', src: '/avatars/plantboy.png',  name: 'Plantboy',  color: '#22C55E', bgColor: '#ffffff' },
  { id: 'unicorn',   type: 'image', src: '/avatars/unicorn.png',   name: 'Unicorn',   color: '#E879F9', bgColor: '#ffffff' },
  { id: 'wolf',      type: 'image', src: '/avatars/wolf.png',      name: 'Wolf',      color: '#94A3B8', bgColor: '#ffffff' },
]

export const TEAM_COLORS    = ['#D4A537', '#22D3EE', '#4ADE80', '#F472B6']
export const TEAM_BG_COLORS = ['#ffffff', '#ffffff', '#ffffff', '#ffffff']

// ── Leibchen-Farben (jersey colors) ──────────────────────────────────────────
export interface JerseyColorDef {
  id: string
  hex: string        // CSS hex or 'rainbow'
  name: string
}

export const JERSEY_COLORS: JerseyColorDef[] = [
  { id: 'red',     hex: '#EF4444', name: 'Rot' },
  { id: 'blue',    hex: '#3B82F6', name: 'Blau' },
  { id: 'green',   hex: '#22C55E', name: 'Grün' },
  { id: 'yellow',  hex: '#EAB308', name: 'Gelb' },
  { id: 'purple',  hex: '#A855F7', name: 'Lila' },
  { id: 'orange',  hex: '#F97316', name: 'Orange' },
  { id: 'rainbow', hex: 'rainbow', name: 'Regenbogen' },
]

/** Returns a single CSS color for non-ring uses (shadows, text, etc.) */
export function resolveTeamColor(jerseyColor: string | null, fallback: string): string {
  if (!jerseyColor) return fallback
  if (jerseyColor === 'rainbow') return '#7C3AED'  // purple as rainbow proxy
  return jerseyColor
}
