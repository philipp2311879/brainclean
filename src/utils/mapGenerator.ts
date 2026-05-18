import type { Field, FieldType } from '../types'

export const FIELD_TOTAL = 30

const R1Y = 20, R2Y = 50, R3Y = 80
const ROW_XS = [6, 16, 26, 35, 45, 55, 65, 74, 84, 94]

export const POSITIONS: { x: number; y: number }[] = [
  ...ROW_XS.map((x) => ({ x, y: R1Y })),
  ...[...ROW_XS].reverse().map((x) => ({ x, y: R2Y })),
  ...ROW_XS.map((x) => ({ x, y: R3Y })),
]

export interface MapConfig {
  bonus: number  // default 5
  trap:  number  // default 4
  event: number  // default 4
  shop:  number  // default 2
}

export const DEFAULT_CONFIG: MapConfig = { bonus: 5, trap: 4, event: 4, shop: 2 }

export function normalCount(cfg: MapConfig): number {
  return FIELD_TOTAL - 1 - cfg.shop - cfg.bonus - cfg.trap - cfg.event
}

// Fisher-Yates in-place shuffle
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Shop zones: first and second third of the map ────────────────────────────
// Shop #1: positions  8-12
// Shop #2: positions 18-22
// Shop #3: positions 24-28  (if config.shop === 3)
const SHOP_ZONES = [[8, 12], [18, 22], [24, 28]]

export function generateMap(config: MapConfig = DEFAULT_CONFIG): Field[] {
  const types = buildRandom(config)
  return POSITIONS.map((pos, i) => ({
    index: i,
    type: types[i],
    x: pos.x,
    y: pos.y,
    value: getFieldValue(types[i]),
  }))
}

function buildRandom(config: MapConfig): FieldType[] {
  // Try up to 40 times for a valid random layout
  for (let attempt = 1; attempt <= 40; attempt++) {
    const types = tryOnce(config)
    if (validateCounts(types, config)) {
      const counts = countTypes(types)
      console.log(`[BrainArena] Map generated (attempt ${attempt}):`, counts)
      return types
    }
  }
  console.warn('[BrainArena] Falling back to deterministic map')
  return fallback(config)
}

function tryOnce(config: MapConfig): FieldType[] {
  const types: FieldType[] = new Array(FIELD_TOTAL).fill('normal') as FieldType[]
  types[0] = 'start'

  // ── 1. Place shops in their designated zones (truly random within zone) ──
  const takenShopZones: number[] = []
  for (let s = 0; s < config.shop && s < SHOP_ZONES.length; s++) {
    const [lo, hi] = SHOP_ZONES[s]
    const candidates = shuffle(
      Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((p) => types[p] === 'normal'),
    )
    if (candidates.length > 0) {
      types[candidates[0]] = 'shop'
      takenShopZones.push(candidates[0])
    }
  }

  // ── 2. Collect all remaining 'normal' positions (excluding 0 and shops) ──
  const available: number[] = []
  for (let i = 1; i < FIELD_TOTAL; i++) {
    if (types[i] === 'normal') available.push(i)
  }
  shuffle(available) // TRUE random shuffle every time

  // ── 3. Build pool of specials and shuffle it ─────────────────────────────
  const specials: FieldType[] = shuffle([
    ...Array<FieldType>(config.bonus).fill('bonus'),
    ...Array<FieldType>(config.trap).fill('trap'),
    ...Array<FieldType>(config.event).fill('event'),
  ])

  // ── 4. Assign specials to the shuffled available positions ───────────────
  for (let i = 0; i < specials.length && i < available.length; i++) {
    types[available[i]] = specials[i]
  }

  return types
}

function validateCounts(types: FieldType[], config: MapConfig): boolean {
  const c = countTypes(types)
  return (
    (c.start  ?? 0) === 1           &&
    (c.shop   ?? 0) === config.shop  &&
    (c.bonus  ?? 0) === config.bonus &&
    (c.trap   ?? 0) === config.trap  &&
    (c.event  ?? 0) === config.event &&
    (c.normal ?? 0) === normalCount(config) &&
    types.length    === FIELD_TOTAL
  )
}

function countTypes(types: FieldType[]): Partial<Record<FieldType, number>> {
  const c: Partial<Record<FieldType, number>> = {}
  for (const t of types) c[t] = (c[t] ?? 0) + 1
  return c
}

// Deterministic fallback guaranteed to have correct counts
function fallback(config: MapConfig): FieldType[] {
  const types: FieldType[] = new Array(FIELD_TOTAL).fill('normal') as FieldType[]
  types[0] = 'start'

  // Fixed shop positions
  const shopPositions = [10, 20, 26]
  for (let s = 0; s < config.shop && s < shopPositions.length; s++) {
    types[shopPositions[s]] = 'shop'
  }

  // Spread remaining specials at fixed intervals
  let idx = 2
  const placeN = (type: FieldType, n: number) => {
    for (let i = 0; i < n; i++) {
      while (types[idx] !== 'normal') idx++
      if (idx < FIELD_TOTAL) { types[idx] = type; idx += 2 }
    }
  }
  placeN('bonus', config.bonus)
  placeN('trap',  config.trap)
  placeN('event', config.event)
  return types
}

function getFieldValue(type: FieldType): number | undefined {
  if (type === 'bonus') return Math.floor(Math.random() * 31) + 10  // 10–40
  if (type === 'trap')  return Math.floor(Math.random() * 21) + 10  // 10–30
  return undefined
}
