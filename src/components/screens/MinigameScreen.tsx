import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useMinigameStore } from '../../store/minigameStore'
import { Button } from '../ui/Button'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  inhibition:  { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
  updating:    { bg: '#dbeafe', text: '#1d4ed8', border: '#3b82f6' },
  flexibility: { bg: '#fef9c3', text: '#92400e', border: '#f59e0b' },
  flexibilität:{ bg: '#fef9c3', text: '#92400e', border: '#f59e0b' },
  kombi:       { bg: '#fef3c7', text: '#92400e', border: '#d97706' },
}

function categoryStyle(cat: string | null) {
  if (!cat) return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  return CATEGORY_COLORS[cat.toLowerCase()] ?? { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
}

function toEmbedUrl(url: string | null): string | null {
  if (!url) return null
  if (url.includes('youtube.com/embed/')) return url
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  return url
}

function VideoPlayer({ videoUrl, hasAudio }: { videoUrl: string | null; hasAudio: boolean }) {
  const [muted, setMuted] = useState(!hasAudio)
  const [videoKey, setVideoKey] = useState(0)
  const embedUrl = toEmbedUrl(videoUrl)

  const replay = () => setVideoKey((k) => k + 1)
  const toggleMute = () => { setMuted((m) => !m); setVideoKey((k) => k + 1) }

  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f8fafc] rounded-2xl border-2 border-[#e5e7eb] gap-4">
        <div className="text-6xl">🎮</div>
        <p className="font-body text-[#94a3b8] text-lg text-center px-4">Kein Video verfügbar</p>
      </div>
    )
  }

  const src = `${embedUrl}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&start=0`

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#e5e7eb] bg-black flex-1 min-h-0">
        <iframe
          key={videoKey}
          src={src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Minispiel-Video"
        />
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={replay}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-[#d1d5db] bg-white text-[#475569] font-body font-semibold text-sm hover:border-[#4f8cff] hover:text-[#4f8cff] transition-all cursor-pointer"
        >
          ▶ Nochmal abspielen
        </button>
        <button
          onClick={toggleMute}
          className="px-3 py-2 rounded-xl border-2 border-[#d1d5db] bg-white text-[#475569] hover:border-[#4f8cff] hover:text-[#4f8cff] transition-all cursor-pointer text-lg"
          title={muted ? 'Ton einschalten' : 'Ton ausschalten'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  )
}

export function MinigameScreen() {
  const { phase, startMinigame, endMinigame, currentRound, totalRounds, darkRoundActive } = useGameStore()
  const { currentMinigame, pickNext } = useMinigameStore()

  // Pick a new minigame when announce phase mounts
  useEffect(() => {
    if (phase === 'minigameAnnounce') pickNext()
  }, [])

  const mg = currentMinigame
  const catStyle = categoryStyle(mg?.category ?? null)

  // ── Announce screen ───────────────────────────────────────────────────────
  if (phase === 'minigameAnnounce') {
    return (
      <div className="w-full h-full flex flex-col screen-base pt-16 overflow-hidden">
        {/* Round banner */}
        <div className="flex-shrink-0 text-center py-4 px-6">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160 }}
          >
            <span className="font-display text-5xl text-[#0f172a]">
              RUNDE <span className="text-[#4f8cff]">{currentRound}</span>
              <span className="text-[#94a3b8] text-3xl"> /{totalRounds}</span>
            </span>
          </motion.div>
          {darkRoundActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 inline-block px-5 py-1.5 rounded-full bg-purple-100 border-2 border-purple-400 text-purple-700 font-display text-base"
            >
              🌑 DUNKLE RUNDE: Sieger würfelt 2×, Letzter bekommt 0 Kristalle!
            </motion.div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex-1 flex gap-5 px-6 pb-4 min-h-0">
          {/* Left: video */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex-1 min-w-0"
          >
            {mg
              ? <VideoPlayer videoUrl={mg.video_url} hasAudio={mg.has_audio} />
              : (
                <div className="flex items-center justify-center h-full bg-[#f8fafc] rounded-2xl border-2 border-[#e5e7eb]">
                  <p className="text-[#94a3b8] font-body">Lade Minispiel…</p>
                </div>
              )
            }
          </motion.div>

          {/* Right: info */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-80 flex-shrink-0 flex flex-col gap-4"
          >
            <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] p-5 flex-1 flex flex-col">
              {mg ? (
                <>
                  <h2 className="font-display text-3xl text-[#0f172a] mb-3 leading-tight">{mg.name}</h2>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-body font-semibold mb-4 self-start"
                    style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
                  >
                    🏷️ {mg.category ?? 'Allgemein'}
                  </div>
                  <p className="text-[#475569] font-body text-base leading-relaxed flex-1 overflow-y-auto">
                    {mg.description}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <p className="text-[#94a3b8] font-body">Kein Minispiel geladen</p>
                </div>
              )}
            </div>

            <Button size="xl" onClick={startMinigame} fullWidth>
              ⚡ MINISPIEL STARTEN!
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Active screen ─────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col screen-base pt-16 overflow-hidden">
      {/* Two-column layout — same as announce but with BEENDEN */}
      <div className="flex-1 flex gap-5 px-6 pb-4 min-h-0 pt-4">
        {/* Left: video */}
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          className="flex-1 min-w-0"
        >
          {mg
            ? <VideoPlayer videoUrl={mg.video_url} hasAudio={mg.has_audio} />
            : (
              <div className="flex items-center justify-center h-full bg-[#f8fafc] rounded-2xl border-2 border-[#e5e7eb]">
                <p className="text-[#94a3b8] font-body">Kein Video</p>
              </div>
            )
          }
        </motion.div>

        {/* Right: info + end button */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] p-5 flex-1 flex flex-col overflow-hidden">
            {mg ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display text-[#f59e0b] text-lg">
                    {currentRound}<span className="text-[#d1d5db]">/{totalRounds}</span>
                  </span>
                  {darkRoundActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-body font-bold border border-purple-300">
                      🌑 Dunkle Runde
                    </span>
                  )}
                </div>
                <h2 className="font-display text-2xl text-[#0f172a] mb-2 leading-tight">{mg.name}</h2>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-body font-semibold mb-3 self-start"
                  style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
                >
                  🏷️ {mg.category ?? 'Allgemein'}
                </div>
                <p className="text-[#475569] font-body text-sm leading-relaxed flex-1 overflow-y-auto">
                  {mg.description}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <p className="text-[#94a3b8] font-body text-sm">Kein Minispiel</p>
              </div>
            )}
          </div>

          <Button size="xl" variant="danger" onClick={endMinigame} fullWidth>
            🏁 MINISPIEL BEENDEN
          </Button>
        </div>
      </div>
    </div>
  )
}
