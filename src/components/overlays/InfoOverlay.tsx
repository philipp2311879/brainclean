import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EVENTS } from '../../data/events'
import { SHOP_ITEMS, ITEM_DEFS } from '../../data/items'

interface InfoOverlayProps {
  onClose: () => void
}

type Tab = 'felder' | 'events' | 'items'

const FIELD_INFO = [
  { icon: '🏁', label: 'Start-Feld', color: '#d97706', bg: '#fef9c3', desc: 'Einmal komplett rum = +150 Bonus-Kristalle!' },
  { icon: '·',  label: 'Normales Feld', color: '#94a3b8', bg: '#f1f5f9', desc: 'Hier passiert nichts. Einfach weiter.' },
  { icon: '💎', label: 'Bonus-Feld', color: '#3b82f6', bg: '#dbeafe', desc: 'Dein Team erhält 30–80 Kristalle!' },
  { icon: '💀', label: 'Fallen-Feld', color: '#ef4444', bg: '#fee2e2', desc: 'Dein Team verliert 30–80 Kristalle.' },
  { icon: '⚡', label: 'Event-Feld', color: '#8b5cf6', bg: '#ede9fe', desc: 'Ein zufälliges Event wird ausgelöst – kann alles verändern!' },
  { icon: '🏪', label: 'Shop-Feld', color: '#f97316', bg: '#ffedd5', desc: 'Kaufe Items für Kristalle.' },
]

export function InfoOverlay({ onClose }: InfoOverlayProps) {
  const [tab, setTab] = useState<Tab>('felder')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', damping: 22 }}
        className="card w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] flex-shrink-0">
          <h2 className="font-display text-2xl text-[#0f172a]">ℹ️ SPIELINFO</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] flex items-center justify-center text-[#475569] text-lg cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb] flex-shrink-0">
          {(['felder', 'events', 'items'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 font-display text-base transition-all cursor-pointer capitalize"
              style={
                tab === t
                  ? { color: '#4f8cff', borderBottom: '3px solid #4f8cff', background: '#eff6ff' }
                  : { color: '#94a3b8', borderBottom: '3px solid transparent' }
              }
            >
              {t === 'felder' ? '🗺️ Felder' : t === 'events' ? '⚡ Events' : '🎒 Items'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'felder' && (
                <div className="flex flex-col gap-3">
                  {FIELD_INFO.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-center gap-4 p-4 rounded-2xl border-2"
                      style={{ background: f.bg, borderColor: f.color }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border-2"
                        style={{ background: f.bg, borderColor: f.color }}
                      >
                        {f.icon}
                      </div>
                      <div>
                        <div className="font-display text-base" style={{ color: f.color }}>{f.label}</div>
                        <div className="font-body text-[#0f172a] text-base mt-0.5">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'events' && (
                <div className="flex flex-col gap-3">
                  {EVENTS.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-4 p-4 rounded-2xl border-2"
                      style={{ borderColor: ev.color, background: ev.color + '12' }}
                    >
                      <div className="text-3xl flex-shrink-0 mt-0.5">{ev.icon}</div>
                      <div>
                        <div className="font-display text-base" style={{ color: ev.color }}>{ev.name}</div>
                        <div className="font-body text-[#0f172a] text-base mt-0.5">{ev.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'items' && (
                <div className="flex flex-col gap-3">
                  {SHOP_ITEMS.map((type) => {
                    const def = ITEM_DEFS[type]
                    return (
                      <div
                        key={type}
                        className="flex items-start gap-4 p-4 rounded-2xl border-2 border-[#e5e7eb] bg-white"
                      >
                        <div className="text-3xl flex-shrink-0 mt-0.5">{def.icon}</div>
                        <div className="flex-1">
                          <div className="font-display text-base text-[#0f172a]">{def.name}</div>
                          <div className="font-body text-[#475569] text-base mt-0.5">{def.description}</div>
                        </div>
                        <div className="font-display text-[#f59e0b] text-base whitespace-nowrap flex-shrink-0">
                          {def.price} 💎
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
