export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || ''
  return `${baseUrl}${cleanPath}`
}
