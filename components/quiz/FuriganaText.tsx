'use client'

import { addFuriganaToSentence } from '@/lib/vocab'

export function FuriganaText({ text, enabled = true, className = '' }: { text: string; enabled?: boolean; className?: string }) {
 if (!text) return null
 if (!enabled) return <span className={className}>{text}</span>
 const html = addFuriganaToSentence(text)
 return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
