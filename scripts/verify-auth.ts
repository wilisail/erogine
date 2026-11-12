import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'

// Creates only generated example.test accounts. No existing customer data is changed.
// Delete the recorded IDs after the check using the database administrator connection.
const base = (process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const password = randomBytes(24).toString('hex')
const tag = randomUUID()
const created: string[] = []
const jar = new Map<string, string>()
let checks = 0
async function request(path: string, options: { method?: string; body?: unknown; cookies?: Map<string, string>; headers?: Record<string, string>; rawBody?: string } = {}) {
  const cookieJar = options.cookies ?? jar
  const response = await fetch(base + path, {
    method: options.method || 'GET', redirect: 'manual',
    headers: { cookie: [...cookieJar].map(([k, v]) => `${k}=${v}`).join('; '), ...(options.method ? { 'Content-Type': 'application/json', 'x-erogine-client': 'web', origin: base } : {}), ...options.headers },
    body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  })
  for (const line of response.headers.getSetCookie()) {
    const first = line.split(';')[0], index = first.indexOf('=')
    cookieJar.set(first.slice(0, index), first.slice(index + 1))
  }
  const text = await response.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = null }
  return { response, text, data }
}
function status(result: Awaited<ReturnType<typeof request>>, expected: number, name: string) {
  assert.equal(result.response.status, expected, `${name}: ${result.data?.code || 'unexpected response'}`)
  checks++
}

try {
  status(await request('/api/health'), 200, 'database health')
  status(await request('/api/auth/session'), 401, 'anonymous session')
  status(await request('/account'), 307, 'protected page')
  status(await request('/api/auth/login', { method: 'POST', body: {}, headers: { 'x-erogine-client': '' } }), 403, 'application header guard')
  status(await request('/api/auth/login', { method: 'POST', body: {}, headers: { origin: 'https://other.example.test' } }), 403, 'origin guard')
  status(await request('/api/auth/register', { method: 'POST', body: { name: 'QA', email: `short-${tag}@example.test`, password: 'short' } }), 400, 'password validation')
  status(await request('/api/auth/register', { method: 'POST', body: { name: 'QA', email: `role-${tag}@example.test`, password, role: 'SELLER' } }), 400, 'role injection')
  status(await request('/api/auth/login', { method: 'POST', rawBody: 'x'.repeat(8193) }), 413, 'body limit')

  const email = `erogine-qa-${tag}@example.test`
  const registration = await request('/api/auth/register', { method: 'POST', body: { name: 'Erogine QA', email, password } })
  status(registration, 200, 'registration')
  created.push(registration.data.user.id)
  assert.equal('passwordHash' in registration.data.user, false); checks++
  const setCookie = registration.response.headers.getSetCookie().join('; ')
  assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /SameSite=Lax/i); checks++
  if (base.startsWith('https:')) { assert.match(setCookie, /Secure/i); assert.match(setCookie, /__Host-erogine/); checks++ }
  status(await request('/api/auth/register', { method: 'POST', body: { name: 'Again', email, password } }), 409, 'duplicate email')
  status(await request('/api/auth/login', { method: 'POST', body: { email, password: 'incorrect' } }), 401, 'incorrect password')
  const session = await request('/api/auth/session')
  status(session, 200, 'persisted session')
  assert.equal(session.data.user.email, email); checks++
  const account = await request('/account')
  status(account, 200, 'protected account')
  assert(account.text.includes(email)); checks++

  const oldJar = new Map(jar)
  status(await request('/api/auth/refresh', { method: 'POST', body: {} }), 200, 'refresh rotation')
  assert.notDeepEqual([...jar], [...oldJar]); checks++
  status(await request('/api/auth/refresh', { method: 'POST', body: {}, cookies: oldJar }), 401, 'refresh replay')
  status(await request('/api/auth/session'), 401, 'replay revokes session')

  status(await request('/api/auth/login', { method: 'POST', body: { email, password } }), 200, 'sign in again')
  const csrf = await request('/api/auth/csrf')
  status(await request('/api/auth/logout', { method: 'POST', body: {}, headers: { 'x-csrf-token': 'wrong' } }), 403, 'sign-out CSRF guard')
  const beforeLogout = new Map(jar)
  status(await request('/api/auth/logout', { method: 'POST', body: {}, headers: { 'x-csrf-token': csrf.data.csrfToken } }), 200, 'sign out')
  status(await request('/api/auth/session', { cookies: beforeLogout }), 401, 'revoked access token')
  console.log(`PASS: ${checks} hosted authentication checks.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Authentication verification failed')
  process.exitCode = 1
} finally {
  mkdirSync('test-results', { recursive: true })
  writeFileSync('test-results/auth-check.json', JSON.stringify({ base, checks, createdUserIds: created }, null, 2))
}
