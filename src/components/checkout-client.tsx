'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { money, products } from '@/lib/catalogue'
import { ApiClientError, paymentMutation } from '@/lib/api-client'
import { PayPalPaymentForm } from './paypal-payment-form'

export function CheckoutClient({ clientId }: { clientId: string | null }) {
  const router = useRouter(), product = products[0]
  const [quantity, setQuantity] = useState(1), [cartKey, setCartKey] = useState(0)
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const current = useRef<{ key: string; id?: string; paypalId?: string }>({ key: '' })
  async function createOrder() {
    setMessage(''); setBusy(true)
    try {
      if (!current.current.key) current.current.key = crypto.randomUUID()
      const { order } = await paymentMutation('/api/payments/orders', { checkoutKey: current.current.key, items: [{ productId: product.id, quantity }] })
      current.current.id = order.id; setOrderId(order.id)
      if (order.status !== 'PENDING' || !order.paypalOrderId) {
        router.push('/orders/' + order.id)
        throw new Error('Check the existing order before paying again.')
      }
      current.current.paypalId = order.paypalOrderId
      return order.paypalOrderId as string
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Checkout could not start.'); throw error }
    finally { setBusy(false) }
  }
  async function onApproved(paypalId: string): Promise<'completed' | 'restart'> {
    setBusy(true); setMessage('Verifying your sandbox payment…')
    try {
      const order = current.current
      if (!order.id || paypalId !== order.paypalId) throw new Error('The approved order could not be matched. Open your orders to check it.')
      await paymentMutation('/api/payments/orders/' + order.id + '/capture')
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
      current.current = { key: '' }; setOrderId(null); setCartKey(key => key + 1)
      setMessage('Checkout canceled. No completed payment was confirmed. You can try again.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Open your order to check its status.') }
    finally { setBusy(false) }
  }
  return <section className="container checkout-layout">
    <div><Link href="/" className="back-link">← Back to Erogine</Link><p className="eyebrow">The everyday collection · 01</p><h1>A small find.<br /><em>A little joy.</em></h1>
      <div className="product-art" role="img" aria-label="A wooden toy car illustration"><div className="toy-car"><i /><i /></div></div>
      <h2>{product.title}</h2><p className="muted">{product.description}</p></div>
    <div className="checkout-card"><span className="small-label">PAYPAL SANDBOX CHECKOUT</span><h2>Your little discovery</h2>
      <p className="muted">This is a learning demo. Use a PayPal sandbox buyer account. No physical item will be shipped.</p>
      <div className="checkout-line"><span>Each</span><strong>{money(product.priceCents)}</strong></div>
      <label className="quantity-label" htmlFor="quantity">Quantity<select id="quantity" value={quantity} disabled={busy || Boolean(orderId)} onChange={event => { setQuantity(Number(event.target.value)); current.current = { key: '' }; setCartKey(key => key + 1) }}>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label>
      <div className="checkout-line total"><span>Total · USD</span><strong>{money(product.priceCents * quantity)}</strong></div>
      {clientId ? <PayPalPaymentForm clientId={clientId} cartKey={cartKey} createOrder={createOrder} onApproved={onApproved} onCancel={onCancel} onError={setMessage} /> : <div className="setup-notice"><strong>Sandbox setup in progress</strong><p>PayPal checkout will appear here after the sandbox application is connected.</p></div>}
      {message && <p className="payment-message" role="status">{message}</p>}
      {orderId && <Link href={'/orders/' + orderId} className="text-link">Open this order and check its status →</Link>}
      <p className="checkout-note">Your payment status is verified by Erogine’s server.</p>
    </div>
  </section>
}
