import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { products } from '../src/lib/catalogue'

// Configured-provider release checks. Creates disposable example.test accounts
// and an UNAPPROVED sandbox order, then cancels it. Never approves or pays it.
// Clean the recorded database rows after running. No credentials enter reports.
const base = (process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
type Account = { id: string; jar: Record<string, string>; csrf: string }
const accounts: Account[] = [], orders: string[] = [], checks: string[] = []
async function request(path: string, account?: Account, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const response = await fetch(base + path, {
    method: options.method || 'GET', redirect: 'manual', signal: AbortSignal.timeout(60_000),
    headers: {
      ...(account ? { cookie: Object.entries(account.jar).map(([k, v]) => k + '=' + v).join('; ') } : {}),
      ...(options.method ? { 'Content-Type': 'application/json', 'x-erogine-client': 'web', origin: base, ...(account ? { 'x-csrf-token': account.csrf } : {}) } : {}),
      ...options.headers,
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })
  if (account) for (const cookie of response.headers.getSetCookie()) {
    const [name, ...value] = cookie.split(';')[0].split('='); account.jar[name] = value.join('=')
  }
  const text = await response.text()
  let data: any = null
  try { data = JSON.parse(text) } catch { /* HTML page */ }
  return { response, text, data }
}
function expect(result: Awaited<ReturnType<typeof request>>, status: number, name: string) {
  assert.equal(result.response.status, status, name + ': ' + (result.data?.code || result.response.status))
  checks.push(name)
}
function check(name: string, run: () => void) { run(); checks.push(name) }
const post = (body: unknown = {}) => ({ method: 'POST', body })
try {
  expect(await request('/api/health'), 200, 'database health')
  const shop = await request('/shop')
  expect(shop, 200, 'public catalogue')
  check('all eight catalogue products render', () => assert(products.every(p => shop.text.includes(p.title))))
  check('AI connection enabled', () => assert(!shop.text.includes('AI connection is being prepared')))
  for (const product of products) expect(await request('/products/' + product.id), 200, 'product detail ' + product.id)
  expect(await request('/products/unknown-product'), 404, 'unknown product rejected')
  expect(await request('/cart'), 200, 'cart page')
  expect(await request('/checkout'), 307, 'anonymous checkout redirect')
  expect(await request('/api/payments/config'), 401, 'anonymous provider config rejected')
  expect(await request('/api/payments/orders', undefined, post()), 401, 'anonymous order create rejected')
  for (let i = 0; i < 2; i++) {
    const account: Account = { id: '', jar: {}, csrf: '' }
    const result = await request('/api/auth/register', account, post({ name: 'Release QA', email: `erogine-release-qa-${randomUUID()}@example.test`, password: randomBytes(24).toString('hex') }))
    expect(result, 200, 'QA registration ' + (i + 1))
    account.id = result.data.user.id; account.csrf = result.data.csrfToken; accounts.push(account)
  }
  const [owner, other] = accounts
  const config = await request('/api/payments/config', owner)
  expect(config, 200, 'authenticated provider config')
  check('sandbox configured with public client ID only', () => {
    assert.equal(config.data.configured, true); assert.equal(config.data.environment, 'sandbox')
    assert.equal(config.data.currency, 'USD'); assert.equal(typeof config.data.clientId, 'string')
    assert.equal('clientSecret' in config.data, false); assert.equal('apiKey' in config.data, false)
    assert.match(config.response.headers.get('cache-control') || '', /no-store/)
  })
  for (const [headers, label] of [[{ origin: 'https://other.example.test' }, 'cross-origin payment'], [{ 'x-erogine-client': '' }, 'application header'], [{ 'x-csrf-token': 'wrong' }, 'payment CSRF']] as const) {
    expect(await request('/api/payments/orders', owner, { ...post(), headers }), 403, label + ' guard')
  }
  const input = { checkoutKey: randomUUID(), items: [{ productId: 'orbit-city-cruiser', quantity: 1 }] }
  for (const [body, label] of [
    [{ ...input, totalCents: 1 }, 'client total rejected'],
    [{ ...input, items: [{ ...input.items[0], unitPriceCents: 1 }] }, 'client unit price rejected'],
    [{ ...input, items: [{ ...input.items[0], quantity: 0 }] }, 'zero quantity rejected'],
    [{ ...input, items: [{ ...input.items[0], quantity: 100 }] }, 'excess quantity rejected'],
    [{ ...input, items: [input.items[0], input.items[0]] }, 'duplicate SKU rejected'],
    [{ ...input, items: [{ productId: 'unknown', quantity: 1 }] }, 'unknown SKU rejected'],
  ] as const) expect(await request('/api/payments/orders', owner, post(body)), 400, label)
  const created = await request('/api/payments/orders', owner, post(input))
  expect(created, 200, 'real sandbox order created without approval')
  const order = created.data.order; orders.push(order.id)
  const url = '/api/payments/orders/' + order.id
  check('server fixes currency, amount, price and unpaid state', () => {
    assert.equal(order.status, 'PENDING'); assert.equal(order.totalCents, 1800); assert.equal(order.currency, 'USD')
    assert.equal(order.items[0].unitPriceCents, 1800); assert(order.paypalOrderId)
    assert.equal(order.paypalCaptureId, null); assert.equal('userId' in order, false)
  })
  const duplicate = await request('/api/payments/orders', owner, post(input))
  expect(duplicate, 200, 'same checkout retried safely')
  check('checkout retry reuses local and PayPal order', () => {
    assert.equal(duplicate.data.order.id, order.id); assert.equal(duplicate.data.order.paypalOrderId, order.paypalOrderId)
  })
  expect(await request('/api/payments/orders', owner, post({ ...input, items: [{ ...input.items[0], quantity: 2 }] })), 409, 'changed cart requires a new checkout key')
  expect(await request(url), 401, 'anonymous receipt rejected')
  expect(await request(url, other), 404, 'other customer receipt rejected')
  expect(await request('/orders/' + order.id, other), 404, 'other customer receipt page rejected')
  expect(await request('/api/payments/orders/not-an-id', owner), 404, 'invalid order ID rejected')
  for (const action of ['capture', 'cancel', 'reconcile']) expect(await request(url + '/' + action, other, post()), 404, 'other customer ' + action + ' rejected')
  expect(await request(url + '/capture', owner, post({ paypalOrderId: 'injected' })), 400, 'client provider ID rejected')
  expect(await request(url + '/capture', owner, post()), 409, 'capture requires buyer approval')
  const reconciled = await request(url + '/reconcile', owner, post())
  expect(reconciled, 200, 'real sandbox unpaid reconciliation')
  check('unapproved order remains unpaid', () => assert.equal(reconciled.data.order.status, 'PENDING'))
  const receipt = await request('/orders/' + order.id, owner)
  expect(receipt, 200, 'owner receipt page')
  check('receipt never invents payment', () => { assert(receipt.text.includes('PENDING')); assert(!receipt.text.includes('Payment verified.')) })
  const canceled = await request(url + '/cancel', owner, post())
  expect(canceled, 200, 'real sandbox unpaid cancellation')
  check('cancellation saved without capture', () => { assert.equal(canceled.data.order.status, 'CANCELED'); assert.equal(canceled.data.order.paypalCaptureId, null) })
  expect(await request(url + '/cancel', owner, post()), 200, 'cancellation is idempotent')
  expect(await request(url + '/capture', owner, post()), 409, 'canceled order cannot be paid')
  const reload = await request(url, owner)
  expect(reload, 200, 'canceled receipt reload')
  check('canceled status persists', () => assert.equal(reload.data.order.status, 'CANCELED'))
  expect(await request('/account', owner), 200, 'account history')
  const ai = { interests: 'soft toy', maxBudgetCents: 2400 }
  expect(await request('/api/recommendations', undefined, post(ai)), 401, 'anonymous AI rejected')
  expect(await request('/api/recommendations', owner, { ...post(ai), headers: { origin: 'https://other.example.test' } }), 403, 'AI origin guard')
  expect(await request('/api/recommendations', owner, { ...post(ai), headers: { 'x-csrf-token': 'wrong' } }), 403, 'AI CSRF guard')
  expect(await request('/api/recommendations', owner, post({ ...ai, model: 'paid/override' })), 400, 'client model override rejected')
  expect(await request('/api/recommendations', owner, post({ ...ai, maxBudgetCents: 20001 })), 400, 'AI budget upper bound')
  const empty = await request('/api/recommendations', owner, post({ ...ai, maxBudgetCents: 100 }))
  expect(empty, 200, 'no affordable product handled locally')
  check('empty response labelled catalogue', () => assert.deepEqual(empty.data, { source: 'catalogue', recommendations: [] }))
  const refreshCookie = Object.keys(owner.jar).find(name => name.endsWith('erogine_refresh'))!
  const mixed = { ...owner, csrf: other.csrf, jar: { ...owner.jar, [refreshCookie]: other.jar[refreshCookie] } }
  expect(await request('/api/recommendations', mixed, post(ai)), 403, 'CSRF belongs to active session')
  console.log(`PASS: ${checks.length} hosted release checks. Sandbox order canceled; no payment approved or captured.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Release verification failed'); process.exitCode = 1
} finally {
  mkdirSync('test-results', { recursive: true })
  writeFileSync('test-results/release-check.json', JSON.stringify({ base, checks, createdUserIds: accounts.map(a => a.id), createdOrderIds: orders, completed: !process.exitCode }, null, 2))
}
