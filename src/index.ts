import * as p from '@clack/prompts'
import { existsSync } from 'fs'
import { rm } from 'fs/promises'
import { join } from 'path'
import { scaffold } from './scaffold.js'
import { detectPackageManager, install } from './install.js'

async function main() {
  console.log()
  p.intro('lacis — create a new project')

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
  const projectName = (name || 'my-app') as string

  const platform = await p.select({
    message: 'Platform?',
    options: [
      { value: 'node', label: 'Node', hint: 'default' },
      { value: 'bun', label: 'Bun' },
      { value: 'vercel', label: 'Vercel' },
      { value: 'netlify', label: 'Netlify' },
    ],
  })
  if (p.isCancel(platform)) { p.cancel('Cancelled'); process.exit(0) }

  const validator = await p.select({
    message: 'Add a validation library?',
    options: [
      { value: 'none', label: 'None' },
      { value: 'zod', label: 'Zod', hint: 'most popular' },
      { value: 'valibot', label: 'Valibot', hint: 'smallest bundle' },
      { value: 'arktype', label: 'ArkType', hint: 'native JSON Schema' },
    ],
  })
  if (p.isCancel(validator)) { p.cancel('Cancelled'); process.exit(0) }

  const targetDir = join(process.cwd(), projectName)
  const s = p.spinner()

  s.start('Scaffolding...')
  try {
    await scaffold({
      name: projectName,
      platform: platform as string,
      validator: validator as string,
      targetDir,
    })
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
