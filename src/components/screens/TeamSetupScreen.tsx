import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../ui/Button'
import { GlassPanel } from '../ui/GlassPanel'
import { AVATARS } from '../../data/avatars'

export function TeamSetupScreen() {
  const { teams, currentTeamSetupIndex, numTeams, updateTeamName, updateTeamAvatar, confirmTeam } = useGameStore()
  const [inputValue, setInputValue] = useState('')

  const currentTeam = teams[currentTeamSetupIndex]
  if (!currentTeam) return null

  // Only block avatars already chosen by PREVIOUS teams (index < current)
  const takenByTeam: Record<string, string> = {}
  teams
    .filter((_, i) => i < currentTeamSetupIndex)
    .forEach((t) => { takenByTeam[t.avatar.id] = t.name })

  const handleConfirm = () => {
    if (inputValue.trim()) updateTeamName(inputValue.trim())
    setInputValue('')
    confirmTeam()
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center screen-base p-6">
      {/* Progress dots */}
      <motion.div
        key={currentTeamSetupIndex}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="flex gap-2.5 justify-center mb-4">
          {Array.from({ length: numTeams }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full transition-all duration-300 border-2"
              style={{
                background: i < currentTeamSetupIndex
                  ? (teams[i]?.avatar.color ?? '#4f8cff')
                  : i === currentTeamSetupIndex
                  ? currentTeam.avatar.color
                  : 'transparent',
                borderColor: i <= currentTeamSetupIndex
                  ? (teams[i]?.avatar.color ?? '#4f8cff')
                  : '#d1d5db',
              }}
            />
          ))}
        </div>
        <h1 className="font-display text-4xl" style={{ color: '#0f172a' }}>
          TEAM{' '}
          <span style={{ color: currentTeam.avatar.color }}>{currentTeamSetupIndex + 1}</span>{' '}
          EINRICHTEN
        </h1>
        <p className="font-body text-xl mt-1" style={{ color: '#475569' }}>
          {currentTeamSetupIndex + 1} von {numTeams}
        </p>
      </motion.div>

      <div className="flex gap-6 w-full max-w-4xl items-start">
        {/* Preview + Name */}
        <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-64 flex flex-col gap-4">
          <GlassPanel className="p-6 flex flex-col items-center gap-4" accent={currentTeam.avatar.color}>
            <motion.div
              key={currentTeam.avatar.id}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-28 h-28 rounded-full flex items-center justify-center text-6xl border-4"
              style={{
                background: currentTeam.avatar.bgColor,
                borderColor: currentTeam.avatar.color,
                boxShadow: `0 8px 24px ${currentTeam.avatar.color}44`,
              }}
            >
              {currentTeam.avatar.emoji}
            </motion.div>
            <div className="font-display text-2xl text-center" style={{ color: currentTeam.avatar.color }}>
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
              style={{ width: '100%', fontSize: '1.2rem' }}
            />
          </GlassPanel>
        </motion.div>

        {/* Avatar grid */}
        <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1">
          <GlassPanel className="p-5">
            <h2 className="font-display text-xl mb-4 text-center" style={{ color: '#475569' }}>
              AVATAR WÄHLEN
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {AVATARS.map((avatar) => {
                const takenBy = takenByTeam[avatar.id]
                const isTaken = Boolean(takenBy)
                const isSelected = currentTeam.avatar.id === avatar.id

                return (
                  <motion.button
                    key={avatar.id}
                    whileTap={isTaken ? {} : { scale: 0.9 }}
                    whileHover={isTaken ? {} : { scale: 1.06, y: -2 }}
                    onClick={() => !isTaken && updateTeamAvatar(avatar.id)}
                    disabled={isTaken}
                    title={isTaken ? `Gewählt von ${takenBy}` : avatar.name}
                    className="relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer border-2"
                    style={
                      isSelected
                        ? { background: avatar.bgColor, borderColor: avatar.color, boxShadow: `0 6px 20px ${avatar.color}44` }
                        : isTaken
                        ? { background: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.45, cursor: 'not-allowed' }
                        : { background: '#f8fafc', borderColor: '#e5e7eb' }
                    }
                  >
                    <span className="text-4xl leading-none">{avatar.emoji}</span>
                    <span className="text-xs font-body font-semibold leading-none" style={{ color: isTaken ? '#94a3b8' : '#475569' }}>
                      {isTaken ? takenBy : avatar.name}
                    </span>

                    {/* Check mark for selected */}
                    {isSelected && (
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: avatar.color }}
                      >
                        ✓
                      </div>
                    )}

                    {/* Lock for taken */}
                    {isTaken && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs border border-[#e2e8f0]">
                        🔒
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8">
        <Button size="xl" onClick={handleConfirm}>
          {currentTeamSetupIndex + 1 < numTeams
            ? `WEITER → TEAM ${currentTeamSetupIndex + 2}`
            : '🎮 SPIEL STARTEN!'}
        </Button>
      </motion.div>
    </div>
  )
}
