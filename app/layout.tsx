import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import AppInitializer from '@/components/AppInitializer'

export const metadata: Metadata = {
 title: '言葉カード — Kotoba Quiz',
 description: 'Latihan kosakata Jepang harian dengan flashcard',
 manifest: '/manifest.json',
 icons: {
 icon: [
 { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
 { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
 ],
 shortcut: '/icons/favicon.ico',
 apple: '/icons/apple-touch-icon.png',
 },
 appleWebApp: {
 capable: true,
 statusBarStyle: 'default',
 title: '言葉カード',
 },
}

export const viewport: Viewport = {
 width: 'device-width', initialScale: 1, maximumScale: 1,
 userScalable: false, themeColor: '#f5f0e8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="ja" suppressHydrationWarning>
 <head>
 <script dangerouslySetInnerHTML={{
 __html: `
 (function() {
 try {
 var theme = localStorage.getItem('kotoba_theme');
 var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 if (theme === 'dark' || (!theme && supportDark)) {
 document.documentElement.classList.add('dark');
 }
 } catch (e) {}
 })();
 `
 }} />
 </head>
 <body>
 <SessionProvider>
 <AppInitializer />
 {children}
 </SessionProvider>
 <script dangerouslySetInnerHTML={{
 __html: `
 if ('serviceWorker' in navigator) {
 window.addEventListener('load', function() {
 navigator.serviceWorker.register('/sw.js').then(function(reg) {
 console.log('SW registered');
 }).catch(function(err) {
 console.log('SW fail', err);
 });
 });
 }
 `
 }} />
 </body>
 </html>
 )
}
