'use client'

import { ReactNode } from 'react'
import { IconClose, IconHeartFilled } from '@/components/ui/icons'

interface QuizHeaderProps {
 progress: number // 0–100
 lives: number
 livesEnabled?: boolean
 onClose: () => void
 badges?: ReactNode
}

export default function QuizHeader({
 progress,
 lives,
 livesEnabled = true,
 onClose,
 badges,
}: QuizHeaderProps) {
 return (
 <div className="px-4 pt-10 pb-3">
 {/* Top Row: Close button + Progress bar */}
 <div className="flex items-center gap-3 mb-3">
 <button
 onClick={onClose}
 className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 active:scale-95 transition-transform bg-[var(--color-surface)] text-[var(--color-text-2)] border border-[var(--color-border)] shadow-card cursor-pointer"
 aria-label="Tutup kuis"
 >
 <IconClose size={16} />
 </button>

 <div className="flex-1 rounded-full overflow-hidden h-2.5 bg-[var(--color-border-light)]">
 <div
 className="h-full rounded-full transition-all duration-500 bg-[var(--color-accent)]"
 style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
 />
 </div>
 </div>

 {/* Second Row: Hearts + Badges */}
 <div className="flex items-center justify-between min-h-[24px]">
 {livesEnabled ? (
 <div className="flex items-center gap-1">
 {[1, 2, 3].map(i => (
 <span
 key={i}
 className={`transition-all duration-300 ${
 i <= lives
 ? 'text-[var(--color-accent)] opacity-100 scale-100'
 : 'text-[var(--color-text-3)] opacity-30 scale-90'
 }`}
 >
 <IconHeartFilled size={18} />
 </span>
 ))}
 </div>
 ) : <div />}

 {badges && <div className="flex items-center gap-1.5">{badges}</div>}
 </div>
 </div>
 )
}
