import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kotobaquiz.app',
  appName: 'Kotoba Quiz',
  webDir: 'public',
  server: {
    // Ganti URL ini dengan URL website Anda yang sudah di-deploy di Vercel/hosting lain.
    // Contoh: 'https://kotoba-quiz.vercel.app'
    // Untuk development lokal di emulator Android, gunakan IP komputer lokal atau 'http://10.0.2.2:3000'
    url: 'https://kotoba-quiz-gilt.vercel.app',
    allowNavigation: [
      'kotoba-quiz-gilt.vercel.app',
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
