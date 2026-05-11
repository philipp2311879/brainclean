import { create } from 'zustand'
import type {
  GameState, Team, Field, Mine, EventData, Item,
  FieldEffectPending, CollisionPending,
} from '../types'
import { AVATARS, TEAM_COLORS } from '../data/avatars'
import { generateMap, FIELD_TOTAL } from '../utils/mapGenerator'
import { randomEvent } from '../data/events'
import { randomItemFromField, makeItem, ITEM_DEFS } from '../data/items'

let teamIdCounter = 0

function makeDefaultTeam(index: number): Team {
  return {
    id: `team-${++teamIdCounter}`,
    name: `Team ${index + 1}`,
    avatar: AVATARS[index],
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
  teamSwapPending: null,
  doubleOrNothingPending: null,
  currentTeamSetupIndex: 0,
  diceResults: {},
  crystalAwards: {},
  walkingTeamOrder: [],
  walkingTeamIndex: 0,
  currentEvent: null,
  shopTeamId: null,
  fieldEffectPending: null,
  collisionPending: null,
  minefieldSelectTeamId: null,
  showMapOverlay: false,
  showInfoOverlay: false,
  preRoundSnapshot: null,
  lapBonusPending: null,
  pendingCollisionForAfter: null,
  streakShopTeamId: null,
}

interface GameStore extends GameState {
  goToSetup: () => void
  setTotalRounds: (n: number) => void
  setNumTeams: (n: number) => void
  startTeamSetup: () => void
  updateTeamName: (name: string) => void
  updateTeamAvatar: (avatarId: string) => void
  confirmTeam: () => void
  startGame: () => void
  startGameFromMapSetup: (fields: import('../types').Field[]) => void
  startMinigame: () => void
  endMinigame: () => void
  setPlacement: (teamId: string, placement: number) => void
  confirmPlacements: () => void
  finishCrystalAward: () => void
  useItem: (teamId: string, itemId: string, targetTeamId?: string, fieldIndex?: number, amount?: number) => void
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
    const color = TEAM_COLORS[currentTeamSetupIndex] || avatar.color
    const updated = [...teams]
    updated[currentTeamSetupIndex] = { ...updated[currentTeamSetupIndex], avatar: { ...avatar, color } }
    set({ teams: updated })
  },

  confirmTeam: () => {
    const { currentTeamSetupIndex, numTeams } = get()
    if (currentTeamSetupIndex + 1 >= numTeams) {
      // Last team done → go to map setup screen
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
      // consecutiveFirstPlace is preserved — reset in confirmPlacements
    }))
    set({ teams: reset, phase: 'placementInput' })
  },

  setPlacement: (teamId, placement) => {
    const updated = get().teams.map((t) => (t.id === teamId ? { ...t, placement } : t))
    set({ teams: updated })
  },

  confirmPlacements: () => {
    const { teams, darkRoundActive, nextRoundDark, bountyTargetTeamId, teamSwapPending, doubleOrNothingPending } = get()

    // Save snapshot BEFORE applying any awards (for full undo)
    const preRoundSnapshot = teams.map((t) => ({ ...t }))

    const baseRanges: [number, number][] = [[100, 150], [75, 99], [40, 74], [10, 39]]
    let teamsWithPlacements = [...teams]

    if (teamSwapPending) {
      const { fromTeamId, targetTeamId } = teamSwapPending
      const a = teamsWithPlacements.find((t) => t.id === fromTeamId)
      const b = teamsWithPlacements.find((t) => t.id === targetTeamId)
      if (a && b && a.placement !== null && b.placement !== null) {
        const tmp = a.placement
        teamsWithPlacements = teamsWithPlacements.map((t) => {
          if (t.id === fromTeamId) return { ...t, placement: b.placement }
          if (t.id === targetTeamId) return { ...t, placement: tmp }
          return t
        })
      }
    }

    const awards: Record<string, number> = {}
    for (const team of teamsWithPlacements) {
      const p = (team.placement ?? teams.length) - 1
      const [min, max] = baseRanges[Math.min(p, baseRanges.length - 1)]
      let amount = Math.floor(Math.random() * (max - min + 1)) + min

      if (darkRoundActive && team.placement === 1) amount = 0

      if (bountyTargetTeamId) {
        const target = teamsWithPlacements.find((t) => t.id === bountyTargetTeamId)
        if (target && target.placement !== null && team.placement !== null &&
          team.id !== bountyTargetTeamId && team.placement < target.placement) {
          amount += 150
        }
      }

      if (doubleOrNothingPending?.teamId === team.id) {
        if (team.placement === 1) amount += doubleOrNothingPending.amount * 3
      }

      awards[team.id] = amount
    }

    // ── Streak tracking ─────────────────────────────────────────────────────
    let streakShopTeamId: string | null = null
    const teamsWithStreak = teamsWithPlacements.map((t) => {
      if (t.placement === 1) {
        const newStreak = t.consecutiveFirstPlace + 1
        if (newStreak >= 2) {
          streakShopTeamId = t.id
          // Mega-streak bonus crystals (3rd+ consecutive win)
          if (newStreak >= 3) awards[t.id] = (awards[t.id] ?? 0) + 50
        }
        return { ...t, consecutiveFirstPlace: newStreak }
      }
      return { ...t, consecutiveFirstPlace: 0 }
    })

    set({
      crystalAwards: awards,
      teams: teamsWithStreak,
      darkRoundActive: nextRoundDark,
      nextRoundDark: false,
      bountyTargetTeamId: null,
      teamSwapPending: null,
      doubleOrNothingPending: null,
      preRoundSnapshot,
      streakShopTeamId,
      phase: streakShopTeamId ? 'streakShop' : 'crystalAward',
    })
  },

  finishCrystalAward: () => {
    const { teams, crystalAwards } = get()
    const updated = teams.map((t) => ({
      ...t,
      crystals: Math.max(0, t.crystals + (crystalAwards[t.id] ?? 0)),
    }))
    const hasItems = updated.some((t) => t.items.length > 0)
    set({ teams: updated, phase: hasItems ? 'itemPhase' : 'rolling' })
  },

  useItem: (teamId, itemId, targetTeamId, fieldIndex, amount) => {
    let { teams, activeMines } = get()
    const team = teams.find((t) => t.id === teamId)
    const item = team?.items.find((i) => i.id === itemId)
    if (!team || !item) return

    teams = teams.map((t) =>
      t.id === teamId ? { ...t, items: t.items.filter((i) => i.id !== itemId), usedItemThisRound: true } : t,
    )

    switch (item.type) {
      case 'crystal_steal': {
        const target = teams.find((t) => t.id === targetTeamId)
        if (target) {
          if (target.hasShield) {
            teams = teams.map((t) => (t.id === targetTeamId ? { ...t, hasShield: false } : t))
          } else {
            const stolen = Math.min(80, target.crystals)
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
      case 'minefield':
        if (fieldIndex !== undefined) {
          activeMines = [...activeMines, { fieldIndex, placedByTeamId: teamId }]
        }
        break
      case 'turbo':
        teams = teams.map((t) => (t.id === teamId ? { ...t, turboThisRound: true } : t))
        break
      case 'team_steal':
        set({ teamSwapPending: { fromTeamId: teamId, targetTeamId: targetTeamId! } })
        break
      case 'double_or_nothing':
        if (amount) {
          teams = teams.map((t) =>
            t.id === teamId ? { ...t, crystals: Math.max(0, t.crystals - amount) } : t,
          )
          set({ doubleOrNothingPending: { teamId, amount } })
        }
        break
    }

    set({ teams, activeMines })
  },

  skipItemPhase: () => set({ phase: 'rolling' }),

  rollDice: () => {
    const { teams, darkRoundActive } = get()
    const results: Record<string, number> = {}
    for (const team of teams) {
      if (team.anchoredThisRound) {
        results[team.id] = 0
      } else if (team.turboThisRound) {
        results[team.id] = 6
      } else {
        let roll = Math.floor(Math.random() * 6) + 1
        if (darkRoundActive && team.placement === 1) roll += Math.floor(Math.random() * 6) + 1
        if (team.doubleStepThisRound) roll *= 2
        results[team.id] = roll
      }
    }
    set({ diceResults: results })
  },

  finishRolling: () => {
    const { teams } = get()
    const sorted = [...teams]
      .filter((t) => t.placement !== null)
      .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99))
    const order = sorted.map((t) => t.id)
    for (const t of teams) if (!order.includes(t.id)) order.push(t.id)
    set({ walkingTeamOrder: order, walkingTeamIndex: 0, phase: 'walking' })
  },

  advanceWalkingTeam: (newPosition, passedStart) => {
    let { teams, activeMines, jackpotFieldIndex } = get()
    const { walkingTeamOrder, walkingTeamIndex } = get()
    const teamId = walkingTeamOrder[walkingTeamIndex]
    const team = teams.find((t) => t.id === teamId)
    if (!team) return

    // 1. Update position
    teams = teams.map((t) => (t.id === teamId ? { ...t, position: newPosition } : t))

    // 2. Lap bonus — apply crystals now, store notification for later
    const lapBonus = passedStart ? 100 : 0
    if (lapBonus) {
      teams = teams.map((t) => (t.id === teamId ? { ...t, crystals: t.crystals + lapBonus } : t))
    }

    // 3. Mine check — apply damage, show field trap effect, queue rest
    const mine = activeMines.find((m) => m.fieldIndex === newPosition && m.placedByTeamId !== teamId)
    if (mine) {
      activeMines = activeMines.filter((m) => m !== mine)
      if (teams.find((t) => t.id === teamId)!.hasShield) {
        teams = teams.map((t) => (t.id === teamId ? { ...t, hasShield: false } : t))
        set({ teams, activeMines, lapBonusPending: lapBonus ? { teamId, amount: lapBonus } : null, pendingCollisionForAfter: null })
        get()._processFieldEffect(teamId, newPosition, teams, activeMines, jackpotFieldIndex)
      } else {
        teams = teams.map((t) =>
          t.id === teamId ? { ...t, crystals: Math.max(0, t.crystals - 120) } : t,
        )
        set({
          teams, activeMines,
          lapBonusPending: lapBonus ? { teamId, amount: lapBonus } : null,
          pendingCollisionForAfter: null,
          fieldEffectPending: { teamId, fieldType: 'trap', crystalDelta: -120 },
        })
      }
      return
    }

    // 4. Jackpot check
    if (jackpotFieldIndex === newPosition) {
      teams = teams.map((t) => (t.id === teamId ? { ...t, crystals: t.crystals + 300 } : t))
      jackpotFieldIndex = null
    }

    // 5. Build collision (to be shown AFTER field effect)
    let pendingCollision: typeof initialState['pendingCollisionForAfter'] = null
    const others = teams.filter((t) => t.id !== teamId && t.position === newPosition)
    if (others.length > 0) {
      const defender = others[0]
      if (defender.hasShield) {
        teams = teams.map((t) => (t.id === defender.id ? { ...t, hasShield: false } : t))
        pendingCollision = { attackerTeamId: teamId, defenderTeamId: defender.id, crystalsStolen: 0, blocked: true }
      } else {
        const stolen = Math.min(Math.floor(Math.random() * 26) + 25, defender.crystals)
        teams = teams.map((t) => {
          if (t.id === teamId)      return { ...t, crystals: t.crystals + stolen }
          if (t.id === defender.id) return { ...t, crystals: Math.max(0, t.crystals - stolen) }
          return t
        })
        pendingCollision = { attackerTeamId: teamId, defenderTeamId: defender.id, crystalsStolen: stolen, blocked: false }
      }
    }

    set({
      teams, activeMines, jackpotFieldIndex,
      pendingCollisionForAfter: pendingCollision,
      lapBonusPending: lapBonus ? { teamId, amount: lapBonus } : null,
    })
    get()._processFieldEffect(teamId, newPosition, teams, activeMines, jackpotFieldIndex)
  },

  // Sequential: field → collision → lap bonus → next team
  confirmCollision: () => {
    const { lapBonusPending } = get()
    set({ collisionPending: null })
    if (lapBonusPending) {
      // lapBonusPending already set — WalkingScreen will show it
    } else {
      get()._advanceToNextTeam()
    }
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
    const { fields } = get()
    const field = fields[position]
    if (!field) { get()._advanceToNextTeam(); return }

    if (field.type === 'bonus') {
      const gain = field.value ?? 50
      set({
        teams: teams.map((t) => (t.id === teamId ? { ...t, crystals: t.crystals + gain } : t)),
        fieldEffectPending: { teamId, fieldType: 'bonus', crystalDelta: gain },
      })
    } else if (field.type === 'trap') {
      const loss = field.value ?? 50
      set({
        teams: teams.map((t) => (t.id === teamId ? { ...t, crystals: Math.max(0, t.crystals - loss) } : t)),
        fieldEffectPending: { teamId, fieldType: 'trap', crystalDelta: -loss },
      })
    } else if (field.type === 'event') {
      get()._applyEvent(randomEvent(), teams, mines, jackpot)
    } else if (field.type === 'shop') {
      set({ shopTeamId: teamId })
    } else {
      // normal or start — no popup needed, go straight to collision/lap/next
      const { pendingCollisionForAfter, lapBonusPending } = get()
      if (pendingCollisionForAfter) {
        set({ collisionPending: pendingCollisionForAfter, pendingCollisionForAfter: null })
      } else if (lapBonusPending) {
        // lapBonusPending stays — WalkingScreen shows it
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
      // WalkingScreen will now show lapBonusPending popup
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
    const { shopTeamId, teams } = get()
    const tid = overrideTeamId ?? shopTeamId
    if (!tid) return
    const def = ITEM_DEFS[itemType]
    const team = teams.find((t) => t.id === tid)
    if (!team || team.items.length >= 3 || team.crystals < def.price) return
    const item = makeItem(itemType)
    const updated = teams.map((t) =>
      t.id === tid ? { ...t, crystals: Math.max(0, t.crystals - def.price), items: [...t.items, item] } : t,
    )
    set({ teams: updated })
  },

  closeStreakShop: () => set({ streakShopTeamId: null, phase: 'crystalAward' }),

  closeShop: () => {
    const { pendingCollisionForAfter, lapBonusPending } = get()
    set({ shopTeamId: null, fieldEffectPending: null })
    if (pendingCollisionForAfter) {
      set({ collisionPending: pendingCollisionForAfter, pendingCollisionForAfter: null })
    } else if (lapBonusPending) {
      // WalkingScreen shows lapBonusPending
    } else {
      get()._advanceToNextTeam()
    }
  },

  nextRound: () => {
    const { currentRound, totalRounds } = get()
    if (currentRound >= totalRounds) {
      set({ phase: 'gameOver' })
    } else {
      set({ currentRound: currentRound + 1, phase: 'minigameAnnounce', crystalAwards: {} })
    }
  },

  newGame: () => {
    teamIdCounter = 0
    set({ ...initialState })
  },

  goBackToPreviousDecision: () => {
    const { phase, preRoundSnapshot } = get()
    switch (phase) {
      case 'setup':
        set({ phase: 'title' })
        break
      case 'teamSetup':
        set({ phase: 'setup' })
        break
      case 'mapSetup':
        // Back to last team's setup
        set({ phase: 'teamSetup', currentTeamSetupIndex: get().numTeams - 1 })
        break
      case 'minigameActive':
        set({ phase: 'minigameAnnounce' })
        break
      case 'placementInput':
        set({ phase: 'minigameAnnounce' })
        break
      case 'crystalAward':
        // Crystals not applied yet — just go back
        set({ phase: 'placementInput', crystalAwards: {} })
        break
      case 'itemPhase':
      case 'rolling':
        // Crystals already applied — restore full snapshot
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

  setShowMapOverlay: (show) => set({ showMapOverlay: show }),
  setShowInfoOverlay: (show) => set({ showInfoOverlay: show }),
} as GameStore))
