import { existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const INSTALL_CMD: Record<string, string> = {
  bun: 'bun install',
  pnpm: 'pnpm install',
  yarn: 'yarn install',
  npm: 'npm install',
}

export function detectPackageManager(): string {
  const cwd = process.cwd()
  if (existsSync(join(cwd, 'bun.lock')) || existsSync(join(cwd, 'bun.lockb'))) return 'bun'
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn'
  return 'npm'
}

export interface InstallOptions {
  targetDir: string
  pm: string
}

export function install({ targetDir, pm }: InstallOptions): void {
  const cmd = INSTALL_CMD[pm] ?? 'npm install'
  try {
    execSync(cmd, { cwd: targetDir, stdio: 'pipe' })
  } catch (err: any) {
    throw new Error(err.stderr?.toString().trim() ?? String(err))
  }
}
