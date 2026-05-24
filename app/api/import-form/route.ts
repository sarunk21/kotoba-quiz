import { NextResponse } from 'next/server'

interface CustomQuestion {
  id: string
  type: 'multiple-choice' | 'checkbox' | 'text' | 'section'
  title: string
  choices?: string[]
  section?: string
  description?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  // Basic validation to check if it's a google form
  if (!url.includes('docs.google.com/forms')) {
    return NextResponse.json({ error: 'Must be a valid Google Forms URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 60 } // cache for 60 seconds
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch Google Form: HTTP ${res.status}` }, { status: 400 })
    }

    const html = await res.text()

    // Find the starting point of the variable
    const startPrefix = 'var FB_PUBLIC_LOAD_DATA_ = '
    const startIdx = html.indexOf(startPrefix)

    if (startIdx === -1) {
      return NextResponse.json({ error: 'Could not find quiz data in the Google Form page. Make sure the form is public.' }, { status: 400 })
    }

    const dataStart = startIdx + startPrefix.length
    let bracketCount = 0;
    let endIdx = -1;

    // Linear scanning to find matching outer array closing bracket
    for (let i = dataStart; i < html.length; i++) {
      if (html[i] === '[') {
        bracketCount++;
      } else if (html[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx === -1) {
      return NextResponse.json({ error: 'Invalid Google Forms data structure' }, { status: 400 })
    }

    const rawStr = html.substring(dataStart, endIdx + 1)
    const parsed = JSON.parse(rawStr) as unknown[]

    const formData = parsed[1] as unknown[]
    const formTitle = (parsed[3] || formData[8] || 'Kuis Tanpa Judul') as string
    const formDescription = (formData[0] || '') as string
    const items = formData[1] as unknown[]

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No questions found in this Google Form' }, { status: 400 })
    }

    const questions: CustomQuestion[] = []
    let currentSection = 'Pendahuluan'

    items.forEach((itemVal: unknown) => {
      const item = itemVal as unknown[]
      const id = item[0] as string | number
      const title = item[1] as string | null
      const type = item[3] as number // 1: short text, 2: multiple choice, 3: dropdown, 4: checkbox, 6: section header
      const description = item[2] as string | null

      if (type === 6) {
        currentSection = title || 'Bagian Baru'
        questions.push({
          id: id.toString(),
          type: 'section',
          title: currentSection,
          description: description || ''
        })
      } else if (type === 2 || type === 3 || type === 4) {
        const questionInfo = item[4] as unknown[] | undefined
        if (questionInfo && questionInfo[0]) {
          const innerInfo = questionInfo[0] as unknown[]
          const innerId = innerInfo[0] as string | number | undefined
          const choicesInfo = innerInfo[1] as unknown[][] | undefined
          const choices = choicesInfo ? choicesInfo.map((c) => c[0] as string) : []

          if (choices.length > 0) {
            questions.push({
              id: (innerId || id).toString(),
              type: type === 4 ? 'checkbox' : 'multiple-choice',
              title: title ? title.trim() : '',
              choices,
              section: currentSection
            })
          }
        }
      } else if (type === 1) {
        // Short Answer
        const questionInfo = item[4] as unknown[] | undefined
        const innerId = questionInfo && questionInfo[0] ? (questionInfo[0] as unknown[])[0] as string | number : id
        questions.push({
          id: innerId.toString(),
          type: 'text',
          title: title ? title.trim() : '',
          section: currentSection
        })
      }
    })

    // Generate unique quiz ID based on form URL segment
    const urlParts = url.split('/')
    let formId = urlParts[urlParts.length - 2] || 'custom_' + Date.now()
    if (formId === 'forms' || formId === 'e') {
      formId = urlParts[urlParts.length - 1] || 'custom_' + Date.now()
    }
    // Clean formId query parameters if any
    formId = formId.split('?')[0]

    return NextResponse.json({
      id: formId,
      title: formTitle,
      description: formDescription,
      questions
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Parsing failed: ${message}` }, { status: 500 })
  }
}
