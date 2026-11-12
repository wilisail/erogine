import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { currentSession } from '@/server/auth'
import { paypalConfig } from '@/server/payments/paypal'
import { CheckoutClient } from '@/components/checkout-client'
export const metadata: Metadata = { title: 'Sandbox checkout' }
export const dynamic = 'force-dynamic'
export default async function Checkout() {
  const session = await currentSession()
  if (!session) redirect('/login?next=/checkout')
  const config = paypalConfig()
  return <CheckoutClient userId={session.user.id} clientId={config.configured ? config.clientId! : null} />
}
