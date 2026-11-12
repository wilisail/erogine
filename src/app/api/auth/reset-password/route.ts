import { NextRequest, NextResponse } from 'next/server'
import { cookieNames } from '@/server/auth'
import { resetPassword } from '@/server/auth/password-reset'
import { apiError, jsonBody, limitAuth, requireBrowserMutation } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    requireBrowserMutation(request)
    limitAuth(request)
    await resetPassword(await jsonBody(request))
    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    for (const name of Object.values(cookieNames())) response.cookies.set(name, '', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
    })
    return response
  } catch (error) { return apiError(error) }
}
