export class PaymentError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}
export interface LineItem { productId: string; title: string; quantity: number; unitPriceCents: number }
export interface PaymentOrder {
  id: string; userId: string; checkoutKey: string; status: string; currency: string; totalCents: number
  paypalOrderId: string | null; paypalCaptureId: string | null
  createdAt: Date; updatedAt: Date; paidAt: Date | null; items: LineItem[]
}
export interface PayPalOrder {
  id: string; status: string; intent?: string
  purchase_units?: Array<{
    reference_id?: string; custom_id?: string; amount?: { currency_code: string; value: string }
    payments?: { captures?: Array<{ id: string; status: string; amount: { currency_code: string; value: string } }> }
  }>
}
export interface PayPalGateway {
  createOrder(order: PaymentOrder): Promise<PayPalOrder>
  getOrder(id: string): Promise<PayPalOrder>
  captureOrder(id: string, localOrderId: string): Promise<PayPalOrder>
}
export interface PaymentRepository {
  draft(userId: string, checkoutKey: string, items: LineItem[], totalCents: number): Promise<PaymentOrder>
  owned(id: string, userId: string): Promise<PaymentOrder | null>
  attach(id: string, paypalId: string): Promise<void>
  claimCapture(order: PaymentOrder, now: Date): Promise<boolean>
  paid(id: string, captureId: string, now: Date): Promise<void>
  processing(id: string, captureId: string): Promise<void>
  releaseCapture(id: string): Promise<void>
  cancel(id: string): Promise<boolean>
}
export function receipt(order: PaymentOrder) {
  return { id: order.id, status: order.status, currency: order.currency, totalCents: order.totalCents,
    paypalOrderId: order.paypalOrderId, paypalCaptureId: order.paypalCaptureId, paidAt: order.paidAt,
    createdAt: order.createdAt, items: order.items.map(({ productId, title, quantity, unitPriceCents }) => ({ productId, title, quantity, unitPriceCents })) }
}
