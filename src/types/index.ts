import type { AchievementProgress, AchievementQueueItem } from '../lib/achievements'

export type GamePhase =
  | 'title'
  | 'setup'
  | 'teamSetup'
  | 'mapSetup'
  | 'finaleAnnounce'
  | 'minigameAnnounce'
  | 'minigameActive'
  | 'placementInput'
  | 'streakShop'
  | 'crystalAward'
  | 'itemPhase'
  | 'rolling'
  | 'walking'
  | 'roundEnd'
  | 'gameOver'

export type FieldType = 'normal' | 'bonus' | 'trap' | 'item' | 'event' | 'shop' | 'start'

export type ItemType =
  | 'crystal_steal'
  | 'shield'
  | 'anchor'
  | 'double_step'
  | 'position_swap'
  | 'minefield'
  | 'turbo'

export interface Avatar {
  id: string
  type: 'emoji' | 'image'
  emoji?: string   // set for type='emoji'
  src?: string     // set for type='image', e.g. '/avatars/potato.png'
  name: string
  color: string
  bgColor: string
}

export interface ItemDef {
  type: ItemType
  name: string
  description: string
  icon: string
  price: number
  needsTarget: boolean
  needsField: boolean
  needsAmount: boolean
}

export interface Item {
  id: string
  type: ItemType
  name: string
  icon: string
}

export interface Field {
  index: number
  type: FieldType
  x: number
  y: number
  value?: number
}

export interface Mine {
  fieldIndex: number
  placedByTeamId: string
}

export interface Team {
  id: string
  name: string
  avatar: Avatar
  jerseyColor: string | null   // hex or 'rainbow'; null = not yet chosen during setup
  crystals: number
  position: number
  items: Item[]
  placement: number | null
  lapsCompleted: number
  hasShield: boolean
  usedItemThisRound: boolean
  anchoredThisRound: boolean
  doubleStepThisRound: boolean
  turboThisRound: boolean
  consecutiveFirstPlace: number
}

export interface Minigame {
  id: number
  name: string
  description: string
  video_url: string | null
  has_audio: boolean
  category: string | null
  created_at: string
}

export interface EventData {
  id: string
  name: string
  description: string
  icon: string
  color: string
  effect: EventEffect
}

export type EventEffect =
  | { type: 'crystal_rain'; amount: number }
  | { type: 'tax'; percent: number }
  | { type: 'revolution' }
  | { type: 'earthquake' }
  | { type: 'dark_round' }
  | { type: 'gifts' }
  | { type: 'jackpot_field' }
  | { type: 'bounty' }

export interface CollisionPending {
  attackerTeamId: string
  defenderTeamId: string
  crystalsStolen: number
  blocked: boolean
}

export interface FieldEffectPending {
  teamId: string
  fieldType: FieldType
  crystalDelta: number
  itemFound?: Item
  lapBonus?: number
  isMine?: boolean
  shopDenied?: boolean
}

export interface GameState {
  phase: GamePhase
  totalRounds: number
  currentRound: number
  numTeams: number
  teams: Team[]
  fields: Field[]
  activeMines: Mine[]
  jackpotFieldIndex: number | null
  darkRoundActive: boolean
  nextRoundDark: boolean
  bountyTargetTeamId: string | null
  currentTeamSetupIndex: number
  diceResults: Record<string, number>
  dicePairs: Record<string, [number, number]>
  crystalAwards: Record<string, number>
  walkingTeamOrder: string[]
  walkingTeamIndex: number
  itemPhaseOrder: string[]
  itemPhaseTeamIndex: number
  fieldOrder: Record<number, string[]>
  currentEvent: EventData | null
  shopTeamId: string | null
  fieldEffectPending: FieldEffectPending | null
  collisionPending: CollisionPending | null
  showMapOverlay: boolean
  preRoundSnapshot: Team[] | null
  lapBonusPending: { teamId: string; amount: number } | null
  pendingCollisionForAfter: CollisionPending | null
  showInfoOverlay: boolean
  streakShopTeamId: string | null
  finaleActive: boolean
  achievementProgress: AchievementProgress
  unlockedAchievements: Record<string, boolean>
  achievementQueue: AchievementQueueItem[]
}

// Re-export so consumers can import from types
export type { AchievementProgress, AchievementQueueItem }
