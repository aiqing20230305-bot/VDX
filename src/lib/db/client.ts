import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const dbUrl = `file:${path.resolve(process.cwd(), 'dev.db')}`

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: dbUrl })
  return new PrismaClient({ adapter } as never)
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const db = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}
