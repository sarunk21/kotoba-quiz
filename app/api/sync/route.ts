import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// Satu file nyimpen semua: SRS + stats + settings
const FILENAME = 'kotoba_data.json'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

async function findFile(token: string): Promise<string | null> {
  const res = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=name='${FILENAME}'&fields=files(id,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

async function upsertFile(token: string, fileId: string | null, content: string): Promise<boolean> {
  let res
  if (fileId) {
    res = await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: content,
    })
  } else {
    const meta = JSON.stringify({ name: FILENAME, parents: ['appDataFolder'] })
    const boundary = 'boundary_kotoba_v2'
    const multipart = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      meta,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n')
    res = await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    })
  }
  return res.ok
}

// GET — ambil semua data dari Drive
export async function GET() {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const fileId = await findFile(session.accessToken)
    if (!fileId) return NextResponse.json({ data: null })

    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ data: null })
    const data = await res.json()
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — simpan semua data ke Drive
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const token = session.accessToken

  try {
    const fileId = await findFile(token)
    const ok = await upsertFile(token, fileId, JSON.stringify(body))
    return NextResponse.json({ ok })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — hapus file data dari Drive
export async function DELETE() {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const fileId = await findFile(session.accessToken)
    if (!fileId) return NextResponse.json({ ok: true })

    const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
    return NextResponse.json({ ok: res.ok })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
