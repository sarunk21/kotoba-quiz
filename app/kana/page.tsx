'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { KANA, kanaId, type KanaType, getConfusableKanaIds, type KanaCard } from '@/lib/kana'
import { loadSRS, MASTERED_LEVEL, getWordProgress, type SRSStore } from '@/lib/srs'
import { getLocalDateString } from '@/lib/dateUtils'
import { pullFromCloud } from '@/lib/cloud'
import { playTap, speakJapanese } from '@/lib/sounds'
import BottomNav from '@/components/BottomNav'

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
  const { data: session } = useSession()
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [activeType, setActiveType] = useState<KanaType | 'both'>('hiragana')
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<'all' | 'custom' | 'refresh' | 'confusable'>('all')
  const [activeTab, setActiveTab] = useState<'practice' | 'chart'>('practice')
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all')
  const [playingChar, setPlayingChar] = useState<string | null>(null)

  useEffect(() => {
    setSrsStore(loadSRS())
    if (session?.accessToken) {
      pullFromCloud().then(result => {
        if (result) setSrsStore(result.srs)
      })
    }
  }, [session?.accessToken])

  // Stats per group per type
  function groupStats(groupKey: string, type: KanaType) {
    const cards = KANA.filter(k => k.group === groupKey)
    let mastered = 0, learning = 0, newW = 0, points = 0
    for (const c of cards) {
      const wp = getWordProgress(srsStore, kanaId(c.id, type))
      if (wp.level >= 1) {
        mastered++
        if (wp.level >= 5) points += 100
        else if (wp.level === 4) points += 90
        else if (wp.level === 3) points += 75
        else if (wp.level === 2) points += 50
        else points += 30
      } else {
        newW++
      }
    }
    const pct = cards.length > 0 ? Math.round(points / cards.length) : 0
    return { mastered, learning, new: newW, total: cards.length, pct }
  }

  // Overall stats
  const overallStats = useCallback((type: KanaType | 'both') => {
    let mastered = 0, learning = 0, newW = 0, due = 0
    const today = getLocalDateString()
    const typesToCount: KanaType[] = type === 'both' ? ['hiragana', 'katakana'] : [type]

    for (const t of typesToCount) {
      for (const c of KANA) {
        const wp = getWordProgress(srsStore, kanaId(c.id, t))
        if (wp.level >= 1) {
          mastered++
          if (wp.nextReview <= today && wp.level < MASTERED_LEVEL) due++
        } else {
          newW++
        }
      }
    }
    const total = KANA.length * typesToCount.length
    return { mastered, learning: total - mastered - newW, new: newW, due, total }
  }, [srsStore])

  const stats = overallStats(activeType)

  // Toggle group selection
  function toggleGroup(key: string) {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Refresh mode = mastered yang due
  function getRefreshIds(type: KanaType | 'both'): string[] {
    const today = getLocalDateString()
    const targetType: KanaType = type === 'both' ? 'hiragana' : type
    return KANA
      .filter(c => {
        const wp = getWordProgress(srsStore, kanaId(c.id, targetType))
        return wp.level >= MASTERED_LEVEL && wp.nextReview <= today
      })
      .map(c => c.id)
  }

  function startQuiz() {
    playTap()
    let ids: string[] = []
    const targetType = activeType === 'both' ? 'hiragana' : activeType

    if (mode === 'refresh') {
      ids = getRefreshIds(activeType)
      if (!ids.length) return
    } else if (mode === 'confusable') {
      ids = getConfusableKanaIds(targetType)
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

  const handlePlayAudio = (char: string) => {
    playTap()
    setPlayingChar(char)
    speakJapanese(char)
    setTimeout(() => setPlayingChar(null), 1500)
  }

  const refreshCount = getRefreshIds(activeType).length

  const filteredKanaChart = useMemo(() => {
    if (selectedGroupFilter === 'all') return KANA
    return KANA.filter(k => k.group === selectedGroupFilter)
  }, [selectedGroupFilter])

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-10 pb-28">

        {/* Header Navigation */}
        <header className="flex items-center justify-between mb-6 anim-up">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { playTap(); router.push('/') }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] border border-[var(--color-border)] active:scale-95 transition-all shrink-0 shadow-xs cursor-pointer"
            >
              ←
            </button>
            <div>
              <h1 className="font-black text-xl text-[var(--color-text-1)] tracking-tight">
                Hiragana & Katakana
              </h1>
              <p className="text-xs font-semibold text-[var(--color-text-2)] mt-0.5">
                {KANA.length * 2} Karakter & Suara Pelafalan
              </p>
            </div>
          </div>
        </header>

        {/* Main Tab Switcher: [ 🎮 Mode Berlatih ] vs [ 📖 Tabel & Audio Kana ] */}
        <div className="flex bg-white dark:bg-[#1a1d24] p-1.5 rounded-2xl border border-[var(--color-border)] mb-5 shadow-xs anim-up d1">
          <button
            onClick={() => { playTap(); setActiveTab('practice') }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20'
                : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
            }`}
          >
            🎮 Mode Berlatih
          </button>
          <button
            onClick={() => { playTap(); setActiveTab('chart') }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20'
                : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
            }`}
          >
            🔊 Tabel & Audio Kana
          </button>
        </div>

        {/* Type Toggle: [ Hiragana あ ] | [ Katakana ア ] | [ Gabungan あ/ア ] */}
        <div className="flex gap-2 mb-5 anim-up d1">
          {[
            { key: 'hiragana', label: 'Hiragana あ', color: 'var(--color-accent)' },
            { key: 'katakana', label: 'Katakana ア', color: '#a855f7' },
            { key: 'both',     label: 'Gabungan あ/ア', color: 'var(--color-green)' },
          ].map(t => {
            const isActive = activeType === t.key
            return (
              <button 
                key={t.key} 
                onClick={() => { playTap(); setActiveType(t.key as any) }}
                className={`flex-1 rounded-2xl py-3 font-extrabold text-xs transition-all active:scale-95 cursor-pointer ${
                  isActive ? 'shadow-md text-white' : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)]'
                }`}
                style={{
                  background: isActive ? t.color : undefined,
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'practice' ? (
          <>
            {/* Overall Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-5 anim-up d1">
              {[
                { label: 'Hafal',  val: stats.mastered, color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
                { label: 'Proses', val: stats.learning, color: '#a855f7',             bg: '#faf0ff' },
                { label: 'Baru',   val: stats.new,      color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                { label: 'Review', val: stats.due,      color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl py-3 text-center border border-[var(--color-border)]/50" style={{ background: s.bg }}>
                  <p className="text-lg font-black" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-2)]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Mode selector card */}
            <div className="rounded-3xl p-5 mb-5 anim-up d2 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-3">
                Pilih Mode Kuis
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { key: 'all',        icon: '📚', label: 'Semua Karakter', desc: `${KANA.length} karakter acak` },
                  { key: 'confusable', icon: '🤔', label: 'Karakter Mirip (Confusable)', desc: 'Latih huruf yang bentuknya sering tertukar (さ/ち, シ/ツ, ソ/ン, ぬ/め, ろ/る)' },
                  { key: 'custom',     icon: '🎯', label: 'Pilih Baris/Grup Spesiifk', desc: 'Fokus ke baris tertentu (Vokal, K-row, S-row, dll.)' },
                  { key: 'refresh',    icon: '🔄', label: 'Penyegaran Review', desc: refreshCount > 0 ? `${refreshCount} karakter siap direview` : 'Belum ada yang perlu direview saat ini' },
                ].map(m => {
                  const isSelected = mode === m.key
                  const isDisabled = m.key === 'refresh' && refreshCount === 0
                  return (
                    <button 
                      key={m.key} 
                      onClick={() => { playTap(); setMode(m.key as typeof mode) }}
                      disabled={isDisabled}
                      className={`flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98] border cursor-pointer ${
                        isSelected 
                          ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)]' 
                          : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-2xl shrink-0">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-1)]'}`}>
                          {m.label}
                        </p>
                        <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5 leading-relaxed truncate">
                          {m.desc}
                        </p>
                      </div>
                      {isSelected && <span className="text-[var(--color-accent)] font-black text-sm">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Group picker (only in custom mode) */}
            {mode === 'custom' && (
              <div className="rounded-3xl p-5 mb-5 anim-down bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)]">
                    Pilih Baris / Grup Karakter
                  </p>
                  <button 
                    onClick={() => { playTap(); setSelectedGroups(new Set(GROUPS.map(g => g.key))) }}
                    className="text-xs font-extrabold text-[var(--color-accent)] cursor-pointer hover:underline"
                  >
                    Pilih Semua
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {GROUPS.map(g => {
                    const typeToStat: KanaType = activeType === 'both' ? 'hiragana' : activeType
                    const gs = groupStats(g.key, typeToStat)
                    const pct = Math.round((gs.mastered / gs.total) * 100)
                    const sel = selectedGroups.has(g.key)
                    return (
                      <button 
                        key={g.key} 
                        onClick={() => { playTap(); toggleGroup(g.key) }}
                        className={`rounded-2xl p-3 text-left transition-all active:scale-95 border cursor-pointer ${
                          sel 
                            ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)]' 
                            : 'bg-[var(--color-bg)] border-[var(--color-border)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`jp text-sm font-black ${sel ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-1)]'}`}>
                            {g.short}
                          </span>
                          <span className="text-[10px] font-extrabold text-[var(--color-text-3)]">{pct}%</span>
                        </div>
                        <p className="text-[11px] font-bold text-[var(--color-text-2)] mb-2">{g.label}</p>
                        <div className="rounded-full overflow-hidden h-1 bg-[var(--color-subtle)]">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-green)' : 'var(--color-accent)' }} 
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Start Button */}
            <button 
              onClick={startQuiz}
              disabled={mode === 'custom' && selectedGroups.size === 0}
              className="w-full rounded-2xl py-4 text-sm font-extrabold active:scale-95 transition-transform mb-6 text-white cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 8px 24px rgba(91,94,244,0.3)',
              }}
            >
              {mode === 'refresh' ? `🔄 Mulai Penyegaran (${refreshCount})` : '🚀 Mulai Kuis Kana →'}
            </button>

            {/* Per-group progress overview */}
            <div className="rounded-3xl p-5 mb-6 anim-up d3 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-3">
                Progress Per Baris
              </p>
              <div className="space-y-3">
                {GROUPS.map(g => {
                  const typeToStat: KanaType = activeType === 'both' ? 'hiragana' : activeType
                  const gs = groupStats(g.key, typeToStat)
                  const pct = gs.pct
                  const barCol = pct >= 80 ? 'var(--color-green)' : pct > 0 ? 'var(--color-accent)' : 'var(--color-text-3)'
                  return (
                    <div key={g.key} className="flex items-center gap-3">
                      <span className="jp text-sm font-black w-9 shrink-0 text-center text-[var(--color-text-1)]">
                        {g.short}
                      </span>
                      <div className="flex-1 rounded-full overflow-hidden h-2.5 bg-[var(--color-subtle)]">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%`, background: barCol }} 
                        />
                      </div>
                      <span className="text-xs font-black w-14 text-right" style={{ color: barCol }}>
                        {gs.mastered}/{gs.total}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          /* Interactive Kana Character Chart & Audio Explorer */
          <div className="space-y-5 anim-fade-in">
            {/* Filter by Group */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0 select-none">
              <button
                onClick={() => { playTap(); setSelectedGroupFilter('all') }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold border transition-all shrink-0 cursor-pointer ${
                  selectedGroupFilter === 'all'
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-xs'
                    : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border-[var(--color-border)]'
                }`}
              >
                Semua Baris
              </button>
              {GROUPS.map(g => (
                <button
                  key={g.key}
                  onClick={() => { playTap(); setSelectedGroupFilter(g.key) }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold border transition-all shrink-0 cursor-pointer ${
                    selectedGroupFilter === g.key
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-xs'
                      : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] border-[var(--color-border)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-bold text-[var(--color-text-2)]">
              💡 Tekan pada kartu huruf mana saja untuk mendengarkan suara pelafalannya:
            </p>

            {/* Grid of Interactive Kana Cards */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
              {filteredKanaChart.map(card => {
                const charToShow = activeType === 'katakana' ? card.katakana : card.hiragana
                const typeToStat: KanaType = activeType === 'katakana' ? 'katakana' : 'hiragana'
                const wp = getWordProgress(srsStore, kanaId(card.id, typeToStat))
                const isPlaying = playingChar === charToShow

                return (
                  <button
                    key={card.id}
                    onClick={() => handlePlayAudio(charToShow)}
                    className={`rounded-2xl p-3 flex flex-col items-center justify-center border transition-all cursor-pointer relative active:scale-90 shadow-xs ${
                      isPlaying 
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] scale-105 shadow-md' 
                        : 'bg-white dark:bg-[#1a1d24] border-[var(--color-border)] hover:border-[var(--color-accent)]'
                    }`}
                  >
                    <span className="jp text-3xl font-black text-[var(--color-text-1)] leading-tight">
                      {charToShow}
                    </span>
                    <span className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-wider uppercase mt-0.5">
                      {card.romaji}
                    </span>
                    <span className="absolute top-1.5 right-1.5 text-[8px]">
                      {wp.level >= MASTERED_LEVEL ? '✅' : wp.level > 0 ? '🟡' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>
      
      {/* Sticky Bottom Nav */}
      <BottomNav />
    </div>
  )
}
