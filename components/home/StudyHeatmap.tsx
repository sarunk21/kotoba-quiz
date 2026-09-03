'use client'

import React, { useMemo } from 'react'
import { getLocalDateString } from '@/lib/dateUtils'

export const StudyHeatmap = React.memo(function StudyHeatmap({ history }: { history: Record<string, number> }) {
  const { dates } = useMemo(() => {
    const today = new Date()
    const daysToShow = 12 * 7
    const endDay = new Date(today)
    endDay.setDate(today.getDate() + (6 - today.getDay()))
    const startDay = new Date(endDay)
    startDay.setDate(endDay.getDate() - daysToShow + 1)
    const arr: Date[] = []
    for (let i = 0; i < daysToShow; i++) { const d = new Date(startDay); d.setDate(startDay.getDate() + i); arr.push(d) }
    return { dates: arr }
  }, [history])

  return (
    <div className="rounded-3xl p-5 mb-4 border border-[var(--color-border)] bg-[var(--color-surface)] anim-up d1" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-4">Grafik Aktivitas Belajar</p>
      <div className="flex items-start gap-2 justify-center select-none">
        <div className="grid grid-rows-7 gap-1.5 text-[8px] font-black text-[var(--color-text-3)] h-[116px] leading-[10px] pr-1 pt-1 justify-items-end shrink-0">
          <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto no-scrollbar h-[116px] pt-1">
          {dates.map(date => {
            const dateStr = getLocalDateString(date)
            const count = history[dateStr] || 0
            let bg = 'bg-[var(--color-border-light)]'
            let levelTitle = '0 kuis'
            if (count > 0 && count <= 5) {
              bg = 'bg-[var(--color-indigo-light)] border border-[var(--color-border-light)]'
              levelTitle = `${count} kuis`
            } else if (count > 5 && count <= 15) {
              bg = 'bg-[var(--color-indigo)]/60'
              levelTitle = `${count} kuis`
            } else if (count > 15) {
              bg = 'bg-[var(--color-indigo)]'
              levelTitle = `${count} kuis`
            }
            const formattedDate = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })
            return (
              <div key={dateStr} className={`w-3.5 h-3.5 rounded-[4px] ${bg} transition-all duration-200 relative cursor-pointer`} title={`${formattedDate}: ${levelTitle}`} />
            )
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 pr-2 text-[9px] font-black text-[var(--color-text-3)]">
        <span>Kurang</span>
        <div className="w-2.5 h-2.5 rounded-[3px] bg-[var(--color-border-light)]" />
        <div className="w-2.5 h-2.5 rounded-[3px] bg-[var(--color-indigo-light)]" />
        <div className="w-2.5 h-2.5 rounded-[3px] bg-[var(--color-indigo)]/60" />
        <div className="w-2.5 h-2.5 rounded-[3px] bg-[var(--color-indigo)]" />
        <span>Lebih</span>
      </div>
    </div>
  )
})
