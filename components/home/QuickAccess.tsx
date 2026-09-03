'use client'

import Link from 'next/link'

export function QuickAccess() {
  return (
    <div className="rounded-3xl p-4.5 mb-4 anim-up d2 border border-[var(--color-border)] bg-[var(--color-surface)]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)]">Quick Access & Modul Latihan</p>
        <Link href="/practice" className="text-[10px] font-extrabold text-[var(--color-accent)] no-underline hover:underline">
          Semua Latihan →
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Link href="/quiz/chapters" className="no-underline flex flex-col items-center justify-center p-3 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all active:scale-95 shadow-xs group">
          <span className="text-2xl mb-1 text-indigo-500 leading-none flex items-center justify-center h-7 group-hover:scale-110 transition-transform">📖</span>
          <span className="text-[9px] font-black text-[var(--color-text-1)] leading-tight">Kuis<br/>Per Bab</span>
        </Link>
        <Link href="/particles" className="no-underline flex flex-col items-center justify-center p-3 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all active:scale-95 shadow-xs group">
          <span className="text-2xl mb-1 text-amber-500 jp font-extrabold leading-none flex items-center justify-center h-7 group-hover:scale-110 transition-transform">助</span>
          <span className="text-[9px] font-black text-[var(--color-text-1)] leading-tight">Latihan<br/>Partikel</span>
        </Link>
        <Link href="/sentences" className="no-underline flex flex-col items-center justify-center p-3 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all active:scale-95 shadow-xs group">
          <span className="text-2xl mb-1 text-emerald-500 jp font-extrabold leading-none flex items-center justify-center h-7 group-hover:scale-110 transition-transform">文</span>
          <span className="text-[9px] font-black text-[var(--color-text-1)] leading-tight">Susun<br/>Kalimat</span>
        </Link>
        <Link href="/practice" className="no-underline flex flex-col items-center justify-center p-3 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all active:scale-95 shadow-xs group">
          <span className="text-2xl mb-1 text-blue-500 leading-none flex items-center justify-center h-7 group-hover:scale-110 transition-transform">📝</span>
          <span className="text-[9px] font-black text-[var(--color-text-1)] leading-tight">Soal<br/>Per Bab</span>
        </Link>
      </div>
    </div>
  )
}
