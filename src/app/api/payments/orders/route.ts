import { NextRequest, NextResponse } from 'next/server'
import { apiError, jsonBody } from '@/server/http'
import { paymentSession, payments } from '@/server/payments/runtime'
import { receipt } from '@/server/payments/types'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const session = await paymentSession(request, true)
    const body = await jsonBody(request)
    const order = await payments().create(session.user.id, body)
    return NextResponse.json({ order: receipt(order) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
