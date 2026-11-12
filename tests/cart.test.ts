import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { cartTotal, changeCart, parseCart } from '../src/lib/cart'
import { products } from '../src/lib/catalogue'
import { quoteCheckout } from '../src/server/payments/quote'

test('restored carts strip forged prices and reject unknown, duplicate and unbounded lines', () => {
  assert.deepEqual(parseCart([{ productId: products[0].id, quantity: 2, priceCents: 1, userId: 'victim' }]), [{ productId: products[0].id, quantity: 2 }])
  for (const value of [null, {}, [{ productId: 'missing', quantity: 1 }], [{ productId: products[0].id, quantity: 1.2 }], [{ productId: products[0].id, quantity: 100 }], [{ productId: products[0].id, quantity: -1 }], Array(13).fill({ productId: products[0].id, quantity: 1 }), [ { productId: products[0].id, quantity: 1 }, { productId: products[0].id, quantity: 1 } ]]) assert.deepEqual(parseCart(value), [])
})
test('mixed cart quantities and removal preserve catalogue totals used by checkout', () => {
  let items = changeCart([], products[0].id, 2)
  items = changeCart(items, products[2].id, 3)
  assert.equal(cartTotal(items), 7200)
  assert.equal(quoteCheckout({ checkoutKey: randomUUID(), items }).totalCents, cartTotal(items))
  items = changeCart(items, products[0].id, 0)
  assert.equal(cartTotal(items), 3600)
  assert.deepEqual(changeCart(items, 'fake-product', 1), items)
  assert.deepEqual(changeCart(items, products[1].id, 100), items)
})
