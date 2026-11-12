import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { products } from '../src/lib/catalogue'

// HTTP checks only; no database administration or fake provider routes.
// --prepare creates two disposable accounts. An administrator seeds two unpaid
// orders through the approved SQL connection, then the default mode checks them.
// The ignored, mode-0600 checkpoint contains temporary QA cookies; never commit it.
const base = (process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const path = 'test-results/payment-check-private.json'
type Account = { id: string; orderId: string; email: string; jar: Record<string, string>; csrf: string }
type State = { base: string; accounts: Account[]; checks: number }
const state: State = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { base, accounts: [], checks: 0 }
const checks: string[] = []
async function request(url: string, account?: Account, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const response = await fetch(base + url, { method: options.method || 'GET', redirect: 'manual',
    headers: { ...(account ? { cookie: Object.entries(account.jar).map(([k, v]) => k + '=' + v).join('; ') } : {}),
      ...(options.method ? { 'Content-Type': 'application/json', 'x-erogine-client': 'web', origin: base, ...(account ? { 'x-csrf-token': account.csrf } : {}) } : {}), ...options.headers },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}), signal: AbortSignal.timeout(60_000) })
  if (account) for (const cookie of response.headers.getSetCookie()) { const [name, ...value] = cookie.split(';')[0].split('='); account.jar[name] = value.join('=') }
  const text = await response.text()
  let data: any = null
  try { data = JSON.parse(text) } catch { /* HTML page */ }
  return { response, text, data }
}
function expect(result: Awaited<ReturnType<typeof request>>, status: number, label: string) {
  assert.equal(result.response.status, status, label + ': ' + (result.data?.code || result.response.status))
  checks.push(label)
}
try {
  if (process.argv.includes('--prepare')) {
    assert.equal(state.accounts.length, 0, 'A QA checkpoint already exists. Clean its accounts before preparing another.')
    for (let i = 0; i < 2; i++) {
      const account: Account = { id: '', orderId: randomUUID(), email: `erogine-payments-qa-${randomUUID()}@example.test`, jar: {}, csrf: '' }
      const result = await request('/api/auth/register', account, { method: 'POST', body: { name: 'Payment QA ' + (i + 1), email: account.email, password: randomBytes(24).toString('hex') } })
      expect(result, 200, 'QA account registration'); account.id = result.data.user.id; account.csrf = result.data.csrfToken; state.accounts.push(account)
    }
    console.log(JSON.stringify({ prepared: state.accounts.map(({ id, orderId }) => ({ id, orderId })) }))
  } else {
    assert.equal(state.base, base, 'Use the same preview as --prepare.')
    assert.equal(state.accounts.length, 2, 'Run --prepare and seed the unpaid fixtures first.')
    const [owner, other] = state.accounts
    const shop = await request('/shop')
    expect(shop, 200, 'public catalogue renders')
    assert(products.every(product => shop.text.includes(product.title))); checks.push('all eight catalogue products appear')
    assert(shop.text.includes('AI connection is being prepared')); checks.push('AI setup state is honest')
    const detailPages = await Promise.all(products.map(product => request('/products/' + product.id)))
    detailPages.forEach((page, index) => { expect(page, 200, 'product detail ' + products[index].id); assert(page.text.includes(products[index].title)) })
    expect(await request('/products/unknown-product'), 404, 'unknown product rejected')
    expect(await request('/cart'), 200, 'public cart shell renders')
    expect(await request('/api/health'), 200, 'hosted database health')
    expect(await request('/checkout'), 307, 'anonymous checkout redirect')
    expect(await request('/api/payments/config'), 401, 'anonymous configuration rejected')
    expect(await request('/api/payments/orders/' + owner.orderId), 401, 'anonymous receipt rejected')
    expect(await request('/api/payments/orders', undefined, { method: 'POST', body: {} }), 401, 'anonymous create rejected')
    expect(await request('/api/payments/orders/' + owner.orderId + '/capture', undefined, { method: 'POST', body: {} }), 401, 'anonymous capture rejected')
    const config = await request('/api/payments/config', owner)
    expect(config, 200, 'authenticated configuration')
    assert.equal(config.data.configured, false, 'This verification run expects sandbox keys to be absent.'); checks.push('missing credentials reported honestly')
    assert.equal('clientSecret' in config.data, false); assert.equal('clientId' in config.data, false); checks.push('no credentials exposed')
    const own = await request('/api/payments/orders/' + owner.orderId, owner)
    expect(own, 200, 'owner receipt')
    assert.equal(own.data.order.status, 'PENDING'); assert.equal(own.data.order.totalCents, 1800); assert.equal('userId' in own.data.order, false); checks.push('unpaid server record and safe fields')
    expect(await request('/api/payments/orders/' + owner.orderId, other), 404, 'other customer receipt rejected')
    expect(await request('/api/payments/orders/not-an-id', owner), 404, 'invalid order ID rejected')
    const page = await request('/orders/' + owner.orderId, owner)
    expect(page, 200, 'owner receipt page'); assert(page.text.includes('PENDING')); checks.push('receipt never invents paid status')
    expect(await request('/orders/' + owner.orderId, other), 404, 'other customer receipt page rejected')
    const checkout = await request('/checkout', owner)
    expect(checkout, 200, 'authenticated checkout page'); assert(checkout.text.includes('Sandbox setup in progress')); checks.push('checkout shows pending configuration')
    for (const [headers, label] of [[{ origin: 'https://other.example.test' }, 'cross-origin payment rejected'], [{ 'x-erogine-client': '' }, 'missing application header rejected'], [{ 'x-csrf-token': 'wrong' }, 'bad CSRF rejected']] as const) {
      expect(await request('/api/payments/orders', owner, { method: 'POST', body: {}, headers }), 403, label)
    }
    const create = await request('/api/payments/orders', owner, { method: 'POST', body: { checkoutKey: randomUUID(), items: [{ productId: 'orbit-city-cruiser', quantity: 1 }] } })
    expect(create, 503, 'missing provider configuration fails closed'); assert.equal(create.data.code, 'PAYPAL_NOT_CONFIGURED'); checks.push('specific safe configuration error')
    for (const action of ['capture', 'cancel', 'reconcile']) expect(await request('/api/payments/orders/' + owner.orderId + '/' + action, owner, { method: 'POST', body: {} }), 503, action + ' disabled without provider configuration')
    expect(await request('/api/payments/orders/' + owner.orderId + '/capture', owner, { method: 'POST', body: { paypalOrderId: 'injected' } }), 400, 'client provider ID rejected')
    expect(await request('/api/payments/orders/' + owner.orderId + '/invalid', owner, { method: 'POST', body: {} }), 404, 'unknown payment action rejected')
    expect(await request('/account', owner), 200, 'order history renders')
    const aiInput = { interests: 'wooden desk toys', maxBudgetCents: 2500 }
    expect(await request('/api/recommendations', undefined, { method: 'POST', body: aiInput }), 401, 'anonymous AI request rejected')
    expect(await request('/api/recommendations', owner, { method: 'POST', body: aiInput, headers: { origin: 'https://other.example.test' } }), 403, 'cross-origin AI request rejected')
    expect(await request('/api/recommendations', owner, { method: 'POST', body: aiInput, headers: { 'x-csrf-token': 'wrong' } }), 403, 'AI CSRF guard')
    expect(await request('/api/recommendations', owner, { method: 'POST', body: { ...aiInput, model: 'paid/override' } }), 400, 'client model override rejected')
    const aiMissing = await request('/api/recommendations', owner, { method: 'POST', body: aiInput })
    expect(aiMissing, 503, 'missing AI key fails closed'); assert.equal(aiMissing.data.code, 'AI_NOT_CONFIGURED'); checks.push('no simulated AI recommendations')
    const noAffordable = await request('/api/recommendations', owner, { method: 'POST', body: { ...aiInput, maxBudgetCents: 100 } })
    expect(noAffordable, 200, 'empty budget handled without AI'); assert.deepEqual(noAffordable.data, { source: 'catalogue', recommendations: [] }); checks.push('empty result labelled as catalogue')
    const refreshCookie = Object.keys(owner.jar).find(name => name.endsWith('erogine_refresh'))!
    const mismatched = { ...owner, csrf: other.csrf, jar: { ...owner.jar, [refreshCookie]: other.jar[refreshCookie] } }
    expect(await request('/api/recommendations', mismatched, { method: 'POST', body: aiInput }), 403, 'CSRF secret must belong to the active session')
    console.log(`PASS: ${checks.length} hosted payment-boundary checks (no PayPal sandbox transaction performed).`)
  }
} catch (error) { console.error(error instanceof Error ? error.message : 'Payment verification failed'); process.exitCode = 1 }
finally {
  mkdirSync('test-results', { recursive: true }); state.checks = checks.length
  writeFileSync(path, JSON.stringify(state), { mode: 0o600 })
  writeFileSync('test-results/payment-check.json', JSON.stringify({ base, checks, createdUserIds: state.accounts.map(a => a.id), seededOrderIds: state.accounts.map(a => a.orderId) }, null, 2))
}
