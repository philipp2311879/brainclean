export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  perTeam: boolean  // true = each team can unlock independently
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'pechvogel',      name: 'Pechvogel',      description: '3× auf einem Fallenfeld gelandet',                  icon: '🤦', perTeam: true },
  { id: 'glueckspilz',   name: 'Glückspilz',      description: '3× auf einem Bonusfeld gelandet',                   icon: '🍀', perTeam: true },
  { id: 'shoppingtour',  name: 'Shoppingtour',     description: '3 Items in einem Spiel gekauft',                    icon: '🛒', perTeam: true },
  { id: 'unaufhaltbar',  name: 'Unaufhaltbar',     description: '3× hintereinander 1. Platz!',                       icon: '🔥', perTeam: true },
  { id: 'comeback_kid',  name: 'Comeback Kid',     description: 'Vom letzten Platz zum ersten Platz aufgestiegen',   icon: '🚀', perTeam: true },
  { id: 'bankraeuber',   name: 'Bankräuber',       description: '200+ Kristalle in einem Spiel gestohlen',           icon: '🦹', perTeam: true },
  { id: 'pleitegeier',   name: 'Pleitegeier',      description: '0 Kristalle erreicht',                              icon: '💸', perTeam: true },
  { id: 'kristallkoenig',name: 'Kristallkönig',    description: 'Als erstes Team 500 Kristalle erreicht',            icon: '👑', perTeam: false },
  { id: 'minenopfer',    name: 'Minenopfer',       description: 'Auf eine Mine getreten',                            icon: '💥', perTeam: true },
  { id: 'schildkroete',  name: 'Schildkröte',      description: '2× Angriff mit Schild geblockt',                    icon: '🐢', perTeam: true },
  { id: 'erster',        name: 'Erster!',           description: 'Als erstes Team eine komplette Runde absolviert',  icon: '🏁', perTeam: false },
  { id: 'rivalen',       name: 'Rivalen',           description: '3× mit demselben Team zusammengestoßen',           icon: '⚔️', perTeam: true },
  { id: 'sammler',       name: 'Sammler',           description: 'Gleichzeitig 3 Items im Inventar',                 icon: '🎒', perTeam: true },
  { id: 'dominator',     name: 'Dominator',         description: '4× Platz 1 in einem Spiel erreicht',              icon: '🏆', perTeam: true },
]

export interface AchievementProgress {
  trapLandings:    Record<string, number>                      // teamId → count
  bonusLandings:   Record<string, number>
  shopPurchases:   Record<string, number>
  firstPlaceCount: Record<string, number>
  crystalsStolen:  Record<string, number>                      // via items + collisions
  collisionsVs:    Record<string, Record<string, number>>      // attackerId → victimId → count
  shieldBlocks:    Record<string, number>
  mineHits:        Record<string, number>
  wasLastPlace:    Record<string, boolean>                     // was ever ranked last by crystals
  firstLapDone:    boolean                                     // someone completed a lap
  firstLapTeamId:  string | null
  crystal500Done:  boolean                                     // someone hit 500 (for global unlock)
}

export function initialAchievementProgress(): AchievementProgress {
  return {
    trapLandings:    {},
    bonusLandings:   {},
    shopPurchases:   {},
    firstPlaceCount: {},
    crystalsStolen:  {},
    collisionsVs:    {},
    shieldBlocks:    {},
    mineHits:        {},
    wasLastPlace:    {},
    firstLapDone:    false,
    firstLapTeamId:  null,
    crystal500Done:  false,
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
