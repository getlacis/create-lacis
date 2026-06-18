/// <reference types="@cloudflare/workers-types" />

interface Env {
  MY_KV: KVNamespace
  MY_DB: D1Database
  MY_SECRET: string
}

declare module 'lacis' {
  interface Request {
    env: Env
    ctx: ExecutionContext
  }
}
