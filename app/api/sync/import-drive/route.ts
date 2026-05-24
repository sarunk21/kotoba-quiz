import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const FILENAME = 'kotoba_data.json'

async function findFile(token: string): Promise<string | null> {
  const t = Date.now()
  const res = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=name='${FILENAME}'&fields=files(id,modifiedTime)&t=${t}`,
    { 
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }
  )
  if (!res.ok) {
    let details = ''
    try {
      details = await res.text()
    } catch {}
    throw new Error(`Failed to list Google Drive files: ${res.statusText || res.status} - ${details}`)
  }
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

async function getFileContent(token: string, fileId: string): Promise<unknown> {
  const t = Date.now()
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media&t=${t}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    let details = ''
    try {
      details = await res.text()
    } catch {}
    throw new Error(`Failed to fetch Google Drive file content: ${res.statusText || res.status} - ${details}`)
  }
  return await res.json()
}

export async function GET() {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized. Login dengan Google Drive permission diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const fileId = await findFile(session.accessToken)
    if (!fileId) {
      return NextResponse.json(
        { error: 'File backup Google Drive (kotoba_data.json) tidak ditemukan.' },
        { status: 404 }
      )
    }

    const data = await getFileContent(session.accessToken, fileId)
    return NextResponse.json({ data })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
