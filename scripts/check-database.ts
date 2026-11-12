import assert from 'node:assert/strict'
import { getDatabase } from '../src/server/database'

const db = getDatabase()
try {
  const identity = await db.$queryRaw<Array<{ role: string; can_read_temuevent: boolean }>>`
    SELECT current_user AS role, CASE WHEN has_schema_privilege(current_user, 'temuevent', 'USAGE')
    THEN has_table_privilege(current_user, 'temuevent.users', 'SELECT') ELSE false END AS can_read_temuevent`
  assert.equal(identity[0].role, 'erogine_app')
  assert.equal(identity[0].can_read_temuevent, false)
  const tables = await db.$queryRaw<Array<{ name: string; rls: boolean }>>`
    SELECT c.relname AS name, c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='erogine' AND c.relkind='r' ORDER BY c.relname`
  assert.equal(tables.length, 5)
  assert(tables.every(t => t.rls))
  await db.user.count()
  await db.authSession.count()
  await db.authRefreshToken.count()
  await db.order.count()
  await db.orderItem.count()
  console.log('PASS: isolated runtime role; 5 tables accessible with RLS; TemuEvent users inaccessible; verified TLS.')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[redacted database URL]'))
  process.exitCode = 1
} finally { await db.$disconnect() }
