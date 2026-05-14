// Web Audio API sound engine — SFX only, no background music
// General rules: max freq C5 (523 Hz), only sine/triangle, always fade-out

export type SFXName =
  | 'dice_roll' | 'dice_result'
  | 'step' | 'land'
  | 'crystal_gain' | 'crystal_lose' | 'crystal_count'
  | 'item_use' | 'shop_buy' | 'shop_open'
  | 'event' | 'earthquake' | 'revolution' | 'crystal_rain'
  | 'collision' | 'mine_explode' | 'mine_place' | 'shield_block' | 'steal'
  | 'streak' | 'achievement' | 'round_start' | 'finale_announce' | 'winner' | 'swap'
  | 'anchor' | 'turbo' | 'speedup'

// ── helpers ───────────────────────────────────────────────────────────────────
function note(
  ctx: AudioContext, bus: GainNode,
  freq: number, start: number, dur: number, vol: number,
  type: OscillatorType = 'sine',
) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t = ctx.currentTime + start
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.02)
  g.gain.setValueAtTime(vol, Math.max(t + 0.02, t + dur - 0.25))
  g.gain.linearRampToValueAtTime(0, t + dur)
  osc.connect(g); g.connect(bus)
  osc.start(t); osc.stop(t + dur + 0.05)
}

function noise(
  ctx: AudioContext, bus: GainNode,
  dur: number, vol: number, filterFreq = 800,
) {
  const bufSize = Math.ceil(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = filterFreq
  filter.Q.value = 1.5
  const g = ctx.createGain()
  const t = ctx.currentTime
  g.gain.setValueAtTime(vol, t)
  g.gain.linearRampToValueAtTime(0, t + dur)
  src.connect(filter); filter.connect(g); g.connect(bus)
  src.start(t); src.stop(t + dur + 0.05)
}

// dB to linear
function db(decibels: number) { return Math.pow(10, decibels / 20) }

// ── SFX definitions ───────────────────────────────────────────────────────────
type SFXFn = (ctx: AudioContext, bus: GainNode) => void

const SFX: Record<SFXName, SFXFn> = {
  // Dice rolling – low thuds
  dice_roll: (ctx, bus) => {
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.15 + Math.random() * 0.05
      setTimeout(() => noise(ctx, bus, 0.1, db(-18), 200 + Math.random() * 200), delay * 1000)
    }
  },
  // Reveal: two soft rising tones, max D4
  dice_result: (ctx, bus) => {
    note(ctx, bus, 196.00, 0,    0.3, db(-12))  // G3
    note(ctx, bus, 246.94, 0.22, 0.4, db(-11))  // B3
  },
  // Step: soft low blip
  step: (ctx, bus) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(160, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12)
    g.gain.setValueAtTime(db(-14), ctx.currentTime)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 0.18)
  },
  // Land: soft thud
  land: (ctx, bus) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(90, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3)
    g.gain.setValueAtTime(db(-10), ctx.currentTime)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
    noise(ctx, bus, 0.18, db(-22), 150)
  },
  // Crystal gain: gentle ascending C3→E3→G3
  crystal_gain: (ctx, bus) => {
    note(ctx, bus, 130.81, 0,    0.35, db(-13))  // C3
    note(ctx, bus, 164.81, 0.18, 0.35, db(-13))  // E3
    note(ctx, bus, 196.00, 0.36, 0.5,  db(-12))  // G3
  },
  // Crystal lose: descending G3→E3→C3
  crystal_lose: (ctx, bus) => {
    note(ctx, bus, 196.00, 0,    0.3, db(-13))
    note(ctx, bus, 164.81, 0.2,  0.3, db(-13))
    note(ctx, bus, 130.81, 0.4,  0.4, db(-12))
  },
  // Crystal count: single slow sweep C3→C4 over 1.5s, plays ONCE at start
  crystal_count: (ctx, bus) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130.81, ctx.currentTime)       // C3
    osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 1.5) // C4
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(db(-18), ctx.currentTime + 0.1)
    g.gain.linearRampToValueAtTime(db(-18), ctx.currentTime + 1.2)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 1.6)
  },
  // Item use: soft power-up sweep E2→B3
  item_use: (ctx, bus) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(82.41, ctx.currentTime)   // E2
    osc.frequency.exponentialRampToValueAtTime(246.94, ctx.currentTime + 0.4) // B3
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(db(-12), ctx.currentTime + 0.05)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 0.55)
    note(ctx, bus, 196.00, 0.35, 0.3, db(-13))  // G3 finish
  },
  // Shop buy: deep C3→E3 kaching (MUCH lower than before)
  shop_buy: (ctx, bus) => {
    note(ctx, bus, 130.81, 0,    0.25, db(-15), 'sine')  // C3
    note(ctx, bus, 164.81, 0.18, 0.35, db(-15), 'sine')  // E3
  },
  // Shop open: descending soft sweep
  shop_open: (ctx, bus) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(246.94, ctx.currentTime)  // B3
    osc.frequency.exponentialRampToValueAtTime(130.81, ctx.currentTime + 0.45) // C3
    g.gain.setValueAtTime(db(-14), ctx.currentTime)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 0.55)
  },
  // Event: mysterious soft chord E2+G2+B2
  event: (ctx, bus) => {
    [82.41, 98.00, 123.47].forEach((f) => note(ctx, bus, f, 0, 0.9, db(-16), 'sine'))
  },
  // Earthquake: deep rumble
  earthquake: (ctx, bus) => {
    for (let i = 0; i < 6; i++)
      setTimeout(() => noise(ctx, bus, 0.14, db(-14), 60 + Math.random() * 60), i * 80)
    note(ctx, bus, 40, 0, 1.0, db(-10), 'sine')
  },
  // Revolution: soft drum roll
  revolution: (ctx, bus) => {
    for (let i = 0; i < 12; i++)
      setTimeout(() => noise(ctx, bus, 0.07, db(-16), 120), i * 60)
    note(ctx, bus, 98, 0, 1.2, db(-14), 'sine')
  },
  // Crystal rain: gentle cascade of C3–G3 notes
  crystal_rain: (ctx, bus) => {
    const freqs = [130.81, 164.81, 196.00, 220.00, 261.63]
    for (let i = 0; i < 10; i++) {
      const delay = Math.random() * 0.9
      const freq = freqs[Math.floor(Math.random() * freqs.length)]
      setTimeout(() => note(ctx, bus, freq, 0, 0.25, db(-16), 'sine'), delay * 1000)
    }
  },
  // Collision: soft bump
  collision: (ctx, bus) => {
    noise(ctx, bus, 0.22, db(-14), 180)
    note(ctx, bus, 65, 0, 0.22, db(-10), 'sine')
  },
  // Mine explode: low boom
  mine_explode: (ctx, bus) => {
    noise(ctx, bus, 0.6, db(-10), 120)
    note(ctx, bus, 40, 0,    0.5, db(-8),  'sine')
    note(ctx, bus, 55, 0.06, 0.4, db(-10), 'sine')
  },
  // Mine place: two low clicks
  mine_place: (ctx, bus) => {
    noise(ctx, bus, 0.06, db(-18), 300)
    setTimeout(() => noise(ctx, bus, 0.05, db(-20), 350), 170)
  },
  // Shield block: soft metallic low tone
  shield_block: (ctx, bus) => {
    note(ctx, bus, 246.94, 0,    0.5, db(-13))  // B3
    note(ctx, bus, 196.00, 0.05, 0.4, db(-15))  // G3
    noise(ctx, bus, 0.15, db(-22), 600)
  },
  // Steal: soft descending swipe
  steal: (ctx, bus) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(261.63, ctx.currentTime)  // C4
    osc.frequency.exponentialRampToValueAtTime(82.41, ctx.currentTime + 0.3)  // E2
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(db(-12), ctx.currentTime + 0.03)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  },
  // Streak: rising triangle sweep + soft harmonics
  streak: (ctx, bus) => {
    noise(ctx, bus, 0.5, db(-20), 400)
    ;[98, 123.47, 164.81, 196.00, 246.94].forEach((f, i) =>
      note(ctx, bus, f, i * 0.07, 0.2, db(-14), 'triangle')
    )
  },
  // Achievement: triumphant C3→E3→G3→C4 jingle
  achievement: (ctx, bus) => {
    const pat: [number, number, number][] = [
      [130.81, 0,    0.25],  // C3
      [164.81, 0.22, 0.25],  // E3
      [196.00, 0.44, 0.25],  // G3
      [261.63, 0.66, 0.25],  // C4
      [196.00, 0.9,  0.2 ],  // G3
      [261.63, 1.1,  0.55],  // C4 hold
    ]
    pat.forEach(([f, t, d]) => note(ctx, bus, f, t, d, db(-11)))
  },
  // Round start: G3→B3→D4 (NOT higher, warm triangle)
  round_start: (ctx, bus) => {
    note(ctx, bus, 196.00, 0,    0.3, db(-12), 'triangle')  // G3
    note(ctx, bus, 246.94, 0.25, 0.3, db(-12), 'triangle')  // B3
    note(ctx, bus, 293.66, 0.5,  0.5, db(-11), 'triangle')  // D4
  },
  // Finale announce: dramatic low build, stays under D4
  finale_announce: (ctx, bus) => {
    ;[82.41, 98.00, 123.47].forEach((f) => note(ctx, bus, f, 0, 0.4, db(-13), 'triangle'))
    ;[164.81, 196.00, 246.94].forEach((f) => note(ctx, bus, f, 0.38, 0.55, db(-11), 'triangle'))
    note(ctx, bus, 293.66, 0.95, 0.7, db(-10), 'triangle')  // D4
  },
  // Winner: epic soft fanfare, stays under C4
  winner: (ctx, bus) => {
    const fanfare: [number, number, number][] = [
      [130.81, 0,    0.25],  // C3
      [164.81, 0.22, 0.25],  // E3
      [196.00, 0.44, 0.25],  // G3
      [261.63, 0.66, 0.6 ],  // C4
      [261.63, 1.35, 0.18],
      [261.63, 1.58, 0.18],
      [293.66, 1.8,  0.9 ],  // D4
    ]
    fanfare.forEach(([f, t, d]) => note(ctx, bus, f, t, d, db(-10)))
    noise(ctx, bus, 0.3, db(-24), 200)
    setTimeout(() => noise(ctx, bus, 0.35, db(-22), 250), 660)
    setTimeout(() => noise(ctx, bus, 0.4,  db(-20), 300), 1800)
  },
  // Swap: low whoosh
  swap: (ctx, bus) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 0.35)  // C4
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(db(-12), ctx.currentTime + 0.1)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 0.5)
  },
  // Anchor: heavy low drop + chain-like pulses
  anchor: (ctx, bus) => {
    noise(ctx, bus, 0.22, db(-12), 100)
    note(ctx, bus, 55, 0, 0.35, db(-10), 'sine')
    note(ctx, bus, 130.81, 0.22, 0.18, db(-16))
    note(ctx, bus, 110.00, 0.42, 0.18, db(-18))
  },
  // Turbo: rising triangle sweep
  turbo: (ctx, bus) => {
    noise(ctx, bus, 0.4, db(-18), 300)
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(82.41, ctx.currentTime)    // E2
    osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 0.35) // C4
    g.gain.setValueAtTime(db(-14), ctx.currentTime)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45)
    osc.connect(g); g.connect(bus)
    osc.start(); osc.stop(ctx.currentTime + 0.5)
  },
  // Speedup: gentle ascending four-note run, max D4
  speedup: (ctx, bus) => {
    ;[130.81, 164.81, 196.00, 246.94].forEach((f, i) =>
      note(ctx, bus, f, i * 0.08, 0.18, db(-13), 'triangle')
    )
  },
}

// ── SoundManager ──────────────────────────────────────────────────────────────
class SoundManagerClass {
  private ctx: AudioContext | null = null
  private sfxBus: GainNode | null = null

  sfxEnabled = true
  sfxVolume = 0.9   // high linear gain; actual loudness controlled via db() in each SFX

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
    this.sfxBus = this.ctx.createGain()
    this.sfxBus.gain.value = this.sfxEnabled ? this.sfxVolume : 0
    this.sfxBus.connect(this.ctx.destination)
  }

  playSFX(name: SFXName) {
    if (!this.ctx || !this.sfxBus || !this.sfxEnabled) return
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
    SFX[name]?.(this.ctx, this.sfxBus)
  }

  setSFXEnabled(val: boolean) {
    this.sfxEnabled = val
    if (this.sfxBus) this.sfxBus.gain.value = val ? this.sfxVolume : 0
  }
}

export const soundManager = new SoundManagerClass()
