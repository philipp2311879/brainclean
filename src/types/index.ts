export type GamePhase =
  | 'title'
  | 'setup'
  | 'teamSetup'
  | 'mapSetup'
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
  | 'team_steal'
  | 'double_or_nothing'

export interface Avatar {
  id: string
  emoji: string
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
  teamSwapPending: { fromTeamId: string; targetTeamId: string } | null
  doubleOrNothingPending: { teamId: string; amount: number } | null
  currentTeamSetupIndex: number
  diceResults: Record<string, number>
  crystalAwards: Record<string, number>
  walkingTeamOrder: string[]
  walkingTeamIndex: number
  currentEvent: EventData | null
  shopTeamId: string | null
  fieldEffectPending: FieldEffectPending | null
  collisionPending: CollisionPending | null
  minefieldSelectTeamId: string | null
  showMapOverlay: boolean
  preRoundSnapshot: Team[] | null
  lapBonusPending: { teamId: string; amount: number } | null
  pendingCollisionForAfter: CollisionPending | null
  showInfoOverlay: boolean
  streakShopTeamId: string | null
}
