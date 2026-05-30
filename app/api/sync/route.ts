import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/firebase-admin'
import { verifySyncToken } from '@/lib/token'

/**
 * Helper to resolve user email from either Mobile Sync Token or Web Session.
 */
async function getEmailFromRequest(req: NextRequest): Promise<string | null> {
  // 1. Try Authorization header (Mobile/Capacitor client)
  const authHeader = req.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const email = verifySyncToken(token)
    if (email) return email
  }

  // 2. Try NextAuth session (Web client)
  const session = await auth()
  return session?.user?.email || null
}

// GET — ambil semua data (vocab + srs + stats) dari Firestore
export async function GET(req: NextRequest) {
  const email = await getEmailFromRequest(req)
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!db) {
    return NextResponse.json({ error: 'Firebase is not initialized' }, { status: 500 })
  }

  try {
    // 1. Ambil data progress (srs + stats)
    const userDoc = await db.collection('users').doc(email).get()
    const progressData = userDoc.exists ? userDoc.data() : null

    // 2. Ambil data vocab kustom
    const vocabDoc = await db.collection('users').doc(email).collection('vocab').doc('data').get()
    const vocabData = vocabDoc.exists ? vocabDoc.data()?.items : null
    const vocabUpdatedAt = vocabDoc.exists ? vocabDoc.data()?.updatedAt : null

    return NextResponse.json({
      data: {
        srs: progressData?.srs ?? {},
        stats: progressData?.stats ?? null,
        updatedAt: progressData?.updatedAt ?? '',
        vocab: vocabData ?? null,
        vocabUpdatedAt: vocabUpdatedAt ?? '',
      }
    })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — simpan data (srs + stats + vocab) ke Firestore
export async function POST(req: NextRequest) {
  const email = await getEmailFromRequest(req)
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!db) {
    return NextResponse.json({ error: 'Firebase is not initialized' }, { status: 500 })
  }

  const body = await req.json()
  const { srs, stats, vocab, vocabUpdatedAt, updatedAt } = body

  try {
    const batch = db.batch()

    // 1. Simpan progress (srs + stats) ke dokumen user
    const userRef = db.collection('users').doc(email)
    batch.set(userRef, {
      srs: srs ?? {},
      stats: stats ?? {},
      updatedAt: updatedAt ?? new Date().toISOString(),
    }, { merge: true })

    // 2. Simpan vocab jika disertakan
    if (vocab !== undefined) {
      const vocabRef = db.collection('users').doc(email).collection('vocab').doc('data')
      batch.set(vocabRef, {
        items: vocab || [],
        updatedAt: vocabUpdatedAt || new Date().toISOString(),
      })
    }

    await batch.commit()
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — hapus semua data dari Firestore
export async function DELETE(req: NextRequest) {
  const email = await getEmailFromRequest(req)
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!db) {
    return NextResponse.json({ error: 'Firebase is not initialized' }, { status: 500 })
  }

  try {
    const batch = db.batch()

    // Hapus dokumen vocab
    const vocabRef = db.collection('users').doc(email).collection('vocab').doc('data')
    batch.delete(vocabRef)

    // Hapus dokumen user
    const userRef = db.collection('users').doc(email)
    batch.delete(userRef)

    await batch.commit()
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
