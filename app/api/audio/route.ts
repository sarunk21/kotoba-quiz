import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  if (!text) {
    return NextResponse.json({ error: 'No text parameter provided' }, { status: 400 })
  }

  const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=jap`

  try {
    const res = await fetch(audioUrl, {
      headers: { 
        'User-Agent': 'KotobaQuiz/1.0'
      },
    })

    if (!res.ok) {
      throw new Error(`Youdao voice fetch failed with status: ${res.status}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'audio/mpeg'

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e: any) {
    console.error('[Audio Proxy Error]', e)
    return NextResponse.json({ error: e.message || 'Failed to fetch audio' }, { status: 500 })
  }
}
