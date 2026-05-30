import crypto from 'crypto'

/**
 * Generate a cryptographically signed token containing the user's email.
 * Valid for 1 year by default.
 */
export function generateSyncToken(email: string): string {
  const secret = process.env.AUTH_SECRET || 'fallback_secret'
  const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year duration
  const payload = `${email}:${expiresAt}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${signature}`).toString('base64')
}

/**
 * Verify a sync token and return the authenticated email if valid, or null.
 */
export function verifySyncToken(token: string): string | null {
  try {
    const secret = process.env.AUTH_SECRET || 'fallback_secret'
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length !== 3) return null

    const [email, expiresAtStr, signature] = parts
    if (!email || !expiresAtStr || !signature) return null

    const expiresAt = parseInt(expiresAtStr, 10)
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null // Expired or invalid

    const expectedPayload = `${email}:${expiresAt}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex')

    if (signature === expectedSignature) {
      return email
    }
  } catch (e) {
    console.error('[Token Verification Error]', e)
  }
  return null
}
