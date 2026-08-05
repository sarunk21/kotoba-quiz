'use client'

import { useEffect, useState } from 'react'
import { subscribeProgress, type GenerateProgress } from '@/lib/backgroundGenerate'

export function GenerateProgressToast() {
  const [progress, setProgress] = useState<GenerateProgress | null>(null)

  useEffect(() => {
    const unsub = subscribeProgress(p => {
      setProgress(p.isRunning || p.done > 0 ? p : null)
    })
    return unsub
  }, [])

  // Dismiss after finish (3s)
  useEffect(() => {
    if (!progress) return
    if (!progress.isRunning && progress.done > 0) {
      const t = setTimeout(() => setProgress(null), 4000)
      return () => clearTimeout(t)
    }
  }, [progress?.isRunning, progress?.done])

  if (!progress) return null

  const isDone = !progress.isRunning && progress.done > 0
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm anim-up"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
        style={{
          background: isDone ? 'var(--color-green)' : 'var(--color-accent)',
          color: '#fff',
        }}
      >
        {/* Icon */}
        <span className="text-lg shrink-0">
          {isDone ? '✅' : progress.lastError ? '⚠️' : '✨'}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold leading-tight">
            {isDone
              ? `Selesai! ${progress.done} cerita tersimpan`
              : progress.lastError
              ? progress.lastError
              : `Generate cerita... ${progress.done}/${progress.total}`
            }
          </p>
          {!isDone && progress.currentChapter && (
            <p className="text-[10px] opacity-80 mt-0.5 truncate">
              {progress.currentChapter}
            </p>
          )}
        </div>

        {/* Progress pill */}
        {!isDone && (
          <span className="text-[10px] font-black shrink-0 bg-white/20 rounded-full px-2 py-0.5">
            {pct}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!isDone && progress.total > 0 && (
        <div className="mt-1.5 h-1 rounded-full overflow-hidden bg-white/20 mx-1">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
