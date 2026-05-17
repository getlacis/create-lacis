import { scaffold } from '../src/scaffold.js'
import { access, mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const PLATFORMS = ['node', 'bun', 'vercel', 'netlify'] as const
const VALIDATORS = ['none', 'zod', 'valibot', 'arktype'] as const

const EXPECTED_FILES: Record<string, string[]> = {
  node:    ['server.ts', 'routes/index.ts', 'package.json', 'tsconfig.json', '.gitignore'],
  bun:     ['server.ts', 'routes/index.ts', 'package.json', 'tsconfig.json', '.gitignore'],
  vercel:  ['api/index.ts', 'routes/index.ts', 'package.json', 'tsconfig.json', '.gitignore', 'vercel.json'],
  netlify: ['netlify/functions/index.ts', 'routes/index.ts', 'package.json', 'tsconfig.json', '.gitignore', 'netlify.toml'],
}

async function exists(p: string) {
  try { await access(p); return true } catch { return false }
}

async function check(platform: string, validator: string) {
  const dir = await mkdtemp(join(tmpdir(), 'lacis-validate-'))
  try {
    await scaffold({ name: 'test-app', platform, validator, targetDir: dir })

    for (const file of EXPECTED_FILES[platform] ?? []) {
      if (!await exists(join(dir, file))) throw new Error(`missing ${file}`)
    }

    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf-8'))
    if (pkg.name !== 'test-app') throw new Error('{{name}} not replaced')
    if (!pkg.dependencies?.lacis) throw new Error('lacis missing from deps')
    if (validator === 'zod' && !pkg.dependencies?.zod) throw new Error('zod missing')
    if (validator === 'valibot' && !pkg.dependencies?.valibot) throw new Error('valibot missing')
    if (validator === 'arktype' && !pkg.dependencies?.arktype) throw new Error('arktype missing')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function main() {
  console.log('Validating templates...\n')
  let passed = 0
  let failed = 0

  for (const platform of PLATFORMS) {
    for (const validator of VALIDATORS) {
      try {
        await check(platform, validator)
        console.log(`  ✓  ${platform} / ${validator}`)
        passed++
      } catch (err) {
        console.error(`  ✗  ${platform} / ${validator}: ${err}`)
        failed++
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
