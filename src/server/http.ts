import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { HttpError } from './errors'
export { HttpError } from './errors'

export function requireBrowserMutation(request: NextRequest) {
  const origin = request.headers.get('origin')
  if ((origin && origin !== new URL(request.url).origin) ||
      request.headers.get('sec-fetch-site') === 'cross-site' ||
      request.headers.get('x-erogine-client') !== 'web') {
    throw new HttpError(403, 'ORIGIN_REJECTED', 'Open Erogine in this browser and try again.')
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new HttpError(415, 'JSON_REQUIRED', 'Send a JSON request.')
  }
}

export async function jsonBody(request: NextRequest) {
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, 'INVALID_JSON', 'A request body is required.')
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > 8192) { await reader.cancel(); throw new HttpError(413, 'BODY_TOO_LARGE', 'The request is too large.') }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'INVALID_JSON', 'Check the request and try again.')
  }
}

// Small per-instance guard, matching the original F2 preview's memory-based limiter.
// Distributed abuse protection can be added after the hackathon; this is not a shared quota.
const attempts = new Map<string, { count: number; until: number }>()
export function limitAuth(request: NextRequest) {
  const now = Date.now()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (attempts.size > 2000) for (const [key, value] of attempts) if (value.until < now) attempts.delete(key)
  const row = attempts.get(ip)
  if (!row || row.until < now) { attempts.set(ip, { count: 1, until: now + 600_000 }); return }
  if (++row.count > 30) throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Please wait a few minutes before trying again.')
}

export function apiError(error: unknown) {
  const known = error instanceof Error && 'status' in error && 'code' in error
  const status = known ? Number(error.status) : 503
  return NextResponse.json({ success: false, code: known ? String(error.code) : 'TEMPORARILY_UNAVAILABLE', message: known ? error.message : 'Temporarily unavailable. Please try again shortly.' }, {
    status, headers: { 'Cache-Control': 'no-store' },
  })
}
