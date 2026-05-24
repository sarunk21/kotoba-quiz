'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PARTICLE_GUIDE_DATA } from '@/lib/particles-guide-data'
import { playTap, speakJapanese } from '@/lib/sounds'

export default function ParticleGuidePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get list of all particle symbols for the quick filter tags
  const tags = useMemo(() => {
    return PARTICLE_GUIDE_DATA.map(item => item.particle)
  }, [])

  // Filter particle data based on search and selected tag
  const filteredData = useMemo(() => {
    return PARTICLE_GUIDE_DATA.filter(item => {
      const matchesSearch = 
        item.particle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.romaji.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTag = selectedTag ? item.particle === selectedTag : true

      return matchesSearch && matchesTag
    })
  }, [searchQuery, selectedTag])

  const handleTagClick = (tag: string) => {
    playTap()
    if (selectedTag === tag) {
      setSelectedTag(null) // deselect
    } else {
      setSelectedTag(tag)
    }
  }

  const handleClearFilters = () => {
    playTap()
    setSearchQuery('')
    setSelectedTag(null)
  }

  const handlePlayVoice = (text: string) => {
    speakJapanese(text)
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-md mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
        {/* Header Navigation */}
        <header className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => {
              playTap()
              router.push('/particles')
            }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform shrink-0"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Panduan Partikel</h1>
            <p className="text-xs font-semibold text-[var(--color-text-2)]">Kamus & Cara Penggunaan Tata Bahasa</p>
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Cari partikel (misal: 'wa', 'no', 'を')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl py-3 px-4 text-xs font-semibold bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-subtle)] text-[var(--color-text-3)] text-[10px] font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Selection Tags */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar shrink-0 select-none">
          <button
            onClick={() => {
              playTap()
              setSelectedTag(null)
            }}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all active:scale-95 shrink-0 ${
              selectedTag === null
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border-[var(--color-border)]'
            }`}
          >
            Semua
          </button>
          {tags.map((tag) => {
            const isSelected = selectedTag === tag
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`rounded-xl px-4 py-2 text-xs font-black border transition-all active:scale-95 shrink-0 jp ${
                  isSelected
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                    : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] border-[var(--color-border)]'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Guide Cards List */}
        <div className="space-y-5 flex-1">
          {filteredData.length === 0 ? (
            <div className="my-auto py-12 text-center rounded-[32px] bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] p-6">
              <span className="text-4xl mb-3 block">🔍</span>
              <p className="text-sm font-extrabold text-[var(--color-text-1)]">Partikel Tidak Ditemukan</p>
              <p className="text-xs font-semibold text-[var(--color-text-2)] mt-1 mb-4">
                Tidak ada hasil pencarian yang cocok dengan filter Anda.
              </p>
              <button
                onClick={handleClearFilters}
                className="rounded-xl px-4 py-2 text-xs font-bold bg-[var(--color-accent)] text-white active:scale-95 transition-transform"
              >
                Reset Filter 🔄
              </button>
            </div>
          ) : (
            filteredData.map((item) => (
              <article 
                key={item.id}
                className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[28px] p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Big Background Symbol Decoration */}
                <span className="absolute -top-6 -right-6 text-7xl font-black text-gray-100/40 dark:text-gray-800/10 jp select-none pointer-events-none">
                  {item.particle}
                </span>

                {/* Particle Heading */}
                <header className="flex items-center gap-3.5 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-light)] flex items-center justify-center border border-[var(--color-accent)]">
                    <span className="text-2xl font-black text-[var(--color-accent)] jp leading-none">
                      {item.particle}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-[var(--color-text-1)] leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider">
                      Partikel {item.romaji}
                    </p>
                  </div>
                </header>

                <p className="text-xs font-bold text-[var(--color-text-2)] mb-4 leading-relaxed">
                  {item.description}
                </p>

                {/* Divider */}
                <div className="h-[1.5px] w-full bg-[var(--color-border)] my-4" />

                {/* Example Sentences */}
                <div>
                  <h3 className="text-[10px] font-black text-[var(--color-text-3)] uppercase tracking-wider mb-3">
                    Contoh Penggunaan & Kalimat:
                  </h3>
                  <div className="space-y-3.5">
                    {item.usages.map((usage, idx) => (
                      <div 
                        key={idx}
                        className="rounded-xl p-3 bg-[var(--color-bg)] border border-[var(--color-border)]"
                      >
                        <p className="text-[10px] font-black text-[var(--color-text-2)] mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
                          {usage.title}
                        </p>
                        
                        {/* Playable Sentence Row */}
                        <button
                          onClick={() => handlePlayVoice(usage.exampleJp)}
                          className="w-full text-left bg-white/60 hover:bg-white dark:bg-[#1a1d24]/60 dark:hover:bg-[#1a1d24] border border-[var(--color-border)] rounded-lg p-2 flex items-center justify-between gap-3 group active:scale-[0.99] transition-all cursor-pointer mb-2"
                          title="Klik untuk mendengar suara pelafalan"
                        >
                          <span className="text-sm font-extrabold text-[var(--color-text-1)] jp tracking-wide leading-relaxed">
                            {usage.exampleJp}
                          </span>
                          <span className="text-xs flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                            🔊
                          </span>
                        </button>

                        <p className="text-[10px] font-semibold text-[var(--color-text-2)] italic mb-1 pl-1">
                          &quot;{usage.exampleRomaji}&quot;
                        </p>
                        
                        <p className="text-xs font-bold text-[var(--color-text-1)] pl-1">
                          Arti: {usage.exampleId}
                        </p>

                        <div className="mt-2 text-[9px] font-semibold text-[var(--color-text-3)] leading-relaxed pl-1 border-l-2 border-[var(--color-border)]">
                          {usage.note}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
