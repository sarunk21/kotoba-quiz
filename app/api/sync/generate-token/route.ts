import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateSyncToken } from '@/lib/token'

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = generateSyncToken(session.user.email)
  return NextResponse.json({ token })
}
