import { PaymentError, type PaymentOrder, type PayPalGateway, type PayPalOrder } from './types'

const BASE = 'https://api-m.sandbox.paypal.com'
export class PayPalError extends PaymentError {
  constructor(public issue: string) { super(502, issue === 'INSTRUMENT_DECLINED' ? issue : 'PAYPAL_UNAVAILABLE', issue === 'INSTRUMENT_DECLINED' ? 'PayPal declined this funding source. Please choose another.' : 'We could not confirm the PayPal response. Check this order before trying again.') }
}
export const requestId = (orderId: string, operation: 'create' | 'capture') => (operation === 'create' ? 'c' : 'p') + orderId
export function paypalConfig() {
  if (process.env.PAYPAL_ENVIRONMENT && process.env.PAYPAL_ENVIRONMENT !== 'sandbox') throw new PaymentError(503, 'SANDBOX_ONLY', 'This learning shop only supports the PayPal sandbox.')
  const clientId = process.env.PAYPAL_CLIENT_ID, clientSecret = process.env.PAYPAL_CLIENT_SECRET
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) }
}
export function createPayPalGateway(options: { clientId: string; clientSecret: string; fetch?: typeof fetch }): PayPalGateway {
  const send = options.fetch ?? fetch
  let token: { value: string; until: number } | undefined
  let tokenRequest: Promise<string> | undefined
  async function accessToken(): Promise<string> {
    if (token && token.until > Date.now()) return token.value
    if (tokenRequest) return tokenRequest
    tokenRequest = (async () => {
      const response = await send(BASE + '/v1/oauth2/token', { method: 'POST', headers: {
        Authorization: 'Basic ' + Buffer.from(options.clientId + ':' + options.clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(15000), cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || typeof data.access_token !== 'string') throw new PayPalError('AUTH_FAILED')
      token = { value: data.access_token, until: Date.now() + Math.max(0, Math.min(Number(data.expires_in) || 0, 300) - 30) * 1000 }
      return token.value
    })()
    try { return await tokenRequest } finally { tokenRequest = undefined }
  }
  async function request(path: string, method = 'GET', body?: object, id?: string): Promise<PayPalOrder> {
    let response: Response
    try {
      response = await send(BASE + path, { method, headers: { Authorization: 'Bearer ' + await accessToken(), 'Content-Type': 'application/json', Prefer: 'return=representation', ...(id ? { 'PayPal-Request-Id': id } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000), cache: 'no-store' })
    } catch (error) { if (error instanceof PayPalError) throw error; throw new PayPalError('NETWORK_UNCERTAIN') }
    const data = await response.json()
    if (!response.ok) throw new PayPalError(data.details?.[0]?.issue || data.name || 'UNAVAILABLE')
    if (typeof data.id !== 'string' || typeof data.status !== 'string') throw new PayPalError('INVALID_RESPONSE')
    return data as PayPalOrder
  }
  return {
    createOrder: order => request('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE', purchase_units: [{ reference_id: order.id, custom_id: order.id,
        description: 'Erogine sandbox order', amount: { currency_code: 'USD', value: (order.totalCents / 100).toFixed(2), breakdown: { item_total: { currency_code: 'USD', value: (order.totalCents / 100).toFixed(2) } } },
        items: order.items.map(item => ({ name: item.title, sku: item.productId, quantity: String(item.quantity), category: 'PHYSICAL_GOODS', unit_amount: { currency_code: 'USD', value: (item.unitPriceCents / 100).toFixed(2) } })),
      }], application_context: { brand_name: 'Erogine Sandbox', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' },
    }, requestId(order.id, 'create')),
    getOrder: id => request('/v2/checkout/orders/' + encodeURIComponent(id)),
    async captureOrder(id, localOrderId) {
      try { await request('/v2/checkout/orders/' + encodeURIComponent(id) + '/capture', 'POST', {}, requestId(localOrderId, 'capture')) }
      catch (error) { if (!(error instanceof PayPalError) || error.issue !== 'ORDER_ALREADY_CAPTURED') throw error }
      return request('/v2/checkout/orders/' + encodeURIComponent(id))
    },
  }
}
let shared: PayPalGateway | undefined
export function configuredPayPal(): PayPalGateway {
  const config = paypalConfig()
  if (!config.clientId || !config.clientSecret) throw new PaymentError(503, 'PAYPAL_NOT_CONFIGURED', 'PayPal sandbox setup is not finished yet.')
  shared ??= createPayPalGateway({ clientId: config.clientId, clientSecret: config.clientSecret })
  return shared
}
