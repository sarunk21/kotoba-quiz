import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  // Validasi harus Google Sheets URL
  if (!url.includes('docs.google.com') && !url.includes('spreadsheets')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    // Server-side fetch — bypass CORS
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KotobaQuiz/1.0' },
      next: { revalidate: 300 }, // cache 5 menit
    })
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`)
    const csv = await res.text()
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
