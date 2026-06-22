import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parse, stringify } from 'yaml'
import type { RulesConfig, RulesInput, RulesMergeMode } from './types.js'
import { appDataDir } from '../utils/paths.js'

function defaultRulesPath(): string {
  return process.env.RULES_FILE ?? join(process.cwd(), 'src', 'rules', 'default-rules.yaml')
}

function userRulesPath(): string {
  return join(appDataDir(), 'rules.yaml')
}

function legacyDefaultPath(): string {
  return join(process.cwd(), 'data', 'profiles', 'default.yaml')
}

function parseRulesMerge(raw: unknown): RulesMergeMode {
  if (raw === 'prepend' || raw === 'append' || raw === 'replace') return raw
  return 'replace'
}

function normalizeRules(raw: unknown): RulesConfig {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const rules = Array.isArray(record.rules)
    ? record.rules.map((rule) => String(rule).trim()).filter(Boolean)
    : []

  return {
    rules,
    rulesMerge: parseRulesMerge(record['rules-merge'] ?? record.rulesMerge),
  }
}

export class FileRulesStore {
  constructor(
    private readonly userPath = userRulesPath(),
    private readonly defaultPath = defaultRulesPath(),
  ) {}

  async get(): Promise<RulesConfig | null> {
    // 1. Try user-saved rules
    try {
      const content = await readFile(this.userPath, 'utf8')
      return normalizeRules(parse(content))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }

    // 2. Try default template
    try {
      const content = await readFile(this.defaultPath, 'utf8')
      return normalizeRules(parse(content))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }

    // 3. Try legacy path
    try {
      const legacy = await readFile(legacyDefaultPath(), 'utf8')
      const config = normalizeRules(parse(legacy))
      await this.save(config)
      return config
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async getDefault(): Promise<RulesConfig | null> {
    try {
      const content = await readFile(this.defaultPath, 'utf8')
      return normalizeRules(parse(content))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async save(input: RulesInput): Promise<RulesConfig> {
    const existing = (await this.get()) ?? {
      rules: [],
      rulesMerge: 'prepend' as const,
    }
    const config: RulesConfig = {
      rules: input.rules ?? existing.rules,
      rulesMerge: input.rulesMerge ?? existing.rulesMerge,
    }

    await mkdir(dirname(this.userPath), { recursive: true })
    const yaml = stringify({
      'rules-merge': config.rulesMerge,
      rules: config.rules,
    })
    await writeFile(this.userPath, yaml, 'utf8')
    return config
  }

  async reset(): Promise<RulesConfig | null> {
    try {
      await unlink(this.userPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    return this.getDefault()
  }
}

export const rulesStore = new FileRulesStore()
