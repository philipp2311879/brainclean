import type { ItemDef, ItemType } from '../types'

export const ITEM_DEFS: Record<ItemType, ItemDef> = {
  crystal_steal: {
    type: 'crystal_steal',
    name: 'Kristallraub',
    description: 'Stehle 100 Kristalle von einem Team deiner Wahl',
    icon: '💎🗡️',
    price: 100,
    needsTarget: true,
    needsField: false,
    needsAmount: false,
  },
  shield: {
    type: 'shield',
    name: 'Schild',
    description: 'Blockt den nächsten Angriff automatisch (Raub, Mine, Zusammenstoß)',
    icon: '🛡️',
    price: 80,
    needsTarget: false,
    needsField: false,
    needsAmount: false,
  },
  anchor: {
    type: 'anchor',
    name: 'Anker',
    description: 'Zielteam darf diese Runde NICHT laufen (Würfelergebnis = 0)',
    icon: '⚓',
    price: 50,
    needsTarget: true,
    needsField: false,
    needsAmount: false,
  },
  double_step: {
    type: 'double_step',
    name: 'Doppelschritt',
    description: 'Dein Würfelergebnis wird verdoppelt',
    icon: '👟',
    price: 75,
    needsTarget: false,
    needsField: false,
    needsAmount: false,
  },
  position_swap: {
    type: 'position_swap',
    name: 'Platztausch',
    description: 'Tausche deine Kartenposition mit einem anderen Team',
    icon: '🔄',
    price: 100,
    needsTarget: true,
    needsField: false,
    needsAmount: false,
  },
  minefield: {
    type: 'minefield',
    name: 'Minenfeld',
    description: 'Platziere eine unsichtbare Mine auf einem zufälligen Feld (-100 Kristalle)',
    icon: '💣',
    price: 100,
    needsTarget: false,
    needsField: false,
    needsAmount: false,
  },
  turbo: {
    type: 'turbo',
    name: 'Turbo',
    description: 'Dein Würfel zeigt garantiert 6',
    icon: '🚀',
    price: 250,
    needsTarget: false,
    needsField: false,
    needsAmount: false,
  },
  team_steal: {
    type: 'team_steal',
    name: 'Teamklau',
    description: 'Tausche Platzierungen mit Zielteam beim nächsten Minispiel',
    icon: '🦹',
    price: 150,
    needsTarget: true,
    needsField: false,
    needsAmount: false,
  },
  double_or_nothing: {
    type: 'double_or_nothing',
    name: 'Doppel-oder-Nichts',
    description: '1. Platz = Einsatz ×3 zurück. Sonst: Einsatz weg',
    icon: '🎰',
    price: 0,
    needsTarget: false,
    needsField: false,
    needsAmount: true,
  },
}

export const SHOP_ITEMS: ItemType[] = [
  'crystal_steal',
  'shield',
  'anchor',
  'double_step',
  'position_swap',
  'minefield',
  'turbo',
  'team_steal',
]

let itemCounter = 0
export function makeItem(type: ItemType): import('../types').Item {
  const def = ITEM_DEFS[type]
  return {
    id: `item-${++itemCounter}`,
    type,
    name: def.name,
    icon: def.icon,
  }
}

export function randomItemFromField(): import('../types').Item {
  const types: ItemType[] = ['crystal_steal', 'shield', 'anchor', 'double_step', 'turbo']
  const t = types[Math.floor(Math.random() * types.length)]
  return makeItem(t)
}
