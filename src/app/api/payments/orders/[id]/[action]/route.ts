import { NextRequest, NextResponse } from 'next/server'
import { apiError, HttpError } from '@/server/http'
import { emptyBody, orderId, paymentSession, payments } from '@/server/payments/runtime'
import { receipt } from '@/server/payments/types'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest, context: { params: Promise<{ id: string; action: string }> }) {
  try {
    const session = await paymentSession(request, true)
    const { id, action } = await context.params
    orderId(id)
    await emptyBody(request)
    if (action !== 'capture' && action !== 'cancel' && action !== 'reconcile') throw new HttpError(404, 'NOT_FOUND', 'This action is not available.')
    const order = await payments()[action](session.user.id, id)
    return NextResponse.json({ order: receipt(order) }, { status: order.status === 'PROCESSING' ? 202 : 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
