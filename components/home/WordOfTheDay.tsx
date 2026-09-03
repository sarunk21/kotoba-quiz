'use client'

import { speakJapanese } from '@/lib/sounds'

export function WordOfTheDay({ word, isFlipped, onFlip }: { word: { kanji: string; hiragana: string; arti: string; category: string; chapter?: string } | null; isFlipped: boolean; onFlip: (v: boolean) => void }) {
  if (!word) return null
  return (
    <div className="perspective-container h-48 w-full mb-4 anim-up d2 relative">
      <div className={`flip-card-inner h-full w-full transition-transform duration-500 style-3d ${isFlipped ? 'flip-card-flipped' : ''}`}>
        <div className="flip-card-front h-full w-full rounded-3xl p-5 flex flex-col justify-between border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] flex items-center gap-1.5">
              <span className="text-base">✨</span> KATA HARI INI
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)]">
              {word.category}
            </span>
          </div>
          <div className="text-center my-auto flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-[var(--color-text-1)] jp-serif tracking-wide leading-none">
                {word.kanji || word.hiragana}
              </h2>
              <button onClick={(e) => { e.stopPropagation(); speakJapanese(word.hiragana || word.kanji) }} className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-90 transition-all text-[var(--color-text-2)] border border-[var(--color-border)] shrink-0" title="Putar Suara">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            </div>
            {word.kanji && word.kanji !== word.hiragana && (
              <p className="text-xs text-[var(--color-text-3)] mt-1.5 font-bold tracking-widest jp">{word.hiragana}</p>
            )}
          </div>
          <div className="flex justify-center mt-1">
            <button onClick={() => onFlip(true)} className="rounded-xl px-4 py-2 text-xs font-extrabold text-white bg-[var(--color-accent)] active:scale-95 transition-transform">
              Lihat Arti 🔍
            </button>
          </div>
        </div>
        <div className="flip-card-back h-full w-full rounded-3xl p-5 flex flex-col justify-between border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
              <span className="text-base">💡</span> ARTI KATA
            </span>
            {word.chapter && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)]">
                📖 {word.chapter}
              </span>
            )}
          </div>
          <div className="text-center my-auto px-2">
            <p className="text-base font-extrabold text-[var(--color-text-1)] leading-relaxed">
              {word.arti}
            </p>
          </div>
          <div className="flex justify-center">
            <button onClick={() => onFlip(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--color-text-2)] bg-[var(--color-bg)] active:scale-95 transition-transform">
              Balik ↩
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
