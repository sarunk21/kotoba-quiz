'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { loadStats, type GameStats } from '@/lib/stats'
import { getLocalDateString, parseLocalDateString } from '@/lib/dateUtils'
import { playTap } from '@/lib/sounds'

const WEEKDAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365]

interface StreakWidgetProps {
  onStartPractice?: () => void
}

export default function StreakWidget({ onStartPractice }: StreakWidgetProps) {
  const [stats, setStats] = useState<GameStats | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Load stats and register event listener for instant reactivity
  useEffect(() => {
    setIsClient(true)
    setStats(loadStats())

    const handleUpdate = () => {
      setStats(loadStats())
    }

    window.addEventListener('kotoba_streak_updated', handleUpdate)
    window.addEventListener('focus', handleUpdate)

    return () => {
      window.removeEventListener('kotoba_streak_updated', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
    }
  }, [])

  const todayStr = useMemo(() => getLocalDateString(), [])
  const isTodayDone = useMemo(() => {
    if (!stats || !stats.lastPlayedDate) return false
    return stats.lastPlayedDate === todayStr
  }, [stats, todayStr])

  // Weekly 7-day calculation
  const weeklyData = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday
    const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const activeDays = new Array(7).fill(false)

    if (stats && stats.currentStreak > 0 && stats.lastPlayedDate) {
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      const yesterdayStr = getLocalDateString(yesterday)

      const isStreakValid = stats.lastPlayedDate === todayStr || stats.lastPlayedDate === yesterdayStr

      if (isStreakValid) {
        const lastPlayed = parseLocalDateString(stats.lastPlayedDate)
        for (let i = 0; i < stats.currentStreak; i++) {
          const d = new Date(lastPlayed)
          d.setDate(lastPlayed.getDate() - i)
          const dow = d.getDay()
          const mIdx = dow === 0 ? 6 : dow - 1

          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - mondayIndex)
          startOfWeek.setHours(0, 0, 0, 0)

          if (d >= startOfWeek) {
            activeDays[mIdx] = true
          }
        }
      }
    }

    return WEEKDAY_NAMES.map((label, idx) => ({
      label,
      active: activeDays[idx],
      isToday: idx === mondayIndex,
    }))
  }, [stats, todayStr])

  // Next Milestone calculation
  const nextMilestone = useMemo(() => {
    const current = stats?.currentStreak || 0
    const next = STREAK_MILESTONES.find(m => m > current) || current + 10
    const prev = [...STREAK_MILESTONES].reverse().find(m => m <= current) || 0
    const range = next - prev
    const progress = Math.min(Math.max((current - prev) / (range || 1), 0), 1)
    const remaining = Math.max(next - current, 0)

    return {
      target: next,
      remaining,
      progressPct: Math.round(progress * 100),
    }
  }, [stats])

  if (!isClient || !stats) {
    return (
      <div className="rounded-3xl p-5 mb-4 border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] animate-pulse">
        <div className="h-20 bg-[var(--color-subtle)] rounded-2xl mb-3" />
        <div className="h-12 bg-[var(--color-subtle)] rounded-2xl" />
      </div>
    )
  }

  const currentStreak = stats.currentStreak || 0

  return (
    <div
      className="rounded-3xl p-5 mb-5 border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] shadow-sm relative overflow-hidden transition-all anim-up"
    >
      {/* Background ambient glow when streak is active */}
      {isTodayDone && (
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Main Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Animated Flame Badge */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border transition-transform ${
              isTodayDone
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white border-amber-300 shadow-orange-500/20 scale-105'
                : currentStreak > 0
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-200 dark:border-amber-900/40'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
            }`}
          >
            <span className={isTodayDone ? 'animate-pulse' : ''}>🔥</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-[var(--color-text-1)] leading-tight">
                {currentStreak} Hari Beruntun
              </h3>
              {isTodayDone ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  Aktif Hari Ini ✨
                </span>
              ) : currentStreak > 0 ? (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 animate-pulse">
                  Perlu Latihan ⚠️
                </span>
              ) : (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[var(--color-text-3)] border border-[var(--color-border)]">
                  Mulai Streak
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-2)] mt-0.5">
              {isTodayDone
                ? 'Streak harianmu aman! Pertahankan ritme belajarmu.'
                : currentStreak > 0
                ? 'Selesaikan 1 kuis hari ini agar api streak tidak padam!'
                : 'Mulai latihan hari ini untuk menyalakan api pertamamu!'}
            </p>
          </div>
        </div>

        {/* Highest Streak Info */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[9px] font-bold uppercase text-[var(--color-text-3)]">Rekor Terbaik</p>
          <p className="text-xs font-black text-[var(--color-text-1)]">{stats.longestStreak} Hari 🏆</p>
        </div>
      </div>

      {/* 7-Day Weekly Dot Tracker */}
      <div className="bg-[var(--color-bg)] rounded-2xl p-3.5 border border-[var(--color-border)] mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-3)]">
            Aktivitas Minggu Ini
          </span>
          <span className="text-[10px] font-bold text-[var(--color-text-2)]">
            Rekor: <strong className="text-[var(--color-text-1)]">{stats.longestStreak} Hari</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-bold text-[var(--color-text-3)]">
                {d.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                  d.active
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/20 scale-105'
                    : d.isToday
                    ? 'bg-white dark:bg-[#1a1d24] text-[var(--color-accent)] border-2 border-dashed border-[var(--color-accent)]'
                    : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-3)] border border-[var(--color-border)] opacity-60'
                }`}
              >
                {d.active ? '✓' : d.isToday ? '•' : '○'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Progression Bar & CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Milestone Bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
            <span className="text-[var(--color-text-2)] flex items-center gap-1">
              <span>🎯</span> Target Berikutnya: <strong className="text-[var(--color-text-1)]">{nextMilestone.target} Hari</strong>
            </span>
            <span className="text-[var(--color-accent)] font-extrabold">
              {nextMilestone.remaining === 0 ? 'Tercapai! 🎉' : `Tersisa ${nextMilestone.remaining} hari`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-subtle)] overflow-hidden border border-[var(--color-border)]">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-[var(--color-accent)] rounded-full transition-all duration-500"
              style={{ width: `${nextMilestone.progressPct}%` }}
            />
          </div>
        </div>

        {/* Action Button (if not completed today) */}
        {!isTodayDone && (
          <Link
            href="/quiz"
            onClick={() => {
              playTap()
              if (onStartPractice) onStartPractice()
            }}
            className="rounded-xl px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm active:scale-95 transition-all text-center no-underline shrink-0 flex items-center justify-center gap-1.5"
          >
            <span>Latihan Sekarang</span>
            <span>➔</span>
          </Link>
        )}
      </div>
    </div>
  )
}
