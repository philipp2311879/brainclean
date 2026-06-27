import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { POSITIONS, FIELD_TOTAL } from '../../utils/mapGenerator'
import { Button } from '../ui/Button'
import { AvatarRingWrapper } from '../ui/AvatarDisplay'
import { resolveTeamColor } from '../../data/avatars'
import type { Field } from '../../types'

type FredPhase = 'spawn' | 'board' | 'attacking' | 'leaving'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const FIELD_COLORS: Record<string, string> = {
  start:  '#f59e0b',
  bonus:  '#10b981',
  trap:   '#f43f5e',
  event:  '#8b5cf6',
  shop:   '#f97316',
  item:   '#3b82f6',
  normal: '#1e293b',
}

function FieldDot({ field, lit }: { field: Field; lit: boolean }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all"
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: lit ? 16 : 10,
        height: lit ? 16 : 10,
        background: lit ? '#ef4444' : (FIELD_COLORS[field.type] ?? '#1e293b'),
        boxShadow: lit ? '0 0 12px #ef4444aa' : 'none',
        transitionDuration: '80ms',
      }}
    />
  )
}

function FredIcon({ size }: { size: number }) {
  const [err, setErr] = useState(false)
  if (err) return <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>🔥</span>
  return (
    <img
      src="/avatars/fred.png"
      alt="Fred"
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={() => setErr(true)}
    />
  )
}

export function FredScreen() {
  const { teams, fields, fredTargetTeamIds, fredStolenAmounts, finishFredEvent } = useGameStore()

  const [fredPhase, setFredPhase] = useState<FredPhase>('spawn')
  const [fredFieldIndex, setFredFieldIndex] = useState(0)
  const [trail, setTrail] = useState<number[]>([])
  const [currentTarget, setCurrentTarget] = useState<string | null>(null)
  const [showSteal, setShowSteal] = useState(false)
  const [done, setDone] = useState(false)
  const canceledRef = useRef(false)

  const trailSet = new Set(trail)
  const fredPos = POSITIONS[fredFieldIndex] ?? POSITIONS[0]

  useEffect(() => {
    canceledRef.current = false

    const run = async () => {
      // ── Phase 1: SPAWN (3.8s) ─────────────────────────────────────
      setFredPhase('spawn')
      await sleep(3800)
      if (canceledRef.current) return

      // ── Phase 2: BOARD RUN ────────────────────────────────────────
      setFredPhase('board')
      for (let i = 0; i < FIELD_TOTAL; i++) {
        if (canceledRef.current) return
        setFredFieldIndex(i)
        setTrail((prev) => [...prev, i])
        await sleep(185)
      }
      await sleep(600)
      if (canceledRef.current) return

      // ── Phase 3: ATTACKING ────────────────────────────────────────
      setFredPhase('attacking')
      for (const targetId of fredTargetTeamIds) {
        if (canceledRef.current) return
        const target = teams.find((t) => t.id === targetId)
        if (!target) continue

        setFredFieldIndex(target.position)
        setCurrentTarget(targetId)
        setShowSteal(false)
        await sleep(750)
        if (canceledRef.current) return

        setShowSteal(true)
        await sleep(2100)
        if (canceledRef.current) return
        setShowSteal(false)
        setCurrentTarget(null)
        await sleep(450)
      }
      if (canceledRef.current) return

      // ── Phase 4: LEAVING ──────────────────────────────────────────
      setFredPhase('leaving')
      await sleep(2600)
      if (canceledRef.current) return
      setDone(true)
    }

    run()
    return () => { canceledRef.current = true }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a0505 0%, #050000 100%)' }}
    >
      {/* ── SPAWN ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {fredPhase === 'spawn' && (
          <motion.div
            key="spawn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -25, y: -80 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              transition={{ type: 'spring', damping: 9, stiffness: 90, delay: 0.15 }}
            >
              <FredIcon size={220} />
            </motion.div>

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <motion.h1
                animate={{ textShadow: ['0 0 24px #ef4444', '0 0 48px #ef4444bb', '0 0 24px #ef4444'] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="font-display text-6xl md:text-7xl"
                style={{ color: '#ef4444' }}
              >
                ⚡ FRED DAS CHAOS ⚡
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="font-body text-2xl mt-3"
                style={{ color: '#fca5a5' }}
              >
                erscheint auf dem Spielfeld!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOARD + ATTACKING ─────────────────────────────────────────── */}
      <AnimatePresence>
        {(fredPhase === 'board' || fredPhase === 'attacking') && (
          <motion.div
            key="board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Phase label */}
            <div className="flex-shrink-0 text-center pt-6 pb-2">
              <motion.h2
                key={fredPhase}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl"
                style={{ color: '#ef4444' }}
              >
                {fredPhase === 'board'
                  ? 'Fred schleicht über das Spielfeld…'
                  : '💥 Fred schlägt zu! 💥'}
              </motion.h2>
            </div>

            {/* Board */}
            <div className="flex-1 relative mx-8 mb-6">
              {fields.map((f) => (
                <FieldDot key={f.index} field={f} lit={trailSet.has(f.index)} />
              ))}

              {/* Fred icon on the board */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                style={{
                  left: `${fredPos.x}%`,
                  top: `${fredPos.y}%`,
                  transition: fredPhase === 'board'
                    ? 'left 0.17s linear, top 0.17s linear'
                    : 'left 0.55s ease-out, top 0.55s ease-out',
                  filter: 'drop-shadow(0 0 14px #ef4444)',
                }}
              >
                <FredIcon size={44} />
              </div>

              {/* Attack card overlay */}
              <AnimatePresence>
                {currentTarget && (() => {
                  const target = teams.find((t) => t.id === currentTarget)
                  if (!target) return null
                  const stolen = fredStolenAmounts[target.id] ?? 0
                  const tColor = resolveTeamColor(target.jerseyColor, target.avatar.color)
                  return (
                    <motion.div
                      key={currentTarget}
                      initial={{ scale: 0.7, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.7, opacity: 0, y: 20 }}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30"
                    >
                      <motion.div
                        animate={{ boxShadow: ['0 0 20px #ef444444', '0 0 40px #ef4444aa', '0 0 20px #ef444444'] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                        className="flex items-center gap-5 px-7 py-5 rounded-2xl border-2"
                        style={{ background: '#120000', borderColor: '#ef4444' }}
                      >
                        <AvatarRingWrapper avatar={target.avatar} jerseyColor={target.jerseyColor} outerSize={58} />
                        <div>
                          <div className="font-display text-2xl" style={{ color: tColor }}>{target.name}</div>
                          <AnimatePresence>
                            {showSteal && (
                              <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="font-display text-4xl mt-1"
                                style={{ color: '#ef4444' }}
                              >
                                -{stolen} 💎
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </motion.div>
                  )
                })()}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEAVING ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {fredPhase === 'leaving' && (
          <motion.div
            key="leaving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: '140vw' }}
              transition={{ duration: 2.0, ease: 'easeIn', delay: 0.2 }}
            >
              <FredIcon size={180} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-display text-3xl"
              style={{ color: '#fca5a5' }}
            >
              Fred verschwindet…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DONE BUTTON ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-0 right-0 flex justify-center z-40"
          >
            <Button size="xl" variant="primary" onClick={finishFredEvent}>
              Weiter →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
