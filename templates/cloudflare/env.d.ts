/// <reference types="@cloudflare/workers-types" />

interface Env {
  MY_KV: KVNamespace
  MY_DB: D1Database
  MY_QUEUE: Queue
  MY_BUCKET: R2Bucket
  MY_DO: DurableObjectNamespace
  AI: Ai
  MY_SERVICE: Fetcher
  MY_SECRET: string
}

declare module 'lacis' {
  interface Request {
    env: Env
    ctx: ExecutionContext
    cf: IncomingRequestCfProperties
  }
}
