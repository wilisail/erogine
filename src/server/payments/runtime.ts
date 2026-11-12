import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { cookieNames, sessionService } from '../auth'
import { getDatabase } from '../database'
import { HttpError, jsonBody, requireBrowserMutation } from '../http'
import { configuredPayPal } from './paypal'
import { paymentRepository } from './repository'
import { createPaymentService } from './service'

export const payments = () => createPaymentService(paymentRepository(getDatabase()), configuredPayPal())
export function orderId(value: string) {
  if (!z.uuid().safeParse(value).success) throw new HttpError(404, 'ORDER_NOT_FOUND', 'This order is not available.')
  return value
}
export async function paymentSession(request: NextRequest, mutation = false) {
  if (mutation) requireBrowserMutation(request)
  const service = sessionService(), names = cookieNames()
  const session = await service.readSession(request.cookies.get(names.access)?.value ?? null)
  if (mutation && !await service.verifySessionCsrf(session.id, request.cookies.get(names.refresh)?.value ?? null, request.headers.get('x-csrf-token'))) {
    throw new HttpError(403, 'CSRF_INVALID', 'Refresh the page and try again.')
  }
  return session
}
export async function emptyBody(request: NextRequest) {
  if (!z.strictObject({}).safeParse(await jsonBody(request)).success) throw new HttpError(400, 'INVALID_REQUEST', 'This action does not accept payment details.')
}
