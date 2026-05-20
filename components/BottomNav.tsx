'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Beranda', path: '/', icon: '🏠' },
    { name: 'Kamus', path: '/progress', icon: '📖' },
    { name: 'Karakter', path: '/kana', icon: 'あ' },
    { name: 'Pengaturan', path: '/settings', icon: '⚙️' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 select-none">
      <div 
        className="w-full max-w-sm rounded-[28px] flex items-center justify-around py-3.5 px-3 border border-[var(--color-border)] bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all duration-300"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.path
          return (
            <Link 
              key={tab.path} 
              href={tab.path}
              className="flex flex-col items-center justify-center gap-1 select-none no-underline flex-1 py-1 relative transition-transform active:scale-95"
            >
              <div 
                className={`text-xl transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-50 scale-100 hover:opacity-75'}`}
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
                }}
              >
                {tab.icon}
              </div>
              <span 
                className="text-[9px] font-black tracking-wider transition-colors duration-200 uppercase"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {tab.name}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div 
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'var(--color-accent)',
                    boxShadow: '0 2px 6px rgba(91, 94, 244, 0.4)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
