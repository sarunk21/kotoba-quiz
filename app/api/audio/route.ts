import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
 const text = req.nextUrl.searchParams.get('text')
 if (!text) {
 return NextResponse.json({ error: 'No text parameter provided' }, { status: 400 })
 }
 // Batasi panjang untuk cegah abuse & quota DOS
 if (text.length > 200) {
 return NextResponse.json({ error: 'Text too long (max 200)' }, { status: 400 })
 }

 // Engine 1: Google Neural Japanese TTS (Highest fluency, pitch accent, natural sound)
 const googleAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(text)}`
 
 // Engine 2: Youdao Japanese Dictionary TTS (Backup)
 const youdaoAudioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=jap`

 // Try Google Neural TTS first
 try {
 const res = await fetch(googleAudioUrl, {
 signal: AbortSignal.timeout(8000),
 headers: { 
 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
 'Referer': 'https://translate.google.com/'
 },
 })

 if (res.ok) {
 const arrayBuffer = await res.arrayBuffer()
 const contentType = res.headers.get('content-type') || 'audio/mpeg'

 return new NextResponse(arrayBuffer, {
 headers: {
 'Content-Type': contentType,
 'Cache-Control': 'public, max-age=31536000, immutable',
 },
 })
 }
 } catch (e) {
 console.warn('[Audio Proxy] Primary Google TTS failed, attempting fallback to Youdao TTS...', e)
 }

 // Fallback to Youdao TTS Engine
 try {
 const res = await fetch(youdaoAudioUrl, {
 signal: AbortSignal.timeout(8000),
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
 return NextResponse.json({ error: e.message || 'Failed to fetch audio from all engines' }, { status: 500 })
 }
}
