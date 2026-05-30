export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('kotoba_api_base')
    if (customUrl) {
      const cleanBase = customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl
      return `${cleanBase}${cleanPath}`
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || ''
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${cleanBase}${cleanPath}`
}
