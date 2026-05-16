'use client'

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function gain(ctx: AudioContext, value: number, at: number, end: number): GainNode {
  const g = ctx.createGain()
  g.gain.setValueAtTime(value, at)
  g.gain.linearRampToValueAtTime(0, end)
  g.connect(ctx.destination)
  return g
}

function osc(ctx: AudioContext, type: OscillatorType, freq: number, g: GainNode, start: number, end: number) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  o.connect(g)
  o.start(start)
  o.stop(end)
}

/** Correct answer — bright ascending chime */
export function playCorrect() {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const at = t + i * 0.07
    const g = gain(c, 0.18, at, at + 0.25)
    osc(c, 'sine', freq, g, at, at + 0.25)
    // subtle harmonic
    const g2 = gain(c, 0.06, at, at + 0.2)
    osc(c, 'sine', freq * 2, g2, at, at + 0.2)
  })
}

/** Wrong answer — low thud + descending */
export function playWrong() {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  // Low thud
  const g1 = gain(c, 0.22, t, t + 0.18)
  osc(c, 'sawtooth', 180, g1, t, t + 0.18)
  // Descend
  const g2 = gain(c, 0.14, t + 0.1, t + 0.35)
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(320, t + 0.1)
  o.frequency.linearRampToValueAtTime(180, t + 0.35)
  o.connect(g2)
  o.start(t + 0.1)
  o.stop(t + 0.35)
}

/** Streak — sparkly upward arpeggio */
export function playStreak() {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  const notes = [523, 659, 784, 880, 1047, 1319]
  notes.forEach((freq, i) => {
    const at = t + i * 0.055
    const g = gain(c, 0.15, at, at + 0.22)
    osc(c, 'sine', freq, g, at, at + 0.22)
    const g2 = gain(c, 0.04, at, at + 0.15)
    osc(c, 'triangle', freq * 1.5, g2, at, at + 0.15)
  })
}

/** Level up — triumphant fanfare */
export function playLevelUp() {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  const seq = [
    { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.12 },
    { f: 1047, d: 0.35 },
  ]
  let at = t
  seq.forEach(({ f, d }) => {
    const g = gain(c, 0.2, at, at + d)
    osc(c, 'sine', f, g, at, at + d)
    const gh = gain(c, 0.07, at, at + d)
    osc(c, 'sine', f * 2, gh, at, at + d)
    at += d * 0.9
  })
}

/** Session complete — full finish jingle */
export function playFinish() {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  const seq = [
    [523, 659], [659, 784], [784, 1047], [1047, 1319],
  ]
  seq.forEach(([f1, f2], i) => {
    const at = t + i * 0.13
    const g1 = gain(c, 0.16, at, at + 0.28)
    osc(c, 'sine', f1, g1, at, at + 0.28)
    const g2 = gain(c, 0.1, at, at + 0.28)
    osc(c, 'sine', f2, g2, at, at + 0.28)
  })
  // Final chord
  const at = t + 0.55
  ;[523, 659, 784, 1047].forEach(f => {
    const g = gain(c, 0.12, at, at + 0.6)
    osc(c, 'sine', f, g, at, at + 0.6)
  })
}

/** Tap / button click — subtle tick */
export function playTap() {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  const g = gain(c, 0.08, t, t + 0.06)
  osc(c, 'sine', 880, g, t, t + 0.06)
}

/** Hearts lost — soft thump */
export function playLoseHeart() {
  const c = getCtx(); if (!c) return
  const t = c.currentTime
  const g = gain(c, 0.2, t, t + 0.22)
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(220, t)
  o.frequency.linearRampToValueAtTime(80, t + 0.22)
  o.connect(g)
  o.start(t); o.stop(t + 0.22)
}
