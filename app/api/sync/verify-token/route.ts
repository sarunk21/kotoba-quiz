import { NextRequest, NextResponse } from 'next/server'
import { verifySyncToken } from '@/lib/token'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const email = verifySyncToken(token)
    if (!email) {
      return NextResponse.json({ error: 'Token tidak valid atau sudah kadaluarsa ✗' }, { status: 400 })
    }

    return NextResponse.json({ success: true, email })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
