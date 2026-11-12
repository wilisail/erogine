import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/server/database'
import { apiError, HttpError } from '@/server/http'
import { orderId, paymentSession } from '@/server/payments/runtime'
import { receipt } from '@/server/payments/types'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await paymentSession(request)
    const id = orderId((await context.params).id)
    const order = await getDatabase().order.findFirst({ where: { id, userId: session.user.id }, include: { items: true } })
    if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND', 'This order is not available.')
    return NextResponse.json({ order: receipt(order) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
