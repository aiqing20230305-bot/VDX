import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: `file:${path.resolve(process.cwd(), 'dev.db')}`,
  },
})
