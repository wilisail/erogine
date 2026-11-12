import { findProduct } from './catalogue'
export type CartLine = { productId: string; quantity: number }
export const CART_STORAGE_KEY = 'erogine-cart-v1'
// Browser storage is untrusted. Retain only known IDs and bounded quantities;
// prices are always looked up again, and the server independently validates.
export function parseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value) || value.length > 12) return []
  const seen = new Set<string>(), result: CartLine[] = []
  for (const row of value) {
    if (!row || typeof row.productId !== 'string' || !findProduct(row.productId) || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 99 || seen.has(row.productId)) return []
    seen.add(row.productId); result.push({ productId: row.productId, quantity: row.quantity })
  }
  return result
}
export function changeCart(items: CartLine[], productId: string, quantity: number): CartLine[] {
  if (!findProduct(productId) || !Number.isInteger(quantity) || quantity < 0 || quantity > 99) return items
  const next = items.filter(item => item.productId !== productId)
  if (quantity) next.push({ productId, quantity })
  return next
}
export const cartTotal = (items: CartLine[]) => items.reduce((sum, item) => sum + (findProduct(item.productId)?.priceCents ?? 0) * item.quantity, 0)
