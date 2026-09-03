import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kotobaquiz.app',
  appName: 'Kotoba Quiz',
  // Next.js App Router output di .next (bukan public) — public hanya static.
  // Saat server.url diisi, native load dari URL live (hybrid), webDir tidak dipakai tapi tetap wajib.
  webDir: 'public',
  server: {
    // URL live — ganti via env CAPACITOR_SERVER_URL jika deploy pindah.
    // Untuk emulator lokal: 'http://10.0.2.2:3000'
    url: process.env.CAPACITOR_SERVER_URL || 'https://kotoba-quiz-gilt.vercel.app',
    allowNavigation: [
      'kotoba-quiz-gilt.vercel.app',
      '*.vercel.app',
      'accounts.google.com',
      '*.googleusercontent.com'
    ]
  },
  ios: {
    // Override User-Agent agar Google OAuth mengizinkan sign-in (tidak memblokir WebView)
    overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  android: {
    // Override User-Agent agar Google OAuth mengizinkan sign-in (tidak memblokir WebView)
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
  }
};

export default config;
