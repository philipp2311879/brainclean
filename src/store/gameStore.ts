import { create } from 'zustand'
import type {
  GameState, Team, Field, Mine, EventData, Item,
  FieldEffectPending, CollisionPending,
} from '../types'
import { AVATARS } from '../data/avatars'
import { generateMap, FIELD_TOTAL } from '../utils/mapGenerator'
import { randomEvent } from '../data/events'
import { randomItemFromField, makeItem, ITEM_DEFS } from '../data/items'
import {
  ACHIEVEMENT_DEFS, initialAchievementProgress, unlockKey,
  type AchievementProgress, type AchievementQueueItem,
} from '../lib/achievements'

let teamIdCounter = 0

function makeDefaultTeam(index: number): Team {
  return {
    id: `team-${++teamIdCounter}`,
    name: `Team ${index + 1}`,
    avatar: AVATARS[index],   // visual default; only teams that have "been through setup" block others
    jerseyColor: null,         // must be chosen explicitly during setup
    crystals: 0,
    position: 0,
    items: [],
    placement: null,
    lapsCompleted: 0,
    hasShield: false,
    usedItemThisRound: false,
    anchoredThisRound: false,
    doubleStepThisRound: false,
    turboThisRound: false,
    consecutiveFirstPlace: 0,
  }
}

const initialState: GameState = {
  phase: 'title',
  totalRounds: 5,
  currentRound: 0,
  numTeams: 4,
  teams: [],
  fields: [],
  activeMines: [],
  jackpotFieldIndex: null,
  darkRoundActive: false,
  nextRoundDark: false,
  bountyTargetTeamId: null,
  currentTeamSetupIndex: 0,
  diceResults: {},
  dicePairs: {},
  crystalAwards: {},
  walkingTeamOrder: [],
  walkingTeamIndex: 0,
  itemPhaseOrder: [],
  itemPhaseTeamIndex: 0,
  fieldOrder: {},
  currentEvent: null,
  shopTeamId: null,
  fieldEffectPending: null,
  collisionPending: null,
  showMapOverlay: false,
  showInfoOverlay: false,
  preRoundSnapshot: null,
  lapBonusPending: null,
  pendingCollisionForAfter: null,
  streakShopTeamId: null,
  finaleActive: false,
  achievementProgress: initialAchievementProgress(),
  unlockedAchievements: {},
  achievementQueue: [],
}

// ── Achievement helpers ──────────────────────────────────────────────────────
// round: achievements are skipped in round 1
function tryUnlock(
  achievementId: string,
  teamId: string,
  condition: boolean,
  unlocked: Record<string, boolean>,
  queue: AchievementQueueItem[],
  teams: Team[],
  round: number,
): void {
  if (round <= 1) return  // no achievements in round 1
  const def = ACHIEVEMENT_DEFS.find((a) => a.id === achievementId)
  if (!def || !condition) return
  const key = unlockKey(achievementId, teamId, def.perTeam)
  if (unlocked[key]) return
  const team = teams.find((t) => t.id === teamId)
  if (!team) return
  unlocked[key] = true
  queue.push({ achievementId, teamId, teamName: team.name, teamEmoji: team.avatar.emoji ?? team.avatar.name.charAt(0) })
}

function checkCrystalAchievements(
  teams: Team[],
  progress: AchievementProgress,
  unlocked: Record<string, boolean>,
  queue: AchievementQueueItem[],
  round: number,
) {
  if (round <= 1) return
  for (const t of teams) {
    tryUnlock('pleitegeier', t.id, t.crystals === 0, unlocked, queue, teams, round)
  }
}

// ── Store interface ─────────────────────────────────────────────────────────
interface GameStore extends GameState {
  goToSetup: () => void
  setTotalRounds: (n: number) => void
  setNumTeams: (n: number) => void
  startTeamSetup: () => void
  updateTeamName: (name: string) => void
  updateTeamAvatar: (avatarId: string) => void
  setJerseyColor: (color: string) => void
  confirmTeam: () => void
  startGame: () => void
  startGameFromMapSetup: (fields: import('../types').Field[]) => void
  startMinigame: () => void
  endMinigame: () => void
  setPlacement: (teamId: string, placement: number) => void
  confirmPlacements: () => void
  finishCrystalAward: () => void
  useItem: (teamId: string, itemId: string, targetTeamId?: string) => void
  advanceItemPhaseTeam: () => void
  skipItemPhase: () => void
  rollDice: () => void
  finishRolling: () => void
  advanceWalkingTeam: (newPosition: number, passedStart: boolean) => void
  confirmCollision: () => void
  confirmFieldEffect: () => void
  confirmLapBonus: () => void
  confirmEvent: () => void
  buyItem: (itemType: import('../types').ItemType, overrideTeamId?: string) => void
  closeShop: () => void
  closeStreakShop: () => void
  nextRound: () => void
  newGame: () => void
  goBackToPreviousDecision: () => void
  setShowMapOverlay: (show: boolean) => void
  setShowInfoOverlay: (show: boolean) => void
  dismissAchievement: () => void
  _advanceToNextTeam: () => void
  _applyEvent: (event: EventData, teams: Team[], mines: Mine[], jackpot: number | null) => void
  _processFieldEffect: (teamId: string, position: number, teams: Team[], mines: Mine[], jackpot: number | null) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  goToSetup: () => set({ phase: 'setup' }),
  setTotalRounds: (n) => set({ totalRounds: n }),
  setNumTeams: (n) => set({ numTeams: n }),

  startTeamSetup: () => {
    const { numTeams } = get()
    const teams = Array.from({ length: numTeams }, (_, i) => makeDefaultTeam(i))
    set({ teams, currentTeamSetupIndex: 0, phase: 'teamSetup' })
  },

  updateTeamName: (name) => {
    const { teams, currentTeamSetupIndex } = get()
    const updated = [...teams]
    updated[currentTeamSetupIndex] = { ...updated[currentTeamSetupIndex], name }
    set({ teams: updated })
  },

  updateTeamAvatar: (avatarId) => {
    const { teams, currentTeamSetupIndex } = get()
    const avatar = AVATARS.find((a) => a.id === avatarId)
    if (!avatar) return
    const updated = [...teams]
    updated[currentTeamSetupIndex] = { ...updated[currentTeamSetupIndex], avatar }
    set({ teams: updated })
  },

  setJerseyColor: (color: string) => {
    const { teams, currentTeamSetupIndex } = get()
    const updated = [...teams]
    updated[currentTeamSetupIndex] = { ...updated[currentTeamSetupIndex], jerseyColor: color }
    set({ teams: updated })
  },

  confirmTeam: () => {
    const { currentTeamSetupIndex, numTeams } = get()
    if (currentTeamSetupIndex + 1 >= numTeams) {
      set({ phase: 'mapSetup' })
    } else {
      set({ currentTeamSetupIndex: currentTeamSetupIndex + 1 })
    }
  },

  startGameFromMapSetup: (fields) => {
    set({ fields, currentRound: 1, phase: 'minigameAnnounce' })
  },

  startGame: () => {
    const fields = generateMap()
    set({ fields, currentRound: 1, phase: 'minigameAnnounce' })
  },

  startMinigame: () => set({ phase: 'minigameActive' }),

  endMinigame: () => {
    const reset = get().teams.map((t) => ({
      ...t,
      placement: null,
      usedItemThisRound: false,
      anchoredThisRound: false,
      doubleStepThisRound: false,
      turboThisRound: false,
    }))
    set({ teams: reset, phase: 'placementInput' })
  },

  setPlacement: (teamId, placement) => {
    const updated = get().teams.map((t) => (t.id === teamId ? { ...t, placement } : t))
    set({ teams: updated })
  },

  confirmPlacements: () => {
    const {
      teams, darkRoundActive, nextRoundDark, bountyTargetTeamId,
      finaleActive, currentRound,
      achievementProgress: prog, unlockedAchievements, achievementQueue,
    } = get()

    const preRoundSnapshot = teams.map((t) => ({ ...t }))

    // Finale = 2x base ranges
    const finaleMultiplier = finaleActive ? 2 : 1
    const baseRanges: [number, number][] = [
      [ 90 * finaleMultiplier, 120 * finaleMultiplier],
      [ 65 * finaleMultiplier,  95 * finaleMultiplier],
      [ 45 * finaleMultiplier,  70 * finaleMultiplier],
      [ 25 * finaleMultiplier,  50 * finaleMultiplier],
    ]

    const teamsWithPlacements = [...teams]

    // ── Determine worst (last) placement for dark-round penalty ────────────
    const placementsUsed = teamsWithPlacements.map((t) => t.placement ?? 4)
    const maxPlace = Math.max(...placementsUsed)
    const minPlace = Math.min(...placementsUsed)
    const hasMultipleTiers = maxPlace > minPlace // at least two distinct placements

    const awards: Record<string, number> = {}
    for (const team of teamsWithPlacements) {
      const p = (team.placement ?? teams.length) - 1
      const [rMin, rMax] = baseRanges[Math.min(p, baseRanges.length - 1)]
      let amount = Math.floor(Math.random() * (rMax - rMin + 1)) + rMin

      // Dark round: LAST place teams get 0 crystals (only if multiple tiers exist)
      if (darkRoundActive && hasMultipleTiers && team.placement === maxPlace) amount = 0

      // Bounty: any team that placed BETTER (lower number) than the bounty target gets +150
      if (bountyTargetTeamId) {
        const target = teamsWithPlacements.find((t) => t.id === bountyTargetTeamId)
        if (
          target && target.placement !== null && team.placement !== null &&
          team.id !== bountyTargetTeamId && team.placement < target.placement
        ) {
          amount += 150
        }
      }

      awards[team.id] = amount
    }

    // ── Streak: only if EXACTLY ONE team is on Platz 1 ────────────────────
    const firstPlaceCount = teamsWithPlacements.filter((t) => t.placement === 1).length
    const aloneFirst = firstPlaceCount === 1

    // ── Achievement progress ───────────────────────────────────────────────
    const newProg = { ...prog }
    const newUnlocked = { ...unlockedAchievements }
    const newQueue = [...achievementQueue]
    const skipAchievements = currentRound <= 1  // no achievements in round 1

    // Snapshot worst crystal rank before awards for Comeback Kid
    const sortedByCrystals = [...teams].sort((a, b) => a.crystals - b.crystals)
    for (const t of teams) {
      if (!newProg.firstPlaceCount[t.id]) newProg.firstPlaceCount[t.id] = 0
    }

    let streakShopTeamId: string | null = null
    const teamsWithStreak = teamsWithPlacements.map((t) => {
      if (t.placement === 1) {
        if (aloneFirst) {
          // Unique first place → streak counts
          const newStreak = t.consecutiveFirstPlace + 1
          newProg.firstPlaceCount[t.id] = (newProg.firstPlaceCount[t.id] ?? 0) + 1
          if (newStreak >= 2) {
            streakShopTeamId = t.id
            if (newStreak >= 3) awards[t.id] = (awards[t.id] ?? 0) + 50
          }
          if (!skipAchievements) {
            tryUnlock('unaufhaltbar', t.id, newStreak >= 3, newUnlocked, newQueue, teams, currentRound)
            tryUnlock('dominator', t.id, (newProg.firstPlaceCount[t.id] ?? 0) >= 4, newUnlocked, newQueue, teams, currentRound)
          }
          return { ...t, consecutiveFirstPlace: newStreak }
        } else {
          // Tied for first → reset streak, still count for dominator
          newProg.firstPlaceCount[t.id] = (newProg.firstPlaceCount[t.id] ?? 0) + 1
          if (!skipAchievements) {
            tryUnlock('dominator', t.id, (newProg.firstPlaceCount[t.id] ?? 0) >= 4, newUnlocked, newQueue, teams, currentRound)
          }
          return { ...t, consecutiveFirstPlace: 0 }
        }
      }
      return { ...t, consecutiveFirstPlace: 0 }
    })

    set({
      crystalAwards: awards,
      teams: teamsWithStreak,
      darkRoundActive: nextRoundDark,
      nextRoundDark: false,
      bountyTargetTeamId: null,
      preRoundSnapshot,
      streakShopTeamId,
      achievementProgress: newProg,
      unlockedAchievements: newUnlocked,
      achievementQueue: newQueue,
      phase: streakShopTeamId ? 'streakShop' : 'crystalAward',
    })
  },

  finishCrystalAward: () => {
    const { teams, crystalAwards, currentRound, achievementProgress: prog, unlockedAchievements, achievementQueue } = get()
    const updated = teams.map((t) => ({
      ...t,
      crystals: Math.max(0, t.crystals + (crystalAwards[t.id] ?? 0)),
    }))

    const newProg = { ...prog }
    const newUnlocked = { ...unlockedAchievements }
    const newQueue = [...achievementQueue]
    checkCrystalAchievements(updated, newProg, newUnlocked, newQueue, currentRound)

    // Sequential item phase: worst placement first, random within same placement
    const shuffled = [...updated].sort(() => Math.random() - 0.5)
    const itemPhaseOrder = shuffled
      .sort((a, b) => (b.placement ?? 0) - (a.placement ?? 0))
      .map((t) => t.id)

    const hasUsableItems = updated.some((t) => t.items.some((i) => i.type !== 'shield'))
    set({
      teams: updated,
      achievementProgress: newProg,
      unlockedAchievements: newUnlocked,
      achievementQueue: newQueue,
      itemPhaseOrder,
      itemPhaseTeamIndex: 0,
      phase: hasUsableItems ? 'itemPhase' : 'rolling',
    })
  },

  useItem: (teamId, itemId, targetTeamId) => {
    let { teams, activeMines, fields, currentRound, achievementProgress: prog, unlockedAchievements, achievementQueue } = get()
    const team = teams.find((t) => t.id === teamId)
    const item = team?.items.find((i) => i.id === itemId)
    if (!team || !item) return

    teams = teams.map((t) =>
      t.id === teamId ? { ...t, items: t.items.filter((i) => i.id !== itemId), usedItemThisRound: true } : t,
    )

    const newProg = { ...prog }
    const newUnlocked = { ...unlockedAchievements }
    const newQueue = [...achievementQueue]

    switch (item.type) {
      case 'crystal_steal': {
        const target = teams.find((t) => t.id === targetTeamId)
        if (target) {
          if (target.hasShield) {
            teams = teams.map((t) => (t.id === targetTeamId ? { ...t, hasShield: false } : t))
          } else {
            const stolen = Math.min(100, target.crystals)  // fixed: steal 100, not 80
            teams = teams.map((t) => {
              if (t.id === targetTeamId) return { ...t, crystals: Math.max(0, t.crystals - stolen) }
              if (t.id === teamId)       return { ...t, crystals: t.crystals + stolen }
              return t
            })
          }
        }
        break
      }
      case 'shield':
        teams = teams.map((t) => (t.id === teamId ? { ...t, hasShield: true } : t))
        break
      case 'anchor':
        teams = teams.map((t) => (t.id === targetTeamId ? { ...t, anchoredThisRound: true } : t))
        break
      case 'double_step':
        teams = teams.map((t) => (t.id === teamId ? { ...t, doubleStepThisRound: true } : t))
        break
      case 'position_swap': {
        const src = teams.find((t) => t.id === teamId)
        const tgt = teams.find((t) => t.id === targetTeamId)
        if (src && tgt) {
          const tmp = src.position
          teams = teams.map((t) => {
            if (t.id === teamId)       return { ...t, position: tgt.position }
            if (t.id === targetTeamId) return { ...t, position: tmp }
            return t
          })
        }
        break
      }
      case 'minefield': {
        const existingMineFields = new Set(activeMines.map((m) => m.fieldIndex))
        const validFields = fields.filter(
          (f) => f.type !== 'start' && f.index !== team.position && !existingMineFields.has(f.index),
        )
        if (validFields.length > 0) {
          const chosen = validFields[Math.floor(Math.random() * validFields.length)]
          activeMines = [...activeMines, { fieldIndex: chosen.index, placedByTeamId: teamId }]
        }
        break
      }
      case 'turbo':
        teams = teams.map((t) => (t.id === teamId ? { ...t, turboThisRound: true } : t))
        break
    }

    set({ teams, activeMines, achievementProgress: newProg, unlockedAchievements: newUnlocked, achievementQueue: newQueue })
  },

  advanceItemPhaseTeam: () => {
    const { itemPhaseOrder, itemPhaseTeamIndex } = get()
    const next = itemPhaseTeamIndex + 1
    if (next >= itemPhaseOrder.length) {
      set({ phase: 'rolling' })
    } else {
      set({ itemPhaseTeamIndex: next })
    }
  },

  skipItemPhase: () => set({ phase: 'rolling' }),

  rollDice: () => {
    const { teams, darkRoundActive } = get()
    const results: Record<string, number> = {}
    const pairs: Record<string, [number, number]> = {}
    for (const team of teams) {
      if (team.anchoredThisRound) {
        results[team.id] = 0
        pairs[team.id] = [0, 0]
      } else if (team.turboThisRound) {
        results[team.id] = 12
        pairs[team.id] = [6, 6]
      } else {
        const d1 = Math.floor(Math.random() * 6) + 1
        const d2 = Math.floor(Math.random() * 6) + 1
        let roll = d1 + d2
        if (darkRoundActive && team.placement === 1) roll += Math.floor(Math.random() * 6) + 1
        if (team.doubleStepThisRound) roll *= 2
        results[team.id] = roll
        pairs[team.id] = [d1, d2]
      }
    }
    set({ diceResults: results, dicePairs: pairs })
  },

  finishRolling: () => {
    const { teams } = get()
    // Sort by placement, randomize within same placement
    const order: string[] = []
    for (let p = 1; p <= 4; p++) {
      const group = teams.filter((t) => t.placement === p)
      // Fisher-Yates shuffle within same-placement group
      for (let i = group.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[group[i], group[j]] = [group[j], group[i]]
      }
      for (const t of group) order.push(t.id)
    }
    // Teams with no placement (edge case) go last
    for (const t of teams) if (!order.includes(t.id)) order.push(t.id)
    set({ walkingTeamOrder: order, walkingTeamIndex: 0, phase: 'walking' })
  },

  advanceWalkingTeam: (newPosition, passedStart) => {
    let { teams, activeMines, jackpotFieldIndex, fieldOrder, currentRound, achievementProgress: prog, unlockedAchievements, achievementQueue } = get()
    const { walkingTeamOrder, walkingTeamIndex } = get()
    const teamId = walkingTeamOrder[walkingTeamIndex]
    const team = teams.find((t) => t.id === teamId)
    if (!team) return

    const newProg = { ...prog }
    const newUnlocked = { ...unlockedAchievements }
    const newQueue = [...achievementQueue]

    // 1. Update position + field order tracking
    teams = teams.map((t) => (t.id === teamId ? { ...t, position: newPosition } : t))
    // Remove team from every field, add to new position
    const newFieldOrder: Record<number, string[]> = {}
    for (const [k, v] of Object.entries(fieldOrder)) {
      newFieldOrder[Number(k)] = (v as string[]).filter((id) => id !== teamId)
    }
    newFieldOrder[newPosition] = [...(newFieldOrder[newPosition] ?? []), teamId]

    // 2. Lap bonus
    const lapBonus = passedStart ? 100 : 0
    if (lapBonus) {
      teams = teams.map((t) => (t.id === teamId ? { ...t, crystals: t.crystals + lapBonus, lapsCompleted: t.lapsCompleted + 1 } : t))
    }

    // 3. Mine check
    const mine = activeMines.find((m) => m.fieldIndex === newPosition && m.placedByTeamId !== teamId)
    if (mine) {
      activeMines = activeMines.filter((m) => m !== mine)
      if (teams.find((t) => t.id === teamId)!.hasShield) {
        teams = teams.map((t) => (t.id === teamId ? { ...t, hasShield: false } : t))
        set({ teams, activeMines, fieldOrder: newFieldOrder, lapBonusPending: lapBonus ? { teamId, amount: lapBonus } : null, pendingCollisionForAfter: null, achievementProgress: newProg, unlockedAchievements: newUnlocked, achievementQueue: newQueue })
        get()._processFieldEffect(teamId, newPosition, teams, activeMines, jackpotFieldIndex)
      } else {
        teams = teams.map((t) =>
          t.id === teamId ? { ...t, crystals: Math.max(0, t.crystals - 100) } : t,
        )
        newProg.mineHits[teamId] = (newProg.mineHits[teamId] ?? 0) + 1
        tryUnlock('minenopfer', teamId, true, newUnlocked, newQueue, teams, currentRound)
        set({
          teams, activeMines, fieldOrder: newFieldOrder,
          lapBonusPending: lapBonus ? { teamId, amount: lapBonus } : null,
          pendingCollisionForAfter: null,
          fieldEffectPending: { teamId, fieldType: 'trap', crystalDelta: -100, isMine: true },
          achievementProgress: newProg,
          unlockedAchievements: newUnlocked,
          achievementQueue: newQueue,
        })
      }
      return
    }

    // 4. Jackpot check
    if (jackpotFieldIndex === newPosition) {
      teams = teams.map((t) => (t.id === teamId ? { ...t, crystals: t.crystals + 300 } : t))
      jackpotFieldIndex = null
      checkCrystalAchievements(teams, newProg, newUnlocked, newQueue, currentRound)
    }

    // 5. Collision — steal from the last-landed team on this field
    let pendingCollision: typeof initialState['pendingCollisionForAfter'] = null
    const othersAtField = (newFieldOrder[newPosition] ?? []).filter((id) => id !== teamId)
    if (othersAtField.length > 0) {
      const lastDefenderId = othersAtField[othersAtField.length - 1]
      const defender = teams.find((t) => t.id === lastDefenderId)
      if (defender && defender.hasShield) {
        teams = teams.map((t) => (t.id === defender.id ? { ...t, hasShield: false } : t))
        pendingCollision = { attackerTeamId: teamId, defenderTeamId: defender.id, crystalsStolen: 0, blocked: true }
      } else if (defender) {
        const stolen = Math.min(Math.floor(Math.random() * 26) + 25, defender.crystals)
        teams = teams.map((t) => {
          if (t.id === teamId)      return { ...t, crystals: t.crystals + stolen }
          if (t.id === defender.id) return { ...t, crystals: Math.max(0, t.crystals - stolen) }
          return t
        })
        pendingCollision = { attackerTeamId: teamId, defenderTeamId: defender.id, crystalsStolen: stolen, blocked: false }
      }
    }

    checkCrystalAchievements(teams, newProg, newUnlocked, newQueue, currentRound)

    set({
      teams, activeMines, jackpotFieldIndex,
      fieldOrder: newFieldOrder,
      pendingCollisionForAfter: pendingCollision,
      lapBonusPending: lapBonus ? { teamId, amount: lapBonus } : null,
      achievementProgress: newProg,
      unlockedAchievements: newUnlocked,
      achievementQueue: newQueue,
    })
    get()._processFieldEffect(teamId, newPosition, teams, activeMines, jackpotFieldIndex)
  },

  confirmCollision: () => {
    const { lapBonusPending } = get()
    set({ collisionPending: null })
    if (!lapBonusPending) get()._advanceToNextTeam()
  },

  confirmLapBonus: () => {
    set({ lapBonusPending: null })
    get()._advanceToNextTeam()
  },

  _advanceToNextTeam: () => {
    const { walkingTeamOrder, walkingTeamIndex } = get()
    if (walkingTeamIndex + 1 >= walkingTeamOrder.length) {
      set({ phase: 'roundEnd' })
    } else {
      set({ walkingTeamIndex: walkingTeamIndex + 1 })
    }
  },

  _processFieldEffect: (teamId, position, teams, mines, jackpot) => {
    const { fields, currentRound, achievementProgress: prog, unlockedAchievements, achievementQueue } = get()
    const field = fields[position]
    if (!field) { get()._advanceToNextTeam(); return }

    const newProg = { ...prog }
    const newUnlocked = { ...unlockedAchievements }
    const newQueue = [...achievementQueue]

    if (field.type === 'bonus') {
      const gain = field.value ?? 50
      const updated = teams.map((t) => (t.id === teamId ? { ...t, crystals: t.crystals + gain } : t))
      newProg.bonusLandings[teamId] = (newProg.bonusLandings[teamId] ?? 0) + 1
      tryUnlock('glueckspilz', teamId, (newProg.bonusLandings[teamId] ?? 0) >= 3, newUnlocked, newQueue, updated, currentRound)
      checkCrystalAchievements(updated, newProg, newUnlocked, newQueue, currentRound)
      set({
        teams: updated,
        fieldEffectPending: { teamId, fieldType: 'bonus', crystalDelta: gain },
        achievementProgress: newProg,
        unlockedAchievements: newUnlocked,
        achievementQueue: newQueue,
      })
    } else if (field.type === 'trap') {
      const loss = field.value ?? 50
      const updated = teams.map((t) => (t.id === teamId ? { ...t, crystals: Math.max(0, t.crystals - loss) } : t))
      newProg.trapLandings[teamId] = (newProg.trapLandings[teamId] ?? 0) + 1
      tryUnlock('pechvogel', teamId, (newProg.trapLandings[teamId] ?? 0) >= 3, newUnlocked, newQueue, updated, currentRound)
      checkCrystalAchievements(updated, newProg, newUnlocked, newQueue, currentRound)
      set({
        teams: updated,
        fieldEffectPending: { teamId, fieldType: 'trap', crystalDelta: -loss },
        achievementProgress: newProg,
        unlockedAchievements: newUnlocked,
        achievementQueue: newQueue,
      })
    } else if (field.type === 'event') {
      set({ achievementProgress: newProg, unlockedAchievements: newUnlocked, achievementQueue: newQueue })
      get()._applyEvent(randomEvent(), teams, mines, jackpot)
    } else if (field.type === 'shop') {
      const currentTeam = teams.find((t) => t.id === teamId)
      const minPrice = 50  // Anker is cheapest
      if (!currentTeam || currentTeam.crystals < minPrice) {
        set({
          fieldEffectPending: { teamId, fieldType: 'shop', crystalDelta: 0, shopDenied: true },
          achievementProgress: newProg, unlockedAchievements: newUnlocked, achievementQueue: newQueue,
        })
      } else {
        set({ shopTeamId: teamId, achievementProgress: newProg, unlockedAchievements: newUnlocked, achievementQueue: newQueue })
      }
    } else if (field.type === 'item') {
      const item = randomItemFromField()
      const updated = teams.map((t) =>
        t.id === teamId && t.items.length < 3 ? { ...t, items: [...t.items, item] } : t,
      )
      set({
        teams: updated,
        fieldEffectPending: { teamId, fieldType: 'item', crystalDelta: 0, itemFound: item },
        achievementProgress: newProg,
        unlockedAchievements: newUnlocked,
        achievementQueue: newQueue,
      })
    } else {
      const { pendingCollisionForAfter, lapBonusPending } = get()
      set({ achievementProgress: newProg, unlockedAchievements: newUnlocked, achievementQueue: newQueue })
      if (pendingCollisionForAfter) {
        set({ collisionPending: pendingCollisionForAfter, pendingCollisionForAfter: null })
      } else if (lapBonusPending) {
        // WalkingScreen handles it
      } else {
        get()._advanceToNextTeam()
      }
    }
  },

  _applyEvent: (event, updatedTeams, updatedMines, updatedJackpot) => {
    const { fields } = get()
    let teams = [...updatedTeams]
    let jackpot = updatedJackpot

    switch (event.effect.type) {
      case 'crystal_rain':
        teams = teams.map((t) => ({ ...t, crystals: t.crystals + (event.effect as any).amount }))
        break
      case 'tax':
        teams = teams.map((t) => ({
          ...t,
          crystals: Math.max(0, Math.floor(t.crystals * (1 - (event.effect as any).percent / 100))),
        }))
        break
      case 'revolution': {
        const sorted = [...teams].sort((a, b) => b.crystals - a.crystals)
        if (sorted.length >= 2) {
          const rich = sorted[0], poor = sorted[sorted.length - 1]
          const tmp = rich.crystals
          teams = teams.map((t) => {
            if (t.id === rich.id) return { ...t, crystals: poor.crystals }
            if (t.id === poor.id) return { ...t, crystals: tmp }
            return t
          })
        }
        break
      }
      case 'earthquake': {
        const positions = teams.map((t) => t.position)
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[positions[i], positions[j]] = [positions[j], positions[i]]
        }
        teams = teams.map((t, i) => ({ ...t, position: positions[i] }))
        break
      }
      case 'dark_round':
        set({ nextRoundDark: true })
        break
      case 'jackpot_field': {
        const normals = fields.filter((f) => f.type === 'normal').map((f) => f.index)
        if (normals.length > 0) jackpot = normals[Math.floor(Math.random() * normals.length)]
        break
      }
      case 'bounty': {
        const leader = [...teams].sort((a, b) => b.crystals - a.crystals)[0]
        if (leader) set({ bountyTargetTeamId: leader.id })
        break
      }
    }

    set({ teams, activeMines: updatedMines, jackpotFieldIndex: jackpot, currentEvent: event })
  },

  confirmFieldEffect: () => {
    const { pendingCollisionForAfter, lapBonusPending } = get()
    set({ fieldEffectPending: null })
    if (pendingCollisionForAfter) {
      set({ collisionPending: pendingCollisionForAfter, pendingCollisionForAfter: null })
    } else if (lapBonusPending) {
      // WalkingScreen shows lapBonusPending
    } else {
      get()._advanceToNextTeam()
    }
  },

  confirmEvent: () => {
    const { pendingCollisionForAfter, lapBonusPending } = get()
    set({ currentEvent: null, fieldEffectPending: null })
    if (pendingCollisionForAfter) {
      set({ collisionPending: pendingCollisionForAfter, pendingCollisionForAfter: null })
    } else if (lapBonusPending) {
      // WalkingScreen shows lapBonusPending
    } else {
      get()._advanceToNextTeam()
    }
  },

  buyItem: (itemType, overrideTeamId?) => {
    const { shopTeamId, teams, currentRound, achievementProgress: prog, unlockedAchievements, achievementQueue } = get()
    const tid = overrideTeamId ?? shopTeamId
    if (!tid) return
    const def = ITEM_DEFS[itemType]
    const team = teams.find((t) => t.id === tid)
    if (!team || team.items.length >= 3 || team.crystals < def.price) return
    const item = makeItem(itemType)
    const updated = teams.map((t) =>
      t.id === tid ? { ...t, crystals: Math.max(0, t.crystals - def.price), items: [...t.items, item] } : t,
    )
    const newProg = { ...prog }
    const newUnlocked = { ...unlockedAchievements }
    const newQueue = [...achievementQueue]
    set({ teams: updated, achievementProgress: newProg, unlockedAchievements: newUnlocked, achievementQueue: newQueue })
  },

  closeStreakShop: () => set({ streakShopTeamId: null, phase: 'crystalAward' }),

  closeShop: () => {
    const { pendingCollisionForAfter, lapBonusPending } = get()
    set({ shopTeamId: null, fieldEffectPending: null })
    if (pendingCollisionForAfter) {
      set({ collisionPending: pendingCollisionForAfter, pendingCollisionForAfter: null })
    } else if (lapBonusPending) {
      // WalkingScreen handles it
    } else {
      get()._advanceToNextTeam()
    }
  },

  nextRound: () => {
    const { currentRound, totalRounds } = get()
    if (currentRound >= totalRounds) {
      set({ phase: 'gameOver' })
    } else {
      const next = currentRound + 1
      if (next === totalRounds) {
        // Last round — show finale announcement first
        set({ currentRound: next, phase: 'finaleAnnounce', crystalAwards: {}, finaleActive: true })
      } else {
        set({ currentRound: next, phase: 'minigameAnnounce', crystalAwards: {} })
      }
    }
  },

  newGame: () => {
    teamIdCounter = 0
    set({
      ...initialState,
      achievementProgress: initialAchievementProgress(),
      unlockedAchievements: {},
      achievementQueue: [],
    })
  },

  goBackToPreviousDecision: () => {
    const { phase, preRoundSnapshot } = get()
    switch (phase) {
      case 'setup':         set({ phase: 'title' }); break
      case 'teamSetup':     set({ phase: 'setup' }); break
      case 'mapSetup':      set({ phase: 'teamSetup', currentTeamSetupIndex: get().numTeams - 1 }); break
      case 'minigameActive':set({ phase: 'minigameAnnounce' }); break
      case 'placementInput':set({ phase: 'minigameAnnounce' }); break
      case 'crystalAward':  set({ phase: 'placementInput', crystalAwards: {} }); break
      case 'itemPhase':
      case 'rolling':
        if (preRoundSnapshot) {
          set({
            teams: preRoundSnapshot.map((t) => ({ ...t, placement: null })),
            crystalAwards: {},
            diceResults: {},
            preRoundSnapshot: null,
            phase: 'placementInput',
          })
        } else {
          set({ phase: 'placementInput', crystalAwards: {} })
        }
        break
    }
  },

  dismissAchievement: () => {
    const queue = get().achievementQueue.slice(1)
    set({ achievementQueue: queue })
  },

  setShowMapOverlay: (show) => set({ showMapOverlay: show }),
  setShowInfoOverlay: (show) => set({ showInfoOverlay: show }),
} as GameStore))
