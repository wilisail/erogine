import { NextRequest, NextResponse } from 'next/server'
import { apiError, jsonBody } from '@/server/http'
import { paymentSession } from '@/server/payments/runtime'
import { limitedRecommendations } from '@/server/recommendations'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const session = await paymentSession(request, true)
    const result = await limitedRecommendations(session.user.id, await jsonBody(request))
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
