import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/server/http'
import { paypalConfig } from '@/server/payments/paypal'
import { paymentSession } from '@/server/payments/runtime'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    await paymentSession(request)
    const config = paypalConfig()
    return NextResponse.json({ configured: config.configured, environment: 'sandbox', currency: 'USD', ...(config.configured ? { clientId: config.clientId } : {}) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
