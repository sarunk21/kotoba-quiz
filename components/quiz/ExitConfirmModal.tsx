'use client'

import { IconWarning, IconClose } from '@/components/ui/icons'

interface ExitConfirmModalProps {
 open: boolean
 title?: string
 desc?: string
 cancelLabel?: string
 exitLabel?: string
 onCancel: () => void
 onExit: () => void
}

export default function ExitConfirmModal({
 open,
 title = 'Keluar dari Kuis?',
 desc = 'Progres kuis sesi ini akan disimpan sebelum Anda keluar.',
 cancelLabel = 'Lanjutkan Kuis',
 exitLabel = 'Ya, Keluar',
 onCancel,
 onExit,
}: ExitConfirmModalProps) {
 if (!open) return null

 return (
 <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm anim-fade">
 <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[28px] p-7 max-w-[300px] w-full shadow-[var(--shadow-float)] text-center anim-pop">
 {/* Warning icon */}
 <div
 className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
 style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}
 >
 <IconWarning size={24} />
 </div>

 <h3
 className="text-base font-black mb-1"
 style={{ color: 'var(--color-text-1)' }}
 >
 {title}
 </h3>
 <p
 className="text-xs font-semibold mb-6 leading-relaxed"
 style={{ color: 'var(--color-text-2)' }}
 >
 {desc}
 </p>

 <div className="flex flex-col gap-2.5">
 <button
 onClick={onCancel}
 className="w-full py-3 rounded-xl font-extrabold text-xs active:scale-95 transition-all cursor-pointer"
 style={{
 background: 'var(--color-accent)',
 color: '#fff',
 boxShadow: '0 2px 8px var(--color-accent-glow)',
 }}
 >
 {cancelLabel}
 </button>
 <button
 onClick={onExit}
 className="w-full py-3 rounded-xl font-extrabold text-xs bg-[var(--color-surface-hover)] text-[var(--color-red)] active:scale-95 transition-all cursor-pointer"
 >
 {exitLabel}
 </button>
 </div>
 </div>
 </div>
 )
}
