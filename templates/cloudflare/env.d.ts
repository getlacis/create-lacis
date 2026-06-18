interface Env {
  // Declare your Cloudflare bindings here:
  // MY_KV: KVNamespace
  // MY_DB: D1Database
  // MY_SECRET: string
}

declare module 'lacis' {
  interface Request {
    env: Env
    ctx: ExecutionContext
  }
}
