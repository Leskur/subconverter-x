import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parse, stringify } from 'yaml'
import type { SubscriptionConfig, SubscriptionInput, UpdateIntervalMode } from './types.js'
import { appDataDir } from '../utils/paths.js'

function userConfigPath(): string {
  return join(appDataDir(), 'subscription.yaml')
}

function defaultConfig(): SubscriptionConfig {
  return { updateInterval: 'auto' }
}

function parseUpdateInterval(raw: unknown): UpdateIntervalMode {
  if (raw === 'auto') return 'auto'
  if (typeof raw === 'number' && raw >= 300) return raw
  return 'auto'
}

function normalizeConfig(raw: unknown): SubscriptionConfig {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    updateInterval: parseUpdateInterval(record.updateInterval ?? record['update-interval']),
  }
}

export class FileSubscriptionStore {
  constructor(
    private readonly userPath = userConfigPath(),
  ) {}

  async get(): Promise<SubscriptionConfig> {
    try {
      const content = await readFile(this.userPath, 'utf8')
      return normalizeConfig(parse(content))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    return defaultConfig()
  }

  async save(input: SubscriptionInput): Promise<SubscriptionConfig> {
    const existing = await this.get()
    const config: SubscriptionConfig = {
      updateInterval: input.updateInterval ?? existing.updateInterval,
    }

    await mkdir(dirname(this.userPath), { recursive: true })
    const yaml = stringify({
      'update-interval': config.updateInterval,
    })
    await writeFile(this.userPath, yaml, 'utf8')
    return config
  }

  async reset(): Promise<SubscriptionConfig> {
    try {
      await unlink(this.userPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    return defaultConfig()
  }
}

export const subscriptionStore = new FileSubscriptionStore()
