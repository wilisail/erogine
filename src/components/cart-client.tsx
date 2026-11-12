'use client'
import Link from 'next/link'
import { cartTotal } from '@/lib/cart'
import { findProduct, money } from '@/lib/catalogue'
import { useCart } from './cart-provider'
import { ProductArt } from './product-art'
import { QuantityPicker } from './quantity-picker'
export function CartClient() {
  const { items, setQuantity, ready } = useCart()
  if (!ready) return <p className="container muted status-page" role="status">Opening your cart…</p>
  return <section className="container cart-layout"><Link href="/shop" className="back-link">← Keep discovering</Link><p className="eyebrow">Your little collection</p><h1>A few <em>good finds.</em></h1>{items.length ? <div className="cart-grid"><div>{items.map(line => { const product = findProduct(line.productId)!; return <article className="cart-row" key={line.productId}><Link href={'/products/' + product.id}><ProductArt product={product} /></Link><div><Link href={'/products/' + product.id}><h2>{product.title}</h2></Link><p className="muted">{money(product.priceCents)} each</p><QuantityPicker quantity={line.quantity} onChange={quantity => setQuantity(product.id, quantity)} label={product.title} /><button className="remove-item" onClick={() => setQuantity(product.id, 0)} aria-label={'Remove ' + product.title}>Remove</button></div><strong>{money(product.priceCents * line.quantity)}</strong></article> })}</div><aside className="cart-summary"><p className="small-label">ORDER SUMMARY</p><div className="checkout-line"><span>Items</span><strong>{items.reduce((sum, line) => sum + line.quantity, 0)}</strong></div><div className="checkout-line total"><span>Total · USD</span><strong>{money(cartTotal(items))}</strong></div><Link href="/checkout" className="button primary full">Continue to checkout →</Link><p className="checkout-note">PayPal sandbox · no real funds · no physical delivery. Sign in at checkout to keep your order private.</p></aside></div> : <div className="empty-state"><h2>Your next discovery is waiting.</h2><p>Add a little something from the shop to get started.</p><Link href="/shop" className="button primary">Explore the collection →</Link></div>}</section>
}
