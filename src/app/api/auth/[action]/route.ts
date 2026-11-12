import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/server/database'
import { cookieNames, sessionService } from '@/server/auth'
import { hashPassword, newPasswordSchema } from '@/server/auth/passwords'
import type { SessionCredentials } from '@/server/auth/sessions'
import { apiError, HttpError, jsonBody, limitAuth, requireBrowserMutation } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const registration = z.strictObject({ name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().max(254).pipe(z.email()), password: newPasswordSchema })
type Context = { params: Promise<{ action: string }> }

function signedIn(data: SessionCredentials) {
  const response = NextResponse.json({ success: true, user: data.user, csrfToken: data.csrfToken }, { headers: { 'Cache-Control': 'no-store' } })
  const names = cookieNames()
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
  response.cookies.set(names.access, data.accessToken, { ...options, expires: data.accessExpiresAt })
  response.cookies.set(names.refresh, data.refreshToken, { ...options, expires: data.sessionExpiresAt })
  return response
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params
    const service = sessionService()
    const names = cookieNames()
    const refresh = request.cookies.get(names.refresh)?.value ?? null
    if (action === 'csrf') {
      return NextResponse.json({ csrfToken: service.csrfToken(refresh) }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (action !== 'session') throw new HttpError(404, 'NOT_FOUND', 'Page not found.')
    const session = await service.readSession(request.cookies.get(names.access)?.value ?? null)
    return NextResponse.json({ success: true, user: session.user, csrfToken: service.csrfToken(refresh) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    requireBrowserMutation(request)
    const { action } = await context.params
    const service = sessionService()
    const names = cookieNames()
    const refresh = request.cookies.get(names.refresh)?.value ?? null
    if (action === 'login' || action === 'register') {
      limitAuth(request)
      const body = await jsonBody(request)
      if (action === 'login') return signedIn(await service.login(body))
      const parsed = registration.safeParse(body)
      if (!parsed.success) throw new HttpError(400, 'INVALID_REGISTRATION', parsed.error.issues[0]?.message || 'Check your details.')
      const { name, email, password } = parsed.data
      const db = getDatabase()
      if (await db.user.findUnique({ where: { email }, select: { id: true } })) throw new HttpError(409, 'EMAIL_IN_USE', 'An account with this email already exists.')
      try { await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } }) }
      catch (error) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw new HttpError(409, 'EMAIL_IN_USE', 'An account with this email already exists.')
        throw error
      }
      return signedIn(await service.login({ email, password }))
    }
    if (action === 'refresh') return signedIn(await service.refresh(refresh))
    if (action === 'logout') {
      if (!service.verifyCsrf(refresh, request.headers.get('x-csrf-token'))) throw new HttpError(403, 'CSRF_INVALID', 'Refresh the page and try again.')
      await service.logout(refresh)
      const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
      for (const name of Object.values(names)) response.cookies.set(name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
      return response
    }
    throw new HttpError(404, 'NOT_FOUND', 'Page not found.')
  } catch (error) { return apiError(error) }
}
