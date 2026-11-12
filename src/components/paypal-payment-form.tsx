'use client'

// Adapted from spree/storefront PayPalPaymentForm.tsx at 63cf0dc.
// Copyright (c) 2026 Vendo Connect Inc., Vendo Sp. z o.o. MIT; see licenses/spree-MIT.txt.
import { useEffect, useRef, useState } from 'react'

type Props = {
  clientId: string
  cartKey: number
  createOrder: () => Promise<string>
  onApproved: (paypalOrderId: string) => Promise<'completed' | 'restart'>
  onCancel: () => Promise<void>
  onError: (message: string) => void
}
export function PayPalPaymentForm(props: Props) {
  const callbacks = useRef(props)
  useEffect(() => { callbacks.current = props }, [props])
  const [sdk, setSdk] = useState<typeof import('@paypal/react-paypal-js') | null>(null)
  const [loadError, setLoadError] = useState(false)
  useEffect(() => {
    let canceled = false
    import('@paypal/react-paypal-js').then(mod => { if (!canceled) setSdk(mod) }).catch(() => { if (!canceled) setLoadError(true) })
    return () => { canceled = true }
  }, [])
  if (loadError) return <p role="alert" className="error-message">PayPal could not load. Refresh this page to try again.</p>
  if (!sdk) return <p className="muted" role="status">Loading PayPal…</p>
  const { PayPalScriptProvider, PayPalButtons } = sdk
  return <PayPalScriptProvider options={{ clientId: props.clientId, currency: 'USD', intent: 'capture', components: 'buttons' }}>
    <PayPalButtons key={props.cartKey} fundingSource="paypal" style={{ shape: 'rect', layout: 'vertical', color: 'gold', label: 'pay' }}
      createOrder={() => callbacks.current.createOrder()}
      onApprove={async (data, actions) => {
        if (await callbacks.current.onApproved(data.orderID) === 'restart') await actions.restart()
      }}
      onCancel={async () => { await callbacks.current.onCancel() }}
      onError={() => callbacks.current.onError('The PayPal window could not finish. Check your order before starting another payment.')} />
  </PayPalScriptProvider>
}
