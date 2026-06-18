import * as p from '@clack/prompts'
import { existsSync } from 'fs'
import { rm } from 'fs/promises'
import { join } from 'path'
import { scaffold } from './scaffold.js'
import { detectPackageManager, install } from './install.js'

const VALID_PLATFORMS = ['node', 'bun', 'vercel', 'netlify', 'cloudflare'] as const
const VALID_VALIDATORS = ['none', 'zod', 'valibot', 'arktype'] as const

type Platform = typeof VALID_PLATFORMS[number]
type Validator = typeof VALID_VALIDATORS[number]

interface ParsedArgs {
  name?: string
  platform?: string
  validator?: string
  yes: boolean
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2)
  const result: ParsedArgs = { yes: false }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--yes' || arg === '-y') {
      result.yes = true
    } else if (arg.startsWith('--platform=')) {
      result.platform = arg.slice('--platform='.length)
    } else if (arg === '--platform' && args[i + 1]) {
      result.platform = args[++i]
    } else if (arg.startsWith('--validator=')) {
      result.validator = arg.slice('--validator='.length)
    } else if (arg === '--validator' && args[i + 1]) {
      result.validator = args[++i]
    } else if (!arg.startsWith('-')) {
      result.name = arg
    }
  }

  return result
}

function validateArg<T extends string>(value: string, valid: readonly T[], flag: string): T {
  if (!valid.includes(value as T)) {
    console.error(`[create-lacis] Invalid --${flag}: "${value}". Must be one of: ${valid.join(', ')}`)
    process.exit(1)
  }
  return value as T
}

async function main() {
  const parsed = parseArgs()

  if (parsed.platform) validateArg(parsed.platform, VALID_PLATFORMS, 'platform')
  if (parsed.validator) validateArg(parsed.validator, VALID_VALIDATORS, 'validator')

  console.log()
  p.intro('lacis — create a new project')

  let projectName: string
  if (parsed.name) {
    projectName = parsed.name
  } else if (parsed.yes) {
    projectName = 'my-app'
  } else {
    const name = await p.text({
      message: 'Project name?',
      placeholder: 'my-app',
      defaultValue: 'my-app',
      validate(value) {
        const v = value || 'my-app'
        if (!/^[a-z0-9][a-z0-9\-_.]*$/.test(v)) return 'Lowercase letters, numbers, - _ or . only'
        if (existsSync(join(process.cwd(), v))) return `"${v}" already exists`
      },
    })
    if (p.isCancel(name)) { p.cancel('Cancelled'); process.exit(0) }
    projectName = (name || 'my-app') as string
  }

  if (!parsed.name && existsSync(join(process.cwd(), projectName))) {
    console.error(`[create-lacis] "${projectName}" already exists`)
    process.exit(1)
  }

  let platform: Platform
  if (parsed.platform) {
    platform = parsed.platform as Platform
  } else if (parsed.yes) {
    platform = 'node'
  } else {
    const sel = await p.select({
      message: 'Platform?',
      options: [
        { value: 'node', label: 'Node', hint: 'default' },
        { value: 'bun', label: 'Bun' },
        { value: 'vercel', label: 'Vercel' },
        { value: 'netlify', label: 'Netlify' },
        { value: 'cloudflare', label: 'Cloudflare Workers' },
      ],
    })
    if (p.isCancel(sel)) { p.cancel('Cancelled'); process.exit(0) }
    platform = sel as Platform
  }

  let validator: Validator
  if (parsed.validator) {
    validator = parsed.validator as Validator
  } else if (parsed.yes) {
    validator = 'none'
  } else {
    const sel = await p.select({
      message: 'Add a validation library?',
      options: [
        { value: 'none', label: 'None' },
        { value: 'zod', label: 'Zod', hint: 'most popular' },
        { value: 'valibot', label: 'Valibot', hint: 'smallest bundle' },
        { value: 'arktype', label: 'ArkType', hint: 'native JSON Schema' },
      ],
    })
    if (p.isCancel(sel)) { p.cancel('Cancelled'); process.exit(0) }
    validator = sel as Validator
  }

  const targetDir = join(process.cwd(), projectName)
  const s = p.spinner()

  s.start('Scaffolding...')
  try {
    await scaffold({ name: projectName, platform, validator, targetDir })
    s.stop('Scaffolded.')
  } catch (err) {
    s.stop('Scaffolding failed.')
    await rm(targetDir, { recursive: true, force: true }).catch(() => {})
    p.cancel(String(err))
    process.exit(1)
  }

  const pm = detectPackageManager()
  s.start('Installing packages...')
  try {
    install({ targetDir, pm })
    s.stop('Packages installed.')
  } catch {
    s.stop(`Install failed — run manually: cd ${projectName} && ${pm} install`)
  }

  p.note(`cd ${projectName}\nlacis dev`, 'Next steps')
  p.outro('Done!')
}

main().catch((err) => {
  console.error('[create-lacis]', err)
  process.exit(1)
})
