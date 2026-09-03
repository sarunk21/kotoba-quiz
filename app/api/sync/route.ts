import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/firebase-admin'

// GET — ambil semua data (vocab + srs + stats) dari Firestore
export async function GET() {
 const session = await auth()
 if (!session?.user?.email) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 if (!db) {
 return NextResponse.json({ error: 'Firebase is not initialized' }, { status: 500 })
 }

 const email = session.user.email

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
  studyHistory: progressData?.studyHistory ?? null,
  failedWords: progressData?.failedWords ?? null,
  chapterImages: progressData?.chapterImages ?? null,
  }
  })
 } catch (e: unknown) {
 const error = e as Error
 return NextResponse.json({ error: error.message }, { status: 500 })
 }
}

// POST — simpan data (srs + stats + vocab) ke Firestore
export async function POST(req: NextRequest) {
 const session = await auth()
 if (!session?.user?.email) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 if (!db) {
 return NextResponse.json({ error: 'Firebase is not initialized' }, { status: 500 })
 }

  const email = session.user.email
  const body = await req.json()
  const { srs, stats, vocab, vocabUpdatedAt, updatedAt, studyHistory, failedWords, chapterImages } = body

  try {
  const batch = db.batch()

  // 1. Simpan progress (srs + stats + history + chapterImages) ke dokumen user
  const userRef = db.collection('users').doc(email)
  batch.set(userRef, {
  srs: srs ?? {},
  stats: stats ?? {},
  updatedAt: updatedAt ?? new Date().toISOString(),
  ...(studyHistory !== undefined && { studyHistory }),
  ...(failedWords !== undefined && { failedWords }),
  ...(chapterImages !== undefined && { chapterImages }),
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
export async function DELETE() {
 const session = await auth()
 if (!session?.user?.email) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 if (!db) {
 return NextResponse.json({ error: 'Firebase is not initialized' }, { status: 500 })
 }

 const email = session.user.email

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
