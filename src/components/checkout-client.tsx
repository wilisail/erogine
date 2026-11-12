'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { findProduct, money } from '@/lib/catalogue'
import { cartTotal, parseCart, type CartLine } from '@/lib/cart'
import { ApiClientError, browserSession, paymentMutation, readResponse } from '@/lib/api-client'
import { useCart } from './cart-provider'
import { PayPalPaymentForm } from './paypal-payment-form'

type ActiveCheckout = { key: string; id?: string; paypalId?: string; items: CartLine[] }
const fingerprint = (items: CartLine[]) => JSON.stringify([...items].sort((a, b) => a.productId.localeCompare(b.productId)))
export function CheckoutClient({ clientId, userId }: { clientId: string | null; userId: string }) {
  const router = useRouter(), cart = useCart()
  const [cartKey, setCartKey] = useState(0), [restoring, setRestoring] = useState(true)
  const [restoreBlocked, setRestoreBlocked] = useState(false)
  const [lockedItems, setLockedItems] = useState<CartLine[] | null>(null)
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const current = useRef<ActiveCheckout>({ key: '', items: [] })
  const latestCart = useRef(cart)
  useEffect(() => { latestCart.current = cart }, [cart])
  const storageKey = 'erogine-checkout-v1:' + userId
  function persist(value: ActiveCheckout | null) {
    try { if (value) sessionStorage.setItem(storageKey, JSON.stringify(value)); else sessionStorage.removeItem(storageKey) } catch { /* Retry protection still applies to the current page. */ }
  }
  useEffect(() => {
    let canceled = false
    async function restore() {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
        if (!saved || typeof saved.key !== 'string' || !/^[a-f\d-]{36}$/i.test(saved.key)) return
        const items = parseCart(saved.items)
        if (!items.length) return
        if (typeof saved.id !== 'string') { current.current = { key: saved.key, items }; setLockedItems(items); return }
        await browserSession()
        const { order } = await readResponse(await fetch('/api/payments/orders/' + encodeURIComponent(saved.id), { cache: 'no-store' }))
        if (canceled) return
        if (order.status === 'PAID' || order.status === 'PROCESSING') {
          if (order.status === 'PAID') {
            if (fingerprint(latestCart.current.items) === fingerprint(items)) latestCart.current.clear()
            try { sessionStorage.removeItem(storageKey) } catch { /* no-op */ }
          }
          router.replace('/orders/' + order.id); return
        }
        if (order.status !== 'PENDING') { sessionStorage.removeItem(storageKey); return }
        const verified = parseCart(order.items)
        current.current = { key: saved.key, id: order.id, paypalId: order.paypalOrderId, items: verified }
        setLockedItems(verified); setOrderId(order.id)
      } catch (error) {
        if (!canceled) {
          if (error instanceof ApiClientError && error.code === 'ORDER_NOT_FOUND') { try { sessionStorage.removeItem(storageKey) } catch { /* no-op */ } }
          else { setRestoreBlocked(true); setMessage('A previous checkout may need checking. Open your account before starting another payment.') }
        }
      } finally { if (!canceled) setRestoring(false) }
    }
    void restore()
    return () => { canceled = true }
  }, [storageKey, router])
  const items = lockedItems ?? cart.items
  async function createOrder() {
    setMessage(''); setBusy(true)
    try {
      if (!current.current.key) current.current = { key: crypto.randomUUID(), items: cart.items }
      if (!current.current.items.length) throw new Error('Add a product to your cart first.')
      setLockedItems(current.current.items); persist(current.current)
      const { order } = await paymentMutation('/api/payments/orders', { checkoutKey: current.current.key, items: current.current.items })
      current.current.id = order.id; setOrderId(order.id)
      current.current.paypalId = order.paypalOrderId; persist(current.current)
      if (order.status !== 'PENDING' || !order.paypalOrderId) {
        router.push('/orders/' + order.id)
        throw new Error('Check the existing order before paying again.')
      }
      return order.paypalOrderId as string
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Checkout could not start.'); throw error }
    finally { setBusy(false) }
  }
  async function onApproved(paypalId: string): Promise<'completed' | 'restart'> {
    setBusy(true); setMessage('Verifying your sandbox payment…')
    try {
      const order = current.current
      if (!order.id || paypalId !== order.paypalId) throw new Error('The approved order could not be matched. Open your orders to check it.')
      const result = await paymentMutation('/api/payments/orders/' + order.id + '/capture')
      if (result.order.status === 'PAID') {
        if (fingerprint(cart.items) === fingerprint(order.items)) cart.clear()
        persist(null)
      }
      router.push('/orders/' + order.id); router.refresh()
      return 'completed'
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'INSTRUMENT_DECLINED') { setMessage(error.message); return 'restart' }
      setMessage(error instanceof Error ? error.message : 'The payment needs verification. Open your order to check its status.')
      throw error
    } finally { setBusy(false) }
  }
  async function onCancel() {
    if (!current.current.id) return
    setBusy(true)
    try {
      const { order } = await paymentMutation('/api/payments/orders/' + current.current.id + '/cancel')
      if (order.status !== 'CANCELED') { router.push('/orders/' + order.id); return }
      current.current = { key: '', items: [] }; persist(null); setLockedItems(null); setOrderId(null); setCartKey(key => key + 1)
      setMessage('Checkout canceled. No completed payment was confirmed. You can try again.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Open your order to check its status.') }
    finally { setBusy(false) }
  }
  return <section className="container checkout-layout">
    <div><Link href="/cart" className="back-link">← Back to your cart</Link><p className="eyebrow">Your little collection</p><h1>A small find.<br /><em>A little joy.</em></h1>
      {!cart.ready || restoring ? <p className="muted" role="status">Opening your checkout…</p> : items.length ? items.map(line => { const product = findProduct(line.productId)!; return <div className="checkout-line" key={line.productId}><span>{product.title} × {line.quantity}</span><strong>{money(product.priceCents * line.quantity)}</strong></div> }) : <div className="empty-state"><h2>Your cart is waiting.</h2><p>Add a discovery before checking out.</p><Link href="/shop" className="button primary">Explore the shop →</Link></div>}
      {lockedItems ? <p className="checkout-note">These items are saved for this checkout. Finish or cancel it before starting another payment.</p> : <p className="muted">A few good finds, ready for a new home.</p>}</div>
    <div className="checkout-card"><span className="small-label">PAYPAL SANDBOX CHECKOUT</span><h2>Your little discovery</h2>
      <p className="muted">This is a learning demo. Use a PayPal sandbox buyer account. No physical item will be shipped.</p>
      <div className="checkout-line total"><span>Total · USD</span><strong>{cart.ready && !restoring ? money(cartTotal(items)) : '—'}</strong></div>
      {clientId ? (cart.ready && !restoring && !restoreBlocked && items.length ? <PayPalPaymentForm clientId={clientId} cartKey={cartKey} createOrder={createOrder} onApproved={onApproved} onCancel={onCancel} onError={setMessage} /> : null) : <div className="setup-notice"><strong>Sandbox setup in progress</strong><p>PayPal checkout will appear here after the sandbox application is connected.</p></div>}
      {restoreBlocked ? <Link href="/account" className="button secondary">Check your existing orders →</Link> : null}
      {message && <p className="payment-message" role="status">{message}</p>}
      {orderId && <Link href={'/orders/' + orderId} className="text-link">Open this order and check its status →</Link>}
      {busy ? <p className="muted" role="status">Checking with PayPal…</p> : null}
      <p className="checkout-note">Your payment status is verified by Erogine’s server.</p>
    </div>
  </section>
}
