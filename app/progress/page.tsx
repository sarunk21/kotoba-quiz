'use client'

import Link from 'next/link'

export default function ProgressPage() {
 return (
 <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-6">
 <div className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] shadow-card p-8 max-w-sm w-full text-center anim-pop">
 <div className="w-12 h-12 rounded-2xl bg-[var(--color-indigo-light)] text-[var(--color-indigo)] flex items-center justify-center mx-auto mb-4 text-xl">📊</div>
 <h1 className="text-lg font-black text-[var(--color-text-1)]">Progress Kini di Kamus</h1>
 <p className="text-xs font-semibold text-[var(--color-text-2)] mt-2 leading-relaxed">
 Dashboard progress terpadu kini menyatu di <strong>Kosakata</strong> — lihat heatmap, status SRS & per bab di sana.
 </p>
 <Link href="/vocab" className="mt-6 inline-flex items-center justify-center w-full py-3 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white font-extrabold text-sm shadow-elevated active:scale-95 transition-transform">
 Lihat Kosakata →
 </Link>
 </div>
 </div>
 )
}
