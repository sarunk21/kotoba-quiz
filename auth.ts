import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: 'google-native',
      name: 'Google Native',
      credentials: {
        idToken: { label: 'ID Token', type: 'text' },
      },
  async authorize(credentials) {
 if (!credentials?.idToken) {
 console.error('[Google Native Auth] Missing ID Token')
 return null
 }
 if (!process.env.GOOGLE_CLIENT_ID) {
 console.error('[Google Native Auth] Missing GOOGLE_CLIENT_ID env')
 return null
 }

 try {
 // Verify the ID Token with Google TokenInfo API — pakai timeout & aud check
 const ctrl = new AbortController()
 const t = setTimeout(() => ctrl.abort(), 8000)
 const response = await fetch(
 `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credentials.idToken as string)}`,
 { signal: ctrl.signal }
 )
 clearTimeout(t)

          if (!response.ok) {
            console.error('[Google Native Auth] Failed to verify ID Token with Google API')
            return null
          }

          const payload = await response.json()

 // Validate Issuer
 const issuer = payload.iss
 if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
 console.error('[Google Native Auth] Invalid issuer:', issuer)
 return null
 }
 // Validate audience — harus GOOGLE_CLIENT_ID
 if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
 console.error('[Google Native Auth] Invalid aud:', payload.aud)
 return null
 }
 // Validate expiry
 if (payload.exp && Number(payload.exp) * 1000 < Date.now()) {
 console.error('[Google Native Auth] Token expired')
 return null
 }

 // Check if email is verified
          if (payload.email_verified === 'true' || payload.email_verified === true) {
            return {
              id: payload.sub,
              name: payload.name || payload.email.split('@')[0],
              email: payload.email,
              image: payload.picture || null,
            }
          }

          console.error('[Google Native Auth] Email not verified by Google')
          return null
        } catch (error) {
          console.error('[Google Native Auth] Error during token validation:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: '/',
  },
})
