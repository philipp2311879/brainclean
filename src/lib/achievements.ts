export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  perTeam: boolean  // true = each team can unlock independently
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'pechvogel',   name: 'Pechvogel',   description: '3× auf einem Fallenfeld gelandet',  icon: '🤦', perTeam: true },
  { id: 'glueckspilz', name: 'Glückspilz',  description: '3× auf einem Bonusfeld gelandet',   icon: '🍀', perTeam: true },
  { id: 'unaufhaltbar', name: 'Unaufhaltbar', description: '3× hintereinander 1. Platz!',       icon: '🔥', perTeam: true },
  { id: 'pleitegeier',  name: 'Pleitegeier', description: '0 Kristalle erreicht',              icon: '💸', perTeam: true },
  { id: 'minenopfer',   name: 'Minenopfer',  description: 'Auf eine Mine getreten',            icon: '💥', perTeam: true },
  { id: 'dominator',    name: 'Dominator',   description: '4× Platz 1 in einem Spiel erreicht', icon: '🏆', perTeam: true },
]

export interface AchievementProgress {
  trapLandings:    Record<string, number>
  bonusLandings:   Record<string, number>
  firstPlaceCount: Record<string, number>
  mineHits:        Record<string, number>
}

export function initialAchievementProgress(): AchievementProgress {
  return {
    trapLandings:    {},
    bonusLandings:   {},
    firstPlaceCount: {},
    mineHits:        {},
  }
}

export interface AchievementQueueItem {
  achievementId: string
  teamId: string
  teamName: string
  teamEmoji: string
}

// Returns unlock key for the unlocked-map
export function unlockKey(achievementId: string, teamId: string, perTeam: boolean): string {
  return perTeam ? `${achievementId}_${teamId}` : achievementId
}
