import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'
import { AvatarDisplay, AvatarRingWrapper } from '../ui/AvatarDisplay'
import { AVATARS, JERSEY_COLORS, resolveTeamColor } from '../../data/avatars'

export function TeamSetupScreen() {
  const {
    teams, currentTeamSetupIndex, numTeams,
    updateTeamName, updateTeamAvatar, setJerseyColor, confirmTeam,
  } = useGameStore()
  const [inputValue, setInputValue] = useState('')

  const currentTeam = teams[currentTeamSetupIndex]
  if (!currentTeam) return null

  // ── Avatar blocking: only teams BEFORE current index that have confirmed ──
  const takenAvatarIds = new Set(
    teams
      .filter((_, i) => i < currentTeamSetupIndex)
      .map((t) => t.avatar.id),
  )

  // ── Jersey color blocking: same rule ──────────────────────────────────────
  const takenJerseyColors = new Set(
    teams
      .filter((t, i) => i < currentTeamSetupIndex && t.jerseyColor !== null)
      .map((t) => t.jerseyColor!),
  )

  const handleConfirm = () => {
    if (inputValue.trim()) updateTeamName(inputValue.trim())
    setInputValue('')
    confirmTeam()
  }

  const canConfirm = currentTeam.jerseyColor !== null

  const jc = currentTeam.jerseyColor
  const ringColor = resolveTeamColor(jc, '#e2e8f0')

  return (
    <div className="w-full h-full flex flex-col items-center justify-center screen-base p-6 overflow-y-auto">
      {/* Progress dots */}
      <motion.div
        key={currentTeamSetupIndex}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-5"
      >
        <div className="flex gap-2.5 justify-center mb-3">
          {Array.from({ length: numTeams }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full transition-all duration-300 border-2"
              style={{
                background: i < currentTeamSetupIndex
                  ? resolveTeamColor(teams[i]?.jerseyColor ?? null, teams[i]?.avatar.color ?? '#4f8cff')
                  : i === currentTeamSetupIndex ? ringColor : 'transparent',
                borderColor: i <= currentTeamSetupIndex
                  ? resolveTeamColor(teams[i]?.jerseyColor ?? null, teams[i]?.avatar.color ?? '#4f8cff')
                  : '#d1d5db',
              }}
            />
          ))}
        </div>
        <h1 className="font-display text-4xl" style={{ color: '#0f172a' }}>
          TEAM <span style={{ color: ringColor }}>{currentTeamSetupIndex + 1}</span> EINRICHTEN
        </h1>
        <p className="font-body text-lg mt-0.5" style={{ color: '#475569' }}>
          {currentTeamSetupIndex + 1} von {numTeams}
        </p>
      </motion.div>

      <div className="flex gap-5 w-full max-w-5xl items-start">
        {/* Left: Preview + Name */}
        <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-52 flex flex-col gap-3 flex-shrink-0">
          <GlassPanel className="p-5 flex flex-col items-center gap-3" accent={ringColor}>
            <motion.div
              key={`${currentTeam.avatar.id}-${jc ?? 'none'}`}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <AvatarRingWrapper
                avatar={currentTeam.avatar}
                jerseyColor={jc}
                outerSize={110}
                mode="full"
                style={{ boxShadow: `0 8px 24px ${ringColor}44` }}
              />
            </motion.div>
            <div className="font-display text-xl text-center" style={{ color: ringColor }}>
              {currentTeam.name}
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <label className="font-body font-semibold block mb-2" style={{ color: '#475569', fontSize: '1rem' }}>
              Teamname
            </label>
            <input
              type="text"
              maxLength={15}
              placeholder={currentTeam.name}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                updateTeamName(e.target.value || currentTeam.name)
              }}
              style={{ width: '100%', fontSize: '1.1rem' }}
            />
          </GlassPanel>
        </motion.div>

        {/* Right: Avatar + Color selection */}
        <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Avatar grid */}
          <GlassPanel className="p-4">
            <h2 className="font-display text-lg mb-3 text-center" style={{ color: '#475569' }}>
              AVATAR WÄHLEN
            </h2>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)', maxHeight: '38vh', overflowY: 'auto' }}>
              {AVATARS.map((avatar) => {
                const isTaken = takenAvatarIds.has(avatar.id)
                const takenByName = isTaken
                  ? teams.find((t, i) => i < currentTeamSetupIndex && t.avatar.id === avatar.id)?.name
                  : undefined
                const isSelected = currentTeam.avatar.id === avatar.id
                const isImg = avatar.type === 'image'

                return (
                  <motion.button
                    key={avatar.id}
                    whileTap={isTaken ? {} : { scale: 0.93 }}
                    whileHover={isTaken ? {} : { scale: 1.05, y: -2 }}
                    onClick={() => !isTaken && updateTeamAvatar(avatar.id)}
                    disabled={isTaken}
                    title={isTaken ? `Gewählt von ${takenByName}` : avatar.name}
                    className="relative flex flex-col items-center justify-end gap-1 rounded-2xl border-2 cursor-pointer transition-all duration-200 pb-2 pt-1 overflow-hidden"
                    style={{
                      height: isImg ? 120 : 82,
                      ...(isSelected
                        ? { background: '#f8fafc', borderColor: ringColor, boxShadow: `0 4px 16px ${ringColor}44` }
                        : isTaken
                        ? { background: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.4, cursor: 'not-allowed' }
                        : { background: '#f8fafc', borderColor: '#e5e7eb' }),
                    }}
                  >
                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden px-1">
                      {isImg
                        ? <img src={avatar.src} alt={avatar.name} draggable={false}
                            style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', objectPosition: 'center bottom' }} />
                        : <span style={{ fontSize: 34, lineHeight: 1 }}>{avatar.emoji}</span>
                      }
                    </div>
                    <span className="text-[10px] font-body font-semibold leading-none z-10" style={{ color: isTaken ? '#94a3b8' : '#475569' }}>
                      {isTaken ? takenByName : avatar.name}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold z-20"
                        style={{ background: ringColor }}>✓</div>
                    )}
                    {isTaken && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs border border-[#e2e8f0] z-20">🔒</div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </GlassPanel>

          {/* Jersey color selection */}
          <GlassPanel className="p-4">
            <h2 className="font-display text-lg mb-3 text-center" style={{ color: '#475569' }}>
              LEIBCHEN-FARBE WÄHLEN
            </h2>
            <div className="flex gap-3 flex-wrap justify-center">
              {JERSEY_COLORS.map((jcDef) => {
                const isTakenColor = takenJerseyColors.has(jcDef.hex)
                const isSelectedColor = currentTeam.jerseyColor === jcDef.hex
                const isRainbow = jcDef.hex === 'rainbow'

                return (
                  <motion.button
                    key={jcDef.id}
                    whileTap={isTakenColor ? {} : { scale: 0.9 }}
                    whileHover={isTakenColor ? {} : { scale: 1.1 }}
                    onClick={() => !isTakenColor && setJerseyColor(jcDef.hex)}
                    disabled={isTakenColor}
                    title={isTakenColor ? 'Bereits gewählt' : jcDef.name}
                    className="relative flex flex-col items-center gap-1 cursor-pointer"
                    style={{ opacity: isTakenColor ? 0.35 : 1, cursor: isTakenColor ? 'not-allowed' : 'pointer' }}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: isRainbow
                          ? 'conic-gradient(#EF4444, #F97316, #EAB308, #22C55E, #3B82F6, #A855F7, #EF4444)'
                          : jcDef.hex,
                        border: isSelectedColor ? '3px solid #0f172a' : '3px solid transparent',
                        boxShadow: isSelectedColor ? '0 0 0 2px white, 0 0 0 4px #0f172a' : 'none',
                      }}
                    >
                      {isSelectedColor && (
                        <span className="text-white font-bold text-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>✓</span>
                      )}
                    </div>
                    <span className="text-[10px] font-body font-semibold" style={{ color: isTakenColor ? '#94a3b8' : '#475569' }}>
                      {isTakenColor ? '🔒' : jcDef.name}
                    </span>
                  </motion.button>
                )
              })}
            </div>
            {!canConfirm && (
              <p className="text-center text-sm font-body mt-2" style={{ color: '#f97316' }}>
                ↑ Bitte eine Farbe wählen um fortzufahren
              </p>
            )}
          </GlassPanel>
        </motion.div>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-5">
        <Button size="xl" onClick={handleConfirm} disabled={!canConfirm}>
          {currentTeamSetupIndex + 1 < numTeams
            ? `WEITER → TEAM ${currentTeamSetupIndex + 2}`
            : '🎮 SPIEL STARTEN!'}
        </Button>
      </motion.div>
    </div>
  )
}
