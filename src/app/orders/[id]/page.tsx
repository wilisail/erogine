import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { currentSession } from '@/server/auth'
import { getDatabase } from '@/server/database'
import { money } from '@/lib/catalogue'
import { OrderActions } from '@/components/order-actions'
export const metadata: Metadata = { title: 'Your sandbox order' }
export const dynamic = 'force-dynamic'
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await currentSession()
  if (!session) redirect('/login')
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const order = await getDatabase().order.findFirst({ where: { id, userId: session.user.id }, include: { items: true } })
  if (!order) notFound()
  const paid = order.status === 'PAID'
  const explanation = paid ? 'The server verified a completed PayPal sandbox capture for this order.' : order.status === 'PROCESSING' ? 'The payment result needs checking. Please do not pay again while this order is being verified.' : order.status === 'CANCELED' ? 'This checkout was canceled. No completed payment was confirmed at cancellation.' : order.status === 'FAILED' ? 'This payment was not completed.' : 'Your order has not been confirmed as paid. PayPal approval alone does not complete the payment.'
  return <section className="container receipt-layout"><Link href="/account" className="back-link">← Your account</Link><p className="eyebrow">Your sandbox order</p><h1>{paid ? 'Payment' : 'Order'} <em>{paid ? 'verified.' : 'status.'}</em></h1>
    <div className="receipt-card"><span className="pill">{order.status}</span><p className="muted">{explanation}</p><dl className="receipt-details"><dt>Order</dt><dd>{order.id}</dd><dt>Created</dt><dd>{order.createdAt.toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</dd>{order.paypalOrderId && <><dt>PayPal order</dt><dd>{order.paypalOrderId}</dd></>}{order.paypalCaptureId && <><dt>PayPal capture</dt><dd>{order.paypalCaptureId}</dd></>}</dl>
      {order.items.map(item => <div key={item.id} className="checkout-line"><span>{item.title} × {item.quantity}</span><strong>{money(item.unitPriceCents * item.quantity)}</strong></div>)}<div className="checkout-line total"><span>Total · {order.currency}</span><strong>{money(order.totalCents)}</strong></div><OrderActions id={order.id} status={order.status} /><p className="checkout-note">Sandbox only · virtual funds · no item will be shipped.</p></div><Link className="button secondary" href="/shop">Back to the shop →</Link>
    </section>
}
