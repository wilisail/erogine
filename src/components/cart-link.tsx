'use client'
import Link from 'next/link'
import { useCart } from './cart-provider'
export function CartLink() {
  const { items, ready } = useCart()
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return <Link className="cart-link" href="/cart" aria-label={ready ? `Cart, ${count} items` : 'Cart'}>Cart{ready && count > 0 ? <span>{count}</span> : null}</Link>
}
