import "server-only"

import { Pool } from "pg"

const globalForPool = globalThis as unknown as {
  vectorPool?: Pool
}

export const vectorPool =
  globalForPool.vectorPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPool.vectorPool = vectorPool
}

