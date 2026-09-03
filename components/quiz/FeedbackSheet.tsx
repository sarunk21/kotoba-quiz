'use client'

import { ReactNode } from 'react'

interface FeedbackSheetProps {
 isCorrect: boolean
 statusText: string
 detail?: ReactNode
 children?: ReactNode
 nextLabel?: string
 onNext: () => void
}

export default function FeedbackSheet({
 isCorrect,
 statusText,
 detail,
 children,
 nextLabel = 'Lanjut →',
 onNext,
}: FeedbackSheetProps) {
 return (
 <div
 className="fixed bottom-0 left-0 right-0 z-[160] anim-up shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl border-t rounded-t-[32px]"
 style={{
 background: isCorrect ? 'var(--color-green-light)' : 'var(--color-red-light)',
 borderColor: isCorrect ? 'rgba(45,143,90,0.3)' : 'rgba(214,69,65,0.3)',
 }}
 >
 <div className="max-w-sm md:max-w-2xl mx-auto px-5 pt-5 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-3">
 {/* Status Header */}
 <div className="flex items-start gap-2">
 <p
 className="font-extrabold text-base leading-tight flex-1"
 style={{ color: isCorrect ? 'var(--color-green-dark)' : 'var(--color-red-dark)' }}
 >
 {statusText}
 </p>
 </div>

 {/* Detail (e.g. "Naik level → review 3 hari lagi" / correct answer) */}
 {detail && (
 <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
 {detail}
 </p>
 )}

 {/* Extra content (example sentence, explanation) */}
 {children && (
 <div className="pt-3 border-t border-black/8/8">
 {children}
 </div>
 )}

 {/* Next Button */}
 <button
 onClick={onNext}
 className="w-full rounded-2xl py-3.5 px-6 text-sm font-extrabold text-white active:scale-95 transition-all text-center shadow-md cursor-pointer"
 style={{
 background: isCorrect ? 'var(--color-green)' : 'var(--color-red)',
 boxShadow: isCorrect
 ? '0 4px 14px rgba(45,143,90,0.35)'
 : '0 4px 14px rgba(214,69,65,0.35)',
 }}
 >
 {nextLabel}
 </button>
 </div>
 </div>
 )
}
