import { cartFingerprint, decimalCents, quoteCheckout } from './quote'
import { PayPalError } from './paypal'
import { PaymentError, type PaymentOrder, type PaymentRepository, type PayPalGateway, type PayPalOrder } from './types'

export function inspectPayPal(order: PaymentOrder, external: PayPalOrder): { kind: 'paid' | 'pending'; captureId: string } | null {
  const fail = () => { throw new PaymentError(502, 'PAYMENT_MISMATCH', 'This payment needs verification. Please do not pay this order again.') }
  if (external.id !== order.paypalOrderId || (external.intent && external.intent !== 'CAPTURE') || external.purchase_units?.length !== 1) return fail()
  const unit = external.purchase_units[0]
  if (unit.reference_id !== order.id || (unit.custom_id && unit.custom_id !== order.id) || !unit.amount || unit.amount.currency_code !== order.currency || decimalCents(unit.amount.value) !== order.totalCents) return fail()
  const captures = unit.payments?.captures || []
  if (!captures.length) { if (external.status === 'COMPLETED') return fail(); return null }
  if (captures.length !== 1) return fail()
  const capture = captures[0]
  if (!capture.id || capture.amount.currency_code !== order.currency || decimalCents(capture.amount.value) !== order.totalCents || (order.paypalCaptureId && capture.id !== order.paypalCaptureId)) return fail()
  if (capture.status === 'COMPLETED') return { kind: 'paid', captureId: capture.id }
  return { kind: 'pending', captureId: capture.id }
}

export function createPaymentService(repository: PaymentRepository, paypal: PayPalGateway, now: () => Date = () => new Date()) {
  async function owned(userId: string, id: string) {
    const order = await repository.owned(id, userId)
    if (!order) throw new PaymentError(404, 'ORDER_NOT_FOUND', 'This order is not available.')
    return order
  }
  async function observe(order: PaymentOrder, external: PayPalOrder) {
    const result = inspectPayPal(order, external)
    if (result?.kind === 'paid') await repository.paid(order.id, result.captureId, now())
    else if (result?.kind === 'pending') await repository.processing(order.id, result.captureId)
    return result
  }
  return {
    async create(userId: string, input: unknown) {
      const quote = quoteCheckout(input)
      const order = await repository.draft(userId, quote.checkoutKey, quote.items, quote.totalCents)
      if (order.userId !== userId) throw new PaymentError(404, 'ORDER_NOT_FOUND', 'This checkout is not available.')
      if (cartFingerprint(order.items) !== cartFingerprint(quote.items) || order.totalCents !== quote.totalCents) throw new PaymentError(409, 'CART_CHANGED', 'Start a new checkout for the changed cart.')
      if (order.status !== 'PENDING') return order
      if (!order.paypalOrderId) {
        const external = await paypal.createOrder(order)
        if (!external.id) throw new PaymentError(502, 'PAYPAL_UNAVAILABLE', 'PayPal could not start this checkout.')
        await repository.attach(order.id, external.id)
      }
      return owned(userId, order.id)
    },
    async capture(userId: string, id: string) {
      let order = await owned(userId, id)
      if (order.status === 'PAID') return order
      if (order.status === 'CANCELED' || order.status === 'FAILED' || !order.paypalOrderId) throw new PaymentError(409, 'ORDER_NOT_PAYABLE', 'This order cannot be paid. Start a new checkout if needed.')
      const external = await paypal.getOrder(order.paypalOrderId)
      if (await observe(order, external)) return owned(userId, id)
      if (external.status !== 'APPROVED') throw new PaymentError(409, 'APPROVAL_REQUIRED', 'Approve this order in PayPal first.')
      if (order.status === 'PROCESSING' && now().getTime() - order.updatedAt.getTime() < 30_000) return order
      if (!await repository.claimCapture(order, now())) return owned(userId, id)
      try { await observe(order, await paypal.captureOrder(order.paypalOrderId, order.id)) }
      catch (error) {
        if (error instanceof PayPalError && error.issue === 'INSTRUMENT_DECLINED') { await repository.releaseCapture(id); throw error }
        // A timeout can occur after PayPal captured. Query before considering any retry.
        try { order = await owned(userId, id); if (await observe(order, await paypal.getOrder(order.paypalOrderId!))) return owned(userId, id) }
        catch { /* Keep PROCESSING; a later explicit reconciliation can recover. */ }
        throw error
      }
      return owned(userId, id)
    },
    async reconcile(userId: string, id: string) {
      const order = await owned(userId, id)
      if (order.status === 'PAID' || !order.paypalOrderId) return order
      await observe(order, await paypal.getOrder(order.paypalOrderId))
      return owned(userId, id)
    },
    async cancel(userId: string, id: string) {
      const order = await owned(userId, id)
      if (order.status === 'PAID' || order.status === 'CANCELED') return order
      if (order.paypalOrderId && await observe(order, await paypal.getOrder(order.paypalOrderId))) return owned(userId, id)
      if (order.status === 'PROCESSING') throw new PaymentError(409, 'PAYMENT_PROCESSING', 'We are checking this payment. Please check its status before trying again.')
      await repository.cancel(id)
      return owned(userId, id)
    },
  }
}
