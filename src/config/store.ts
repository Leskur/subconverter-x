import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { parse, stringify } from 'yaml'
import { appDataDir } from '../utils/paths.js'

function configPath(): string {
  return join(appDataDir(), 'config.yaml')
}

interface AppConfig {
  token: string
}

function normalizeConfig(raw: unknown): AppConfig {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const token = typeof record.token === 'string' ? record.token.trim() : ''
  return { token }
}

function generateToken(): string {
  return randomBytes(24).toString('hex')
}

export class FileConfigStore {
  constructor(
    private readonly path = configPath(),
  ) {}

  async get(): Promise<AppConfig> {
    try {
      const content = await readFile(this.path, 'utf8')
      return normalizeConfig(parse(content))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    return { token: '' }
  }

  async ensureToken(): Promise<string> {
    const config = await this.get()
    if (config.token) return config.token

    const token = generateToken()
    await mkdir(dirname(this.path), { recursive: true })
    const yaml = stringify({ token })
    await writeFile(this.path, yaml, 'utf8')
    return token
  }
}

export const configStore = new FileConfigStore()
