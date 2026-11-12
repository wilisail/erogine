import { createHash } from 'node:crypto'
import { z } from 'zod'
import { getDatabase } from '../database'
import { HttpError } from '../errors'
import { hashPassword, newPasswordSchema } from './passwords'

const resetInput = z.strictObject({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: newPasswordSchema,
  confirmPassword: z.string().max(128),
}).refine(value => value.password === value.confirmPassword, {
  message: 'The two passwords must match.', path: ['confirmPassword'],
})
const invalidLink = () => new HttpError(400, 'RESET_LINK_INVALID', 'This reset link has expired or has already been used. Request a new link.')

export async function resetPassword(input: unknown): Promise<void> {
  const parsed = resetInput.safeParse(input)
  if (!parsed.success) throw new HttpError(400, 'INVALID_RESET', parsed.error.issues[0]?.message || 'Check your new password and confirmation.')
  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')
  const db = getDatabase()
  const reset = await db.authPasswordReset.findUnique({ where: { tokenHash } })
  if (!reset || reset.consumedAt || reset.expiresAt <= new Date()) throw invalidLink()
  const passwordHash = await hashPassword(parsed.data.password)

  await db.$transaction(async tx => {
    // Same user-first lock order as sign-in. Two links for the same user cannot
    // race to change the password, and a sign-in cannot miss session revocation.
    await tx.$queryRaw`SELECT id FROM erogine.users WHERE id = ${reset.userId}::uuid FOR UPDATE`
    const now = new Date()
    const claimed = await tx.authPasswordReset.updateMany({
      where: { id: reset.id, tokenHash, userId: reset.userId, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    })
    if (claimed.count !== 1) throw invalidLink()
    await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } })
    await tx.authPasswordReset.updateMany({ where: { userId: reset.userId, consumedAt: null }, data: { consumedAt: now } })
    await tx.authSession.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now } })
  })
}
