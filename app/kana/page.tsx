'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { KANA, kanaId, type KanaType, type KanaCard } from '@/lib/kana'
import { loadSRS, saveSRS, MASTERED_LEVEL, getWordProgress, type SRSStore } from '@/lib/srs'

const GROUPS = [
  { key: 'vowel',   label: 'Vokal',     short: 'あア' },
  { key: 'k',       label: 'K-row',     short: 'かカ' },
  { key: 's',       label: 'S-row',     short: 'さサ' },
  { key: 't',       label: 'T-row',     short: 'たタ' },
  { key: 'n',       label: 'N-row',     short: 'なナ' },
  { key: 'h',       label: 'H-row',     short: 'はハ' },
  { key: 'm',       label: 'M-row',     short: 'まマ' },
  { key: 'y',       label: 'Y-row',     short: 'やヤ' },
  { key: 'r',       label: 'R-row',     short: 'らラ' },
  { key: 'w',       label: 'W-row',     short: 'わワ' },
  { key: 'n-solo',  label: 'N',         short: 'んン' },
  { key: 'dakuten', label: 'Dakuten',   short: 'が゛' },
  { key: 'combo',   label: 'Combo',     short: 'きゃ' },
]

export default function KanaPage() {
  const router = useRouter()
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [activeType, setActiveType] = useState<KanaType>('hiragana')
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<'all' | 'custom' | 'refresh'>('all')

  useEffect(() => { setSrsStore(loadSRS()) }, [])

  // Stats per group per type
  function groupStats(groupKey: string, type: KanaType) {
    const cards = KANA.filter(k => k.group === groupKey)
    let mastered = 0, learning = 0, newW = 0
    for (const c of cards) {
      const wp = getWordProgress(srsStore, kanaId(c.id, type))
      if (wp.level >= MASTERED_LEVEL) mastered++
      else if (wp.level > 0) learning++
      else newW++
    }
    return { mastered, learning, new: newW, total: cards.length }
  }

  // Overall stats
  const overallStats = useCallback((type: KanaType) => {
    let mastered = 0, learning = 0, newW = 0, due = 0
    const today = new Date().toISOString().split('T')[0]
    for (const c of KANA) {
      const wp = getWordProgress(srsStore, kanaId(c.id, type))
      if (wp.level >= MASTERED_LEVEL) mastered++
      else if (wp.level > 0) { learning++; if (wp.nextReview <= today) due++ }
      else newW++
    }
    return { mastered, learning, new: newW, due, total: KANA.length }
  }, [srsStore])

  const stats = overallStats(activeType)

  // Toggle group selection
  function toggleGroup(key: string) {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Refresh mode = mastered yang due
  function getRefreshIds(type: KanaType): string[] {
    const today = new Date().toISOString().split('T')[0]
    return KANA
      .filter(c => {
        const wp = getWordProgress(srsStore, kanaId(c.id, type))
        return wp.level >= MASTERED_LEVEL && wp.nextReview <= today
      })
      .map(c => c.id)
  }

  function startQuiz() {
    let ids: string[] = []
    if (mode === 'refresh') {
      ids = getRefreshIds(activeType)
      if (!ids.length) return
    } else if (mode === 'custom' && selectedGroups.size > 0) {
      ids = KANA.filter(c => selectedGroups.has(c.group)).map(c => c.id)
    } else {
      ids = KANA.map(c => c.id)
    }
    const params = new URLSearchParams({
      type: activeType,
      ids: ids.join(','),
    })
    router.push(`/kana/quiz?${params}`)
  }

  const refreshCount = getRefreshIds(activeType).length

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm mx-auto px-4 pt-12 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 anim-up">
          <button onClick={() => router.push('/')}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-transform"
            style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            ←
          </button>
          <div>
            <h1 className="font-extrabold text-xl" style={{ color: 'var(--color-text-1)' }}>
              Hiragana & Katakana
            </h1>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
              {KANA.length} karakter total
            </p>
          </div>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-5 anim-up d1">
          {(['hiragana', 'katakana'] as KanaType[]).map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className="flex-1 rounded-2xl py-3 font-extrabold text-sm capitalize transition-all active:scale-95"
              style={{
                background: activeType === t ? 'var(--color-accent)' : 'var(--color-white)',
                color: activeType === t ? '#fff' : 'var(--color-text-2)',
                boxShadow: activeType === t ? '0 4px 14px rgba(91,94,244,0.28)' : '0 1px 4px rgba(0,0,0,0.06)',
              }}>
              {t === 'hiragana' ? 'Hiragana あ' : 'Katakana ア'}
            </button>
          ))}
        </div>

        {/* Overall stats */}
        <div className="grid grid-cols-4 gap-2 mb-5 anim-up d1">
          {[
            { label: 'Hafal',  val: stats.mastered, color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
            { label: 'Proses', val: stats.learning, color: '#a855f7',             bg: '#faf0ff' },
            { label: 'Baru',   val: stats.new,      color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
            { label: 'Review', val: stats.due,      color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl py-3 text-center" style={{ background: s.bg }}>
              <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mode selector */}
        <div className="rounded-3xl overflow-hidden mb-4 anim-up d2"
          style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="p-4 pb-3">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-3)' }}>
              Mode Latihan
            </p>
            <div className="flex flex-col gap-2">
              {[
                { key: 'all',     icon: '📚', label: 'Semua karakter', desc: `${KANA.length} karakter` },
                { key: 'custom',  icon: '🎯', label: 'Pilih grup sendiri', desc: 'Fokus ke baris tertentu' },
                { key: 'refresh', icon: '🔄', label: 'Refreshment', desc: refreshCount > 0 ? `${refreshCount} karakter siap direview` : 'Belum ada yang perlu direview' },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key as typeof mode)}
                  disabled={m.key === 'refresh' && refreshCount === 0}
                  className="flex items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: mode === m.key ? 'var(--color-accent-light)' : 'var(--color-bg)',
                    border: mode === m.key ? '2px solid var(--color-accent)' : '2px solid transparent',
                    opacity: m.key === 'refresh' && refreshCount === 0 ? 0.4 : 1,
                  }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: mode === m.key ? 'var(--color-accent)' : 'var(--color-text-1)' }}>
                      {m.label}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>{m.desc}</p>
                  </div>
                  {mode === m.key && <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Group picker (only in custom mode) */}
        {mode === 'custom' && (
          <div className="rounded-3xl p-4 mb-4 anim-down"
            style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-3)' }}>
                Pilih Grup
              </p>
              <button onClick={() => setSelectedGroups(new Set(GROUPS.map(g => g.key)))}
                className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                Pilih semua
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GROUPS.map(g => {
                const gs = groupStats(g.key, activeType)
                const pct = Math.round((gs.mastered / gs.total) * 100)
                const sel = selectedGroups.has(g.key)
                return (
                  <button key={g.key} onClick={() => toggleGroup(g.key)}
                    className="rounded-2xl p-3 text-left transition-all active:scale-95"
                    style={{
                      background: sel ? 'var(--color-accent-light)' : 'var(--color-bg)',
                      border: sel ? '2px solid var(--color-accent)' : '2px solid transparent',
                    }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="jp text-base font-bold" style={{ color: sel ? 'var(--color-accent)' : 'var(--color-text-1)' }}>
                        {g.short}
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--color-text-3)' }}>{pct}%</span>
                    </div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-2)' }}>{g.label}</p>
                    {/* mini progress */}
                    <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'var(--color-subtle)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: pct + '%', background: pct === 100 ? 'var(--color-green)' : 'var(--color-accent)' }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-3)' }}>
                      {gs.mastered}/{gs.total} hafal
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Per-group progress overview (always visible) */}
        <div className="rounded-3xl p-4 mb-6 anim-up d3"
          style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-3)' }}>
            Progress per Grup
          </p>
          <div className="space-y-2.5">
            {GROUPS.map(g => {
              const gs = groupStats(g.key, activeType)
              const pct = Math.round((gs.mastered / gs.total) * 100)
              const barCol = pct === 100 ? 'var(--color-green)' : gs.mastered > 0 ? 'var(--color-accent)' : 'var(--color-text-3)'
              return (
                <div key={g.key} className="flex items-center gap-3">
                  <span className="jp text-sm font-bold w-8 shrink-0 text-center" style={{ color: 'var(--color-text-1)' }}>
                    {g.short}
                  </span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: 'var(--color-subtle)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: barCol }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: barCol }}>
                    {gs.mastered}/{gs.total}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Start button */}
        <button onClick={startQuiz}
          disabled={mode === 'custom' && selectedGroups.size === 0}
          className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform anim-up d4"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(91,94,244,0.28)',
            opacity: mode === 'custom' && selectedGroups.size === 0 ? 0.4 : 1,
          }}>
          {mode === 'refresh' ? `🔄 Mulai Refreshment (${refreshCount})` : '練習する — Mulai Latihan →'}
        </button>

      </div>
    </div>
  )
}
