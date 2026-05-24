import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined

  // Bersihkan tanda kutip ganda jika pengguna menyalinnya dari .env.local
  if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1)
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
    } catch (err) {
      console.error('Failed to initialize Firebase Admin SDK:', err)
    }
  } else {
    console.warn('Firebase credentials are not set. Firebase operations will fail.')
  }
}

export const db = admin.apps.length ? admin.firestore() : null
