import { z } from 'zod'
import { products } from '../../lib/catalogue'
import { PaymentError, type LineItem } from './types'

const checkout = z.strictObject({ checkoutKey: z.uuid(), items: z.array(z.strictObject({ productId: z.string().min(1).max(80), quantity: z.int().min(1).max(99) })).min(1).max(12) })
export function quoteCheckout(input: unknown) {
  const parsed = checkout.safeParse(input)
  if (!parsed.success) throw new PaymentError(400, 'INVALID_CART', 'Check the products and quantities in your cart.')
  const seen = new Set<string>()
  const items: LineItem[] = parsed.data.items.map(line => {
    const product = products.find(p => p.id === line.productId)
    if (!product || seen.has(line.productId)) throw new PaymentError(400, 'INVALID_PRODUCT', 'This product is not available in this cart.')
    seen.add(line.productId)
    return { productId: product.id, title: product.title, quantity: line.quantity, unitPriceCents: product.priceCents }
  }).sort((a, b) => a.productId.localeCompare(b.productId))
  return { checkoutKey: parsed.data.checkoutKey, items, totalCents: items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0) }
}
export const cartFingerprint = (items: LineItem[]) => JSON.stringify([...items].sort((a, b) => a.productId.localeCompare(b.productId)).map(i => [i.productId, i.quantity, i.unitPriceCents]))
export function decimalCents(value: string): number {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) throw new PaymentError(502, 'PAYMENT_MISMATCH', 'The payment amount could not be verified.')
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
