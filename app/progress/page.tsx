'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProgressRedirectPage() {
 const router = useRouter()

 useEffect(() => {
 router.replace('/vocab')
 }, [router])

 return (
 <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
 <div className="text-center">
 <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
 <p className="text-xs font-bold text-[var(--color-text-2)]">Mengalihkan ke Kamus & Kosakata...</p>
 </div>
 </div>
 )
}
