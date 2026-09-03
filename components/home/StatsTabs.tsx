'use client'

import Link from 'next/link'
import type { SRSStore } from '@/lib/srs'

export function StatsTabs({ srs, kanaSrs, kanjiSrs, noVocab, activeTab, setActiveTab }: { srs: any; kanaSrs: any; kanjiSrs: any; noVocab: boolean; activeTab: string; setActiveTab: (v: string) => void }) {
  if (!srs) return null
  const tabs = [
    { key: 'vocab', label: 'Kosakata', available: !noVocab },
    { key: 'kanji', label: 'Kanji', available: !!kanjiSrs },
    { key: 'kana', label: 'Kana', available: true }
  ]
  let currentSrs = srs
  let linkUrl = '/progress'
  let linkText = 'Lihat semua →'
  let title = 'Status Kosakata'
  if (activeTab === 'kanji' && kanjiSrs) {
    currentSrs = kanjiSrs
    linkUrl = '/quiz?mode=kanji'
    linkText = 'Berlatih kanji →'
    title = 'Status Kanji'
  } else if (activeTab === 'kana') {
    currentSrs = kanaSrs
    linkUrl = '/kana'
    linkText = 'Berlatih kana →'
    title = 'Status Kana'
  }
  return (
    <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-surface)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex border-b border-[var(--color-border)] p-1 bg-[var(--color-bg)]/40">
        {tabs.map(tab => {
          if (!tab.available) return null
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 text-center py-2.5 text-xs font-black rounded-2xl transition-all ${isActive ? 'shadow-sm bg-[var(--color-surface)]' : 'opacity-60'}`} style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)' }}>
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="font-extrabold text-sm" style={{ color: 'var(--color-text-1)' }}>{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-subtle)' }}>
              <div className="h-full transition-all duration-700" style={{ width: `${currentSrs.pct}%`, background: currentSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }} />
            </div>
            <span className="text-[10px] font-black" style={{ color: currentSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }}>{currentSrs.pct}%</span>
            {currentSrs.accuracyPct > 0 && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[var(--color-green-light)] text-[var(--color-green)]">
                🎯 {currentSrs.accuracyPct}% Akurasi
              </span>
            )}
          </div>
        </div>
        <Link href={linkUrl} className="text-xs font-bold no-underline" style={{ color: 'var(--color-accent)' }}>{linkText}</Link>
      </div>
      <div className="grid grid-cols-4 gap-2 px-3 pb-4">
        {[
          { label: 'Review', val: currentSrs.dueCount, color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
          { label: 'Baru', val: currentSrs.newCount, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
          { label: 'Proses', val: currentSrs.learningCount, color: '#a855f7', bg: '#faf0ff' },
          { label: 'Hafal', val: currentSrs.masteredCount, color: 'var(--color-green)', bg: 'var(--color-green-light)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl py-3 text-center transition-all duration-200" style={{ background: s.bg }}>
            <p className="text-base font-extrabold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
