import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const force = req.nextUrl.searchParams.get('t') // cache buster
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  // Validasi harus Google Sheets URL
  if (!url.includes('docs.google.com') && !url.includes('spreadsheets')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    // Tambahin nonce ke URL Google Sheets kalau force refresh
    const finalUrl = force ? `${url}${url.includes('?') ? '&' : '?'}_=${force}` : url

    // Server-side fetch — bypass CORS
    const res = await fetch(finalUrl, {
      headers: { 'User-Agent': 'KotobaQuiz/1.0' },
      next: { revalidate: force ? 0 : 60 }, // cache buster atau 1 menit
    })
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`)
    const csv = await res.text()
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
