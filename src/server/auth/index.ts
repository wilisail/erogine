import { cookies } from 'next/headers'
import { cache } from 'react'
import { getDatabase } from '../database'
import { createSessionService, SessionError } from './sessions'
import { createSessionTokens } from './session-tokens'
import { prismaSessionRepository } from './session-repository'

export function sessionService() {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) throw new Error('Sessions are not configured')
  return createSessionService({ repository: prismaSessionRepository(getDatabase()), tokens: createSessionTokens(secret) })
}

export const cookieNames = () => {
  const prefix = process.env.NODE_ENV === 'production' ? '__Host-' : ''
  return { access: `${prefix}erogine_access`, refresh: `${prefix}erogine_refresh` }
}

export const currentSession = cache(async () => {
  const jar = await cookies()
  const access = jar.get(cookieNames().access)?.value
  if (!access) return null
  try { return await sessionService().readSession(access) }
  catch (error) {
    if (error instanceof SessionError && error.status === 401) return null
    throw error
  }
})
