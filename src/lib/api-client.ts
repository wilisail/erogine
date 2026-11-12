'use client'

export class ApiClientError extends Error {
  constructor(message: string, public code: string) { super(message) }
}
export async function readResponse(response: Response) {
  const data = await response.json()
  if (!response.ok) throw new ApiClientError(data.message || 'Please try again shortly.', data.code || 'REQUEST_FAILED')
  return data
}
const headers = { 'Content-Type': 'application/json', 'x-erogine-client': 'web' }
let sessionRequest: Promise<{ csrfToken: string }> | undefined
// A checkout can outlast the short access cookie. Rotate the refresh cookie once,
// before sending the authenticated mutation; concurrent callers share this work.
export async function browserSession(): Promise<{ csrfToken: string }> {
  if (sessionRequest) return sessionRequest
  sessionRequest = (async () => {
    let response = await fetch('/api/auth/session', { cache: 'no-store' })
    if (response.status === 401) response = await fetch('/api/auth/refresh', { method: 'POST', headers, body: '{}' })
    return readResponse(response)
  })()
  try { return await sessionRequest } finally { sessionRequest = undefined }
}
export async function paymentMutation(path: string, body: object = {}) {
  const session = await browserSession()
  return readResponse(await fetch(path, { method: 'POST', headers: { ...headers, 'x-csrf-token': session.csrfToken }, body: JSON.stringify(body) }))
}
