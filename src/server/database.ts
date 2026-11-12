import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { rootCertificates } from 'node:tls'

const shared = globalThis as unknown as { erogineDb?: PrismaClient }
export function getDatabase(): PrismaClient {
  if (shared.erogineDb) return shared.erogineDb
  if (!process.env.DATABASE_URL) throw new Error('Database is not configured')
  const url = new URL(process.env.DATABASE_URL)
  // Explicit TLS verification; do not inherit sslmode=require's relaxed semantics.
  for (const key of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat', 'schema']) url.searchParams.delete(key)
  const adapter = new PrismaPg({
    connectionString: url.toString(),
    ssl: { ca: [...rootCertificates, readFileSync(resolve(process.cwd(), 'database/certs/prod-ca-2021.crt'), 'utf8')], rejectUnauthorized: true },
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  }, { schema: 'erogine' })
  shared.erogineDb = new PrismaClient({ adapter })
  return shared.erogineDb
}
