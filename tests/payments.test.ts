import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { createPaymentService, inspectPayPal } from '../src/server/payments/service'
import { createPayPalGateway, PayPalError, requestId } from '../src/server/payments/paypal'
import { decimalCents, quoteCheckout } from '../src/server/payments/quote'
import { receipt, type PaymentOrder, type PaymentRepository, type PayPalGateway, type PayPalOrder } from '../src/server/payments/types'

const cart = (key = randomUUID(), quantity = 1) => ({ checkoutKey: key, items: [{ productId: 'orbit-city-cruiser', quantity }] })
const clone = <T>(value: T): T => structuredClone(value)
function fixture() {
  const rows = new Map<string, PaymentOrder>()
  let clock = new Date('2026-11-12T00:00:00.000Z')
  const now = () => new Date(clock)
  function update(id: string, patch: Partial<PaymentOrder>) { Object.assign(rows.get(id)!, patch, { updatedAt: now() }) }
  const repository: PaymentRepository = {
    async draft(userId, checkoutKey, items, totalCents) {
      const existing = [...rows.values()].find(row => row.checkoutKey === checkoutKey)
      if (existing) return clone(existing)
      const row: PaymentOrder = { id: randomUUID(), userId, checkoutKey, status: 'PENDING', currency: 'USD', totalCents, items,
        paypalOrderId: null, paypalCaptureId: null, createdAt: now(), updatedAt: now(), paidAt: null }
      rows.set(row.id, clone(row)); return clone(row)
    },
    async owned(id, userId) { const row = rows.get(id); return row?.userId === userId ? clone(row) : null },
    async attach(id, paypalOrderId) { const row = rows.get(id)!; if (!row.paypalOrderId && row.status === 'PENDING') update(id, { paypalOrderId }) },
    async claimCapture(order) {
      const row = rows.get(order.id)!
      if (row.status !== order.status || row.updatedAt.getTime() !== order.updatedAt.getTime()) return false
      update(row.id, { status: 'PROCESSING' }); return true
    },
    async paid(id, paypalCaptureId, paidAt) { if (rows.get(id)!.status !== 'PAID') update(id, { status: 'PAID', paypalCaptureId, paidAt }) },
    async processing(id, paypalCaptureId) { if (rows.get(id)!.status !== 'PAID') update(id, { status: 'PROCESSING', paypalCaptureId }) },
    async releaseCapture(id) { const row = rows.get(id)!; if (row.status === 'PROCESSING' && !row.paypalCaptureId) update(id, { status: 'PENDING' }) },
    async cancel(id) { const row = rows.get(id)!; if (row.status !== 'PENDING' || row.paypalCaptureId) return false; update(id, { status: 'CANCELED' }); return true },
  }
  let state = 'CREATED', captureState: string | null = null, reads = 0, captures = 0, creates = 0
  let captureBehavior: (() => Promise<void>) | undefined
  function external(): PayPalOrder {
    const order = [...rows.values()][0]
    return { id: 'PAYPAL-TEST-ORDER', status: state, intent: 'CAPTURE', purchase_units: [{ reference_id: order.id, custom_id: order.id,
      amount: { currency_code: 'USD', value: (order.totalCents / 100).toFixed(2) },
      ...(captureState ? { payments: { captures: [{ id: 'CAPTURE-TEST', status: captureState, amount: { currency_code: 'USD', value: (order.totalCents / 100).toFixed(2) } }] } } : {}),
    }] }
  }
  const paypal: PayPalGateway = {
    async createOrder() { creates++; return external() },
    async getOrder() { reads++; return external() },
    async captureOrder() { captures++; if (captureBehavior) await captureBehavior(); else { state = 'COMPLETED'; captureState = 'COMPLETED' }; return external() },
  }
  const service = createPaymentService(repository, paypal, now)
  return { service, repository, rows, paypal, external, counts: () => ({ reads, captures, creates }),
    approve: () => { state = 'APPROVED' }, captured: (status = 'COMPLETED') => { state = 'COMPLETED'; captureState = status },
    captureUsing: (fn: () => Promise<void>) => { captureBehavior = fn }, advance: () => { clock = new Date(clock.getTime() + 31_000) } }
}

test('server quotes integer cents and rejects price, currency, customer and invalid cart injection', () => {
  assert.equal(quoteCheckout(cart(undefined, 3)).totalCents, 5400)
  for (const input of [
    { ...cart(), totalCents: 1 }, { ...cart(), currency: 'IDR' }, { ...cart(), userId: 'victim' },
    cart(undefined, 0), cart(undefined, -1), cart(undefined, 1.5), cart(undefined, 100),
    { ...cart(), items: [{ productId: 'unknown', quantity: 1 }] },
    { ...cart(), items: [...cart().items, ...cart().items] },
    { ...cart(), items: [{ ...cart().items[0], unitPriceCents: 1 }] },
  ]) assert.throws(() => quoteCheckout(input))
  for (const [text, cents] of [['18', 1800], ['18.0', 1800], ['0.01', 1]] as const) assert.equal(decimalCents(text), cents)
  for (const text of ['1.001', '-1', '1e3', 'NaN', '18 USD']) assert.throws(() => decimalCents(text))
})

test('checkout retry reuses one order; changed carts and other customers cannot reuse its key', async () => {
  const f = fixture(), input = cart()
  const first = await f.service.create('owner', input), retry = await f.service.create('owner', input)
  assert.equal(first.id, retry.id); assert.equal(f.rows.size, 1); assert.equal(f.counts().creates, 1)
  await assert.rejects(f.service.create('owner', cart(input.checkoutKey, 2)), { code: 'CART_CHANGED' })
  await assert.rejects(f.service.create('intruder', input), { status: 404 })
  assert.equal('userId' in receipt(first), false); assert.equal('checkoutKey' in receipt(first), false)
})

test('ownership is checked before any capture, cancellation or reconciliation provider request', async () => {
  const f = fixture(), order = await f.service.create('owner', cart())
  for (const action of ['capture', 'cancel', 'reconcile'] as const) await assert.rejects(f.service[action]('intruder', order.id), { status: 404 })
  assert.equal(f.counts().reads, 0); assert.equal(f.counts().captures, 0)
})

test('created orders cannot capture; approval by itself is never a paid receipt', async () => {
  const f = fixture(), order = await f.service.create('owner', cart())
  await assert.rejects(f.service.capture('owner', order.id), { code: 'APPROVAL_REQUIRED' })
  f.approve()
  assert.equal((await f.service.reconcile('owner', order.id)).status, 'PENDING')
  assert.equal(f.counts().captures, 0)
})

test('concurrent capture requests and later retries produce a single completed capture', async () => {
  const f = fixture(), order = await f.service.create('owner', cart())
  f.approve(); f.captureUsing(async () => { await new Promise(resolve => setTimeout(resolve, 10)); f.captured() })
  await Promise.all([f.service.capture('owner', order.id), f.service.capture('owner', order.id)])
  assert.equal((await f.service.capture('owner', order.id)).status, 'PAID')
  assert.equal(f.counts().captures, 1); assert.equal(f.rows.get(order.id)!.paypalCaptureId, 'CAPTURE-TEST')
})

test('wrong provider identity, reference, currency, amount, capture ID and split captures cannot mark paid', async () => {
  const f = fixture(), order = await f.service.create('owner', cart())
  f.captured()
  const mutate = [
    (p: PayPalOrder) => { p.id = 'ANOTHER' }, (p: PayPalOrder) => { p.intent = 'AUTHORIZE' },
    (p: PayPalOrder) => { p.purchase_units![0].reference_id = randomUUID() },
    (p: PayPalOrder) => { p.purchase_units![0].custom_id = 'wrong' },
    (p: PayPalOrder) => { p.purchase_units![0].amount!.value = '0.01' },
    (p: PayPalOrder) => { p.purchase_units![0].amount!.currency_code = 'EUR' },
    (p: PayPalOrder) => { p.purchase_units![0].payments!.captures![0].amount.value = '0.01' },
    (p: PayPalOrder) => { p.purchase_units![0].payments!.captures![0].amount.currency_code = 'EUR' },
    (p: PayPalOrder) => { p.purchase_units![0].payments!.captures!.push(clone(p.purchase_units![0].payments!.captures![0])) },
    (p: PayPalOrder) => { p.purchase_units![0].payments!.captures = [] },
  ]
  for (const change of mutate) { const response = f.external(); change(response); assert.throws(() => inspectPayPal(order, response), { code: 'PAYMENT_MISMATCH' }) }
  assert.throws(() => inspectPayPal({ ...order, paypalCaptureId: 'PREVIOUS-CAPTURE' }, f.external()), { code: 'PAYMENT_MISMATCH' })
  assert.equal(f.rows.get(order.id)!.status, 'PENDING')
})

test('a pending capture stays PROCESSING and status checks never recapture it', async () => {
  const f = fixture(), order = await f.service.create('owner', cart()); f.approve()
  f.captureUsing(async () => f.captured('PENDING'))
  assert.equal((await f.service.capture('owner', order.id)).status, 'PROCESSING')
  assert.equal((await f.service.capture('owner', order.id)).status, 'PROCESSING')
  assert.equal(f.counts().captures, 1)
  f.captured(); assert.equal((await f.service.reconcile('owner', order.id)).status, 'PAID')
})

test('a timeout after a successful capture is recovered from the provider instead of charging again', async () => {
  const f = fixture(), order = await f.service.create('owner', cart()); f.approve()
  f.captureUsing(async () => { f.captured(); throw new PayPalError('NETWORK_UNCERTAIN') })
  assert.equal((await f.service.capture('owner', order.id)).status, 'PAID')
  assert.equal(f.counts().captures, 1)
})

test('an uncertain timeout stays PROCESSING; immediate retry waits, later retry can recover', async () => {
  const f = fixture(), order = await f.service.create('owner', cart()); f.approve()
  f.captureUsing(async () => { throw new PayPalError('NETWORK_UNCERTAIN') })
  await assert.rejects(f.service.capture('owner', order.id), { code: 'PAYPAL_UNAVAILABLE' })
  assert.equal(f.rows.get(order.id)!.status, 'PROCESSING')
  await f.service.capture('owner', order.id); assert.equal(f.counts().captures, 1)
  f.advance(); f.captureUsing(async () => f.captured())
  assert.equal((await f.service.capture('owner', order.id)).status, 'PAID')
})

test('funding decline allows another instrument, and unpaid cancellation never initiates a capture', async () => {
  const f = fixture(), order = await f.service.create('owner', cart()); f.approve()
  f.captureUsing(async () => { throw new PayPalError('INSTRUMENT_DECLINED') })
  await assert.rejects(f.service.capture('owner', order.id), { code: 'INSTRUMENT_DECLINED' })
  assert.equal(f.rows.get(order.id)!.status, 'PENDING')
  assert.equal((await f.service.cancel('owner', order.id)).status, 'CANCELED')
  await assert.rejects(f.service.capture('owner', order.id), { code: 'ORDER_NOT_PAYABLE' })
  assert.equal(f.counts().captures, 1)
})

test('canceling an already completed provider payment preserves its paid receipt', async () => {
  const f = fixture(), order = await f.service.create('owner', cart()); f.captured()
  assert.equal((await f.service.cancel('owner', order.id)).status, 'PAID')
  assert.equal(f.counts().captures, 0)
})

test('a mismatched capture is held for checking and never becomes a paid order', async () => {
  const f = fixture(), order = await f.service.create('owner', cart()); f.approve()
  f.paypal.captureOrder = async () => { f.captured(); const response = f.external(); response.purchase_units![0].amount!.value = '1.00'; return response }
  const originalGet = f.paypal.getOrder
  f.paypal.getOrder = async id => { const response = await originalGet(id); if (response.status === 'COMPLETED') response.purchase_units![0].amount!.value = '1.00'; return response }
  await assert.rejects(f.service.capture('owner', order.id), { code: 'PAYMENT_MISMATCH' })
  assert.equal(f.rows.get(order.id)!.status, 'PROCESSING'); assert.equal(f.rows.get(order.id)!.paidAt, null)
})

test('gateway uses sandbox OAuth, authoritative amounts and stable distinct operation keys', async () => {
  const f = fixture(), order = await f.service.create('owner', cart(undefined, 2)); f.captured()
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const send: typeof fetch = async (input, init) => {
    const url = String(input); calls.push({ url, init })
    if (url.endsWith('/token')) return Response.json({ access_token: 'test-only-token', expires_in: 3600 })
    return Response.json(f.external())
  }
  const gateway = createPayPalGateway({ clientId: 'test-client', clientSecret: 'test-secret', fetch: send })
  await gateway.createOrder(order); await gateway.createOrder(order); await gateway.captureOrder(order.paypalOrderId!, order.id)
  assert(calls.every(call => call.url.startsWith('https://api-m.sandbox.paypal.com/')))
  assert.equal(calls.filter(call => call.url.endsWith('/token')).length, 1)
  assert.equal(new Headers(calls[0].init!.headers).get('authorization'), 'Basic ' + Buffer.from('test-client:test-secret').toString('base64'))
  const posts = calls.filter(call => call.init?.method === 'POST' && !call.url.endsWith('/token'))
  assert.equal(new Headers(posts[0].init!.headers).get('PayPal-Request-Id'), new Headers(posts[1].init!.headers).get('PayPal-Request-Id'))
  assert.notEqual(requestId(order.id, 'create'), requestId(order.id, 'capture')); assert(requestId(order.id, 'capture').length <= 38)
  const payload = JSON.parse(String(posts[0].init!.body))
  assert.equal(payload.purchase_units[0].amount.value, '36.00'); assert.equal(payload.purchase_units[0].custom_id, order.id)
  assert.equal(payload.purchase_units[0].items[0].unit_amount.value, '18.00')
  assert.equal(new Headers(posts[0].init!.headers).get('authorization'), 'Bearer test-only-token')
  assert(calls.at(-1)!.url.endsWith(order.paypalOrderId!)); assert.equal(calls.at(-1)!.init!.method, 'GET')
})

test('already captured responses are reconciled, provider internals never become user-facing errors', async () => {
  let tokens = 0
  const send: typeof fetch = async (input, init) => {
    if (String(input).endsWith('/token')) { tokens++; return Response.json({ access_token: 'test-token', expires_in: 3600 }) }
    if (init?.method === 'POST') return Response.json({ details: [{ issue: 'ORDER_ALREADY_CAPTURED' }], debug_id: 'sensitive-debug' }, { status: 422 })
    return Response.json({ id: 'PAYPAL-TEST', status: 'COMPLETED' })
  }
  const gateway = createPayPalGateway({ clientId: 'test', clientSecret: 'test', fetch: send })
  assert.equal((await gateway.captureOrder('PAYPAL-TEST', randomUUID())).status, 'COMPLETED')
  await Promise.all([gateway.getOrder('PAYPAL-TEST'), gateway.getOrder('PAYPAL-TEST')]); assert.equal(tokens, 1)
  const broken = createPayPalGateway({ clientId: 'test', clientSecret: 'test', fetch: async () => { throw new Error('private-secret') } })
  await assert.rejects(broken.getOrder('PAYPAL-TEST'), (error: unknown) => error instanceof PayPalError && !error.message.includes('private-secret'))
})
