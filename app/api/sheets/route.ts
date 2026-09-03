import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
 const url = req.nextUrl.searchParams.get('url')
 const force = req.nextUrl.searchParams.get('t') // cache buster
 if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

 // Validasi ketat — cegah SSRF via URL parsing
 try {
 const u = new URL(url)
 if (u.hostname !== 'docs.google.com' && !u.hostname.endsWith('.google.com')) {
 return NextResponse.json({ error: 'Invalid host' }, { status: 400 })
 }
 if (!u.pathname.includes('/spreadsheets')) {
 return NextResponse.json({ error: 'Invalid Sheets URL' }, { status: 400 })
 }
 } catch {
 return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
 }

 try {
 const finalUrl = force ? `${url}${url.includes('?') ? '&' : '?'}_=${force}` : url
 const res = await fetch(finalUrl, {
 headers: { 'User-Agent': 'KotobaQuiz/1.0' },
 cache: force ? 'no-store' : 'default',
 next: { revalidate: force ? 0 : 60 },
 signal: AbortSignal.timeout(8000),
 })
 if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`)
 const csv = await res.text()
 if (csv.length > 500_000) return NextResponse.json({ error: 'CSV too large' }, { status: 413 })
 return new NextResponse(csv, {
 headers: { 'Content-Type': 'text/csv; charset=utf-8' },
 })
 } catch (e: unknown) {
 const error = e as Error
 if (error.name === 'TimeoutError') return NextResponse.json({ error: 'Sheets timeout' }, { status: 504 })
 return NextResponse.json({ error: error.message }, { status: 500 })
 }
}
