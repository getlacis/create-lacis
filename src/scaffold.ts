import { appendFile, cp, mkdir, readFile, rename, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES = join(__dirname, '..', 'templates')

export interface ScaffoldOptions {
  name: string
  platform: string
  validator: string
  targetDir: string
}

const VALIDATOR_DEPS: Record<string, Record<string, string>> = {
  zod: { zod: 'latest', 'zod-to-json-schema': 'latest' },
  valibot: { valibot: 'latest', '@valibot/to-json-schema': 'latest' },
  arktype: { arktype: 'latest' },
  none: {},
}

const PLATFORM_GITIGNORE_EXTRAS: Record<string, string> = {
  vercel: '.vercel\n',
  netlify: '.netlify\n',
}

const PLATFORM_TEMPLATE: Record<string, string> = {
  node: 'base',
  bun: 'bun',
  vercel: 'vercel',
  netlify: 'netlify',
}

const ROUTE_CONTENT: Record<string, string> = {
  none: `import type { Request, Response } from 'lacis'

export const GET = async (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello from lacis!' })
}
`,
  zod: `import { defineHandler } from 'lacis'
import { z } from 'zod'

export const GET = defineHandler({
  query: z.object({ name: z.string().optional() }),
  meta: { summary: 'Hello endpoint', tags: ['hello'] },
  handler: async (req, res) => {
    const { name } = req.query
    res.status(200).json({ message: \`Hello, \${name ?? 'world'}!\` })
  },
})
`,
  valibot: `import { defineHandler } from 'lacis'
import * as v from 'valibot'

export const GET = defineHandler({
  query: v.object({ name: v.optional(v.string()) }),
  meta: { summary: 'Hello endpoint', tags: ['hello'] },
  handler: async (req, res) => {
    const { name } = req.query
    res.status(200).json({ message: \`Hello, \${name ?? 'world'}!\` })
  },
})
`,
  arktype: `import { defineHandler } from 'lacis'
import { type } from 'arktype'

export const GET = defineHandler({
  query: type({ 'name?': 'string' }),
  meta: { summary: 'Hello endpoint', tags: ['hello'] },
  handler: async (req, res) => {
    const { name } = req.query
    res.status(200).json({ message: \`Hello, \${name ?? 'world'}!\` })
  },
})
`,
}

export async function scaffold({ name, platform, validator, targetDir }: ScaffoldOptions): Promise<void> {
  await mkdir(targetDir, { recursive: true })

  // _common first, then platform-specific on top (platform files take precedence)
  await cp(join(TEMPLATES, '_common'), targetDir, { recursive: true })
  await cp(join(TEMPLATES, PLATFORM_TEMPLATE[platform] ?? 'base'), targetDir, { recursive: true })

  // npm strips .gitignore from published packages, so we store it as _gitignore
  const gitignoreSrc = join(targetDir, '_gitignore')
  if (existsSync(gitignoreSrc)) {
    await rename(gitignoreSrc, join(targetDir, '.gitignore'))
  }

  const extras = PLATFORM_GITIGNORE_EXTRAS[platform]
  if (extras) await appendFile(join(targetDir, '.gitignore'), extras)

  const pkgPath = join(targetDir, 'package.json')
  const pkg = JSON.parse((await readFile(pkgPath, 'utf-8')).replace(/\{\{name\}\}/g, name))
  pkg.dependencies = { ...pkg.dependencies, ...(VALIDATOR_DEPS[validator] ?? {}) }
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  await writeFile(
    join(targetDir, 'routes', 'index.ts'),
    ROUTE_CONTENT[validator] ?? ROUTE_CONTENT.none,
    'utf-8',
  )
}
