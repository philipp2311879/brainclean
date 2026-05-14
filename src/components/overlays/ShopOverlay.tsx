import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { SHOP_ITEMS, ITEM_DEFS } from '../../data/items'
import type { ItemType } from '../../types'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { soundManager } from '../../lib/soundManager'

interface ShopOverlayProps { teamId: string; onClose: () => void }

export function ShopOverlay({ teamId, onClose }: ShopOverlayProps) {
  const { teams, buyItem } = useGameStore()
  const team = teams.find((t) => t.id === teamId)

  useEffect(() => {
    soundManager.playSFX('shop_open')
  }, [])

  if (!team) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.85, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
        className="card p-6 w-full max-w-2xl"
        style={{ borderColor: '#f97316', borderWidth: 2 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <AvatarRingWrapper avatar={team.avatar} jerseyColor={team.jerseyColor} outerSize={56} style={{ flexShrink: 0 }} />
          <div>
            <h2 className="font-display text-3xl text-[#0f172a]">ARENA-SHOP</h2>
            <p className="text-[#475569] font-body text-base">
              {team.name} · <strong className="text-[#0f172a]">{team.crystals}</strong> 💎
              {team.items.length >= 3 && <span className="text-[#ef4444] ml-2 font-bold">Inventar voll!</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {SHOP_ITEMS.map((type) => {
            const def = ITEM_DEFS[type]
            const canBuy = team.crystals >= def.price && team.items.length < 3
            return (
              <motion.div
                key={type}
                whileTap={canBuy ? { scale: 0.97 } : {}}
                className="p-4 rounded-2xl border-2 transition-all cursor-pointer"
                style={
                  canBuy
                    ? { background: '#ffffff', borderColor: '#d1d5db', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
                    : { background: '#f8fafc', borderColor: '#e5e7eb', opacity: 0.4, cursor: 'not-allowed' }
                }
                onClick={() => { if (canBuy) { soundManager.playSFX('shop_buy'); buyItem(type as ItemType, teamId) } }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">{def.icon}</span>
                  <div className="flex-1">
                    <div className="font-display text-[#0f172a] text-base">{def.name}</div>
                    <div className="text-[#475569] text-sm font-body leading-snug mt-0.5">{def.description}</div>
                  </div>
                  <div className="font-display text-[#f59e0b] text-base whitespace-nowrap flex-shrink-0">{def.price} 💎</div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {team.items.length > 0 && (
          <div className="mb-4 p-3 bg-[#f8fafc] rounded-xl border border-[#e5e7eb]">
            <div className="text-[#475569] text-sm font-body mb-1.5 font-semibold">Inventar ({team.items.length}/3):</div>
            <div className="flex gap-2">{team.items.map((i) => <span key={i.id} className="text-2xl" title={i.name}>{i.icon}</span>)}</div>
          </div>
        )}

        <Button fullWidth variant="secondary" onClick={onClose}>Shop verlassen</Button>
      </motion.div>
    </motion.div>
  )
}
