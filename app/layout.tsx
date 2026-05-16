import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '言葉カード — Kotoba Quiz',
  description: 'Latihan kosakata Jepang harian dengan flashcard',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '言葉カード',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="noise-bg">
        <div className="relative z-10 min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  )
}
