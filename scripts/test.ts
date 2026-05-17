import { scaffold } from '../src/scaffold.js'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LACIS_ROOT = resolve(__dirname, '../../lacis')
const LACIS_CLI = join(LACIS_ROOT, 'dist', 'cli', 'index.js')

const PLATFORMS = ['node', 'bun', 'vercel', 'netlify'] as const
const VALIDATORS = ['none', 'zod', 'valibot', 'arktype'] as const

async function runCombo(platform: string, validator: string): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'lacis-test-'))
  try {
    await scaffold({ name: 'test-app', platform, validator, targetDir: dir })

    const pkgPath = join(dir, 'package.json')
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
    pkg.dependencies.lacis = `file:${LACIS_ROOT}`
    pkg.devDependencies = { ...pkg.devDependencies, typescript: 'latest' }
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

    execSync('npm install --silent', { cwd: dir, stdio: 'pipe' })

    if (platform === 'vercel' || platform === 'netlify') {
      execSync(`node ${LACIS_CLI} build`, { cwd: dir, stdio: 'pipe' })
    }

    execSync('./node_modules/.bin/tsc --noEmit', { cwd: dir, stdio: 'pipe' })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function main() {
  if (!existsSync(LACIS_CLI)) {
    console.error('lacis CLI not found — run: cd ../lacis && npm run build')
    process.exit(1)
  }

  console.log('Scaffold + install + tsc...\n')
  let passed = 0
  let failed = 0

  for (const platform of PLATFORMS) {
    for (const validator of VALIDATORS) {
      try {
        await runCombo(platform, validator)
        console.log(`  ✓  ${platform} / ${validator}`)
        passed++
      } catch (err: any) {
        const msg = (err.stderr?.toString().trim() || String(err)).split('\n')[0]
        console.error(`  ✗  ${platform} / ${validator}: ${msg}`)
        failed++
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
