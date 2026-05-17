import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const FILENAME = 'kotoba_srs.json'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

async function findFile(token: string): Promise<string | null> {
  const res = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=name='${FILENAME}'&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

// GET — load SRS dari Drive
export async function GET() {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const fileId = await findFile(session.accessToken)
    if (!fileId) return NextResponse.json({ data: null }) // belum ada data

    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
    const data = await res.json()
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST — save SRS ke Drive
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const content = JSON.stringify(body)
  const token = session.accessToken

  try {
    const fileId = await findFile(token)
    let res

    if (fileId) {
      // Update existing
      res = await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: content,
      })
    } else {
      // Create new in appDataFolder
      const meta = JSON.stringify({ name: FILENAME, parents: ['appDataFolder'] })
      const boundary = 'boundary_kotoba'
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

    const result = await res.json()
    return NextResponse.json({ ok: true, id: result.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
