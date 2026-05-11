import type { EventData } from '../types'

export const EVENTS: EventData[] = [
  {
    id: 'crystal_rain',
    name: 'Kristallregen!',
    description: 'Ein goldener Schauer trifft alle Teams! Jedes Team erhält +100 Kristalle.',
    icon: '💎',
    color: '#f59e0b',
    effect: { type: 'crystal_rain', amount: 100 },
  },
  {
    id: 'tax',
    name: 'STEUER!',
    description: 'Die Arena-Steuer schlägt zu! Alle Teams verlieren 25% ihrer Kristalle.',
    icon: '📜',
    color: '#ef4444',
    effect: { type: 'tax', percent: 25 },
  },
  {
    id: 'revolution',
    name: 'Revolution!',
    description: 'Das reichste und ärmste Team tauschen ihren Kristallstand!',
    icon: '⚔️',
    color: '#8b5cf6',
    effect: { type: 'revolution' },
  },
  {
    id: 'earthquake',
    name: 'ERDBEBEN!',
    description: 'Die Arena bebt! Alle Teams werden zufällig auf dem Board neu platziert!',
    icon: '🌋',
    color: '#f97316',
    effect: { type: 'earthquake' },
  },
  {
    id: 'dark_round',
    name: 'Dunkle Runde',
    description: 'Nächste Runde: Sieger würfelt 2× (Schritte addiert), Letzter bekommt 0 Kristalle!',
    icon: '🌑',
    color: '#6d28d9',
    effect: { type: 'dark_round' },
  },
  {
    id: 'jackpot_field',
    name: 'Jackpot-Feld!',
    description: 'Ein zufälliges Feld wird zum goldenen Jackpot! Erstes Team drauf: +300 Kristalle!',
    icon: '🎰',
    color: '#f59e0b',
    effect: { type: 'jackpot_field' },
  },
  {
    id: 'bounty',
    name: 'Kopfgeld!',
    description: 'Das führende Team hat ein Kopfgeld! Wer es im nächsten Minispiel schlägt: +150 Bonus!',
    icon: '🏴‍☠️',
    color: '#ef4444',
    effect: { type: 'bounty' },
  },
]

export function randomEvent(): EventData {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)]
}
