import { NextResponse } from 'next/server'
import { getDatabase } from '@/server/database'
import { paypalConfig } from '@/server/payments/paypal'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    await getDatabase().$queryRaw`SELECT 1 FROM erogine.users LIMIT 1`
    return NextResponse.json({ status: 'ok', database: 'connected', payments: paypalConfig().configured ? 'sandbox-configured' : 'not-configured', ai: 'not-configured' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ status: 'unavailable', database: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
