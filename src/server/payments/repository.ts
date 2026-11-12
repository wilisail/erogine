import type { PrismaClient } from '../../generated/prisma/client'
import type { PaymentRepository } from './types'

const include = { items: true } as const
export function paymentRepository(db: PrismaClient): PaymentRepository {
  return {
    draft: (userId, checkoutKey, items, totalCents) => db.order.upsert({ where: { checkoutKey }, update: {}, create: {
      userId, checkoutKey, currency: 'USD', totalCents, items: { create: items },
    }, include }),
    owned: (id, userId) => db.order.findFirst({ where: { id, userId }, include }),
    async attach(id, paypalId) { await db.order.updateMany({ where: { id, paypalOrderId: null, status: 'PENDING' }, data: { paypalOrderId: paypalId } }) },
    async claimCapture(order, now) { return (await db.order.updateMany({ where: { id: order.id, status: order.status, updatedAt: order.updatedAt }, data: { status: 'PROCESSING', updatedAt: now } })).count === 1 },
    async paid(id, captureId, now) { await db.order.updateMany({ where: { id, status: { not: 'PAID' } }, data: { status: 'PAID', paypalCaptureId: captureId, paidAt: now } }) },
    async processing(id, captureId) { await db.order.updateMany({ where: { id, status: { not: 'PAID' } }, data: { status: 'PROCESSING', paypalCaptureId: captureId } }) },
    async releaseCapture(id) { await db.order.updateMany({ where: { id, status: 'PROCESSING', paypalCaptureId: null }, data: { status: 'PENDING' } }) },
    async cancel(id) { return (await db.order.updateMany({ where: { id, status: 'PENDING', paypalCaptureId: null }, data: { status: 'CANCELED' } })).count === 1 },
  }
}
