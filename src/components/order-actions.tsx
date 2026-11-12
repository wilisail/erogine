'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { paymentMutation } from '@/lib/api-client'
export function OrderActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const router = useRouter()
  async function act(action: 'reconcile' | 'cancel') {
    setBusy(true); setMessage('')
    try {
      const { order } = await paymentMutation('/api/payments/orders/' + id + '/' + action)
      setMessage(order.status === 'PAID' ? 'Payment verified.' : 'Current status: ' + order.status + '.'); router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again shortly.') }
    finally { setBusy(false) }
  }
  if (status === 'PAID' || status === 'CANCELED' || status === 'FAILED') return null
  return <div className="order-actions"><button className="button primary" disabled={busy} onClick={() => act('reconcile')}>Check payment status</button>{status === 'PENDING' && <button className="button secondary" disabled={busy} onClick={() => act('cancel')}>Cancel this checkout</button>}{message && <p className="payment-message" role="status">{message}</p>}</div>
}
