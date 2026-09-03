'use client'

import { IconTarget, IconBolt, IconHome } from '@/components/ui/icons'

interface ResultScreenProps {
 correct: number
 total: number
 emoji: string
 title: string
 subtitle?: string
 onRetry?: () => void
 retryLabel?: string
 onHome: () => void
 homeLabel?: string
}

export default function ResultScreen({
 correct,
 total,
 emoji,
 title,
 subtitle,
 onRetry,
 retryLabel = 'Berlatih lagi',
 onHome,
 homeLabel = 'Kembali ke beranda',
}: ResultScreenProps) {
 const pct = total > 0 ? Math.round((correct / total) * 100) : 0

 return (
 <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto px-4 py-14" style={{ background: 'var(--color-bg)' }}>
 <div className="anim-pop flex-1 flex flex-col">
 {/* Emoji + Title */}
 <div className="text-center mb-8">
 <div className="text-6xl mb-4">{emoji}</div>
 <h2 className="font-extrabold mb-2" style={{ fontSize: '1.4rem', color: 'var(--color-text-1)' }}>
 {title}
 </h2>
 {subtitle && (
 <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>
 {subtitle}
 </p>
 )}
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-3 gap-3 mb-6">
 {[
 {
 icon: <IconTarget size={20} />,
 val: `${correct}/${total}`,
 label: 'Benar',
 color: 'var(--color-green)',
 bg: 'var(--color-green-light)',
 },
 {
 icon: <IconBolt size={20} />,
 val: '+1',
 label: 'Sesi',
 color: 'var(--color-amber)',
 bg: 'var(--color-amber-light)',
 },
 {
 icon: <span style={{ fontSize: 20, fontWeight: 900 }}>%</span>,
 val: `${pct}%`,
 label: 'Akurasi',
 color: 'var(--color-accent)',
 bg: 'var(--color-accent-light)',
 },
 ].map(s => (
 <div
 key={s.label}
 className="rounded-[20px] py-4 text-center"
 style={{ background: s.bg }}
 >
 <div
 className="flex items-center justify-center mb-1"
 style={{ color: s.color }}
 >
 {s.icon}
 </div>
 <p className="text-lg font-extrabold" style={{ color: s.color }}>
 {s.val}
 </p>
 <p className="text-[10px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: 'var(--color-text-2)' }}>
 {s.label}
 </p>
 </div>
 ))}
 </div>

 {/* Action Buttons */}
 <div className="flex flex-col gap-2.5 mt-auto">
 {onRetry && (
 <button
 onClick={onRetry}
 className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
 style={{
 background: 'var(--color-accent)',
 color: '#fff',
 boxShadow: '0 8px 20px var(--color-accent-glow)',
 }}
 >
 {retryLabel}
 </button>
 )}
 <button
 onClick={onHome}
 className="w-full rounded-2xl py-4 text-base font-bold active:scale-95 transition-transform bg-[var(--color-surface)] border border-[var(--color-border)]"
 style={{ color: 'var(--color-text-2)' }}
 >
 {homeLabel}
 </button>
 </div>
 </div>
 </div>
 )
}
