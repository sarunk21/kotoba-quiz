import React from 'react'
import type { SentenceChunk } from '@/lib/stories'

const CHUNK_COLORS = [
 'bg-blue-100 text-blue-900',
 'bg-orange-100 text-orange-900',
 'bg-green-100 text-green-900',
 'bg-purple-100 text-purple-900',
 'bg-pink-100 text-pink-900',
]

interface ChunkedSubtitleProps {
 chunks: SentenceChunk[]
}

export function ChunkedSubtitle({ chunks }: ChunkedSubtitleProps) {
 if (!chunks || chunks.length === 0) return null
 
 return (
 <div className="flex flex-wrap justify-center gap-1.5 my-2">
 {chunks.map((chunk, i) => (
 <div
 key={i}
 className={`flex flex-col items-center px-2 py-1.5 rounded-lg ${CHUNK_COLORS[i % CHUNK_COLORS.length]}`}
 style={{ minWidth: '2.5rem' }}
 >
 <span className="text-xl font-bold leading-none mb-0.5" style={{ color: 'inherit' }}>
 {chunk.text}
 </span>
 <span className="text-[10px] font-semibold opacity-70 leading-none">
 {chunk.romaji}
 </span>
 </div>
 ))}
 </div>
 )
}
