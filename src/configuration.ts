/**
 * Global configuration for happy CLI
 * 
 * Centralizes all configuration including environment variables and paths
 * Environment files should be loaded using Node's --env-file flag
 */

import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import packageJson from '../package.json'

type ServerUrlParseResult = {
  serverUrl: string | null
  webappUrl: string | null
  cleanedArgs: string[]
}

const serverUrlFlags = new Set(['--server-url', '--server'])
const webappUrlFlags = new Set(['--webapp-url', '--webapp'])

export function parseServerUrlArgs(argv: string[]): ServerUrlParseResult {
  const cleanedArgs: string[] = []
  let serverUrl: string | null = null
  let webappUrl: string | null = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (serverUrlFlags.has(arg)) {
      const value = argv[i + 1]
      if (!value || value.startsWith('-')) {
        throw new Error(`Missing value for ${arg}. Example: ${arg} https://api.example.com`)
      }
      serverUrl = value
      i += 1
      continue
    }
    if (webappUrlFlags.has(arg)) {
      const value = argv[i + 1]
      if (!value || value.startsWith('-')) {
        throw new Error(`Missing value for ${arg}. Example: ${arg} https://webapp.example.com`)
      }
      webappUrl = value
      i += 1
      continue
    }
    if (arg.startsWith('--server-url=') || arg.startsWith('--server=')) {
      const value = arg.split('=', 2)[1]
      if (!value) {
        throw new Error(`Missing value for ${arg}. Example: ${arg}https://api.example.com`)
      }
      serverUrl = value
      continue
    }
    if (arg.startsWith('--webapp-url=') || arg.startsWith('--webapp=')) {
      const value = arg.split('=', 2)[1]
      if (!value) {
        throw new Error(`Missing value for ${arg}. Example: ${arg}https://webapp.example.com`)
      }
      webappUrl = value
      continue
    }
    cleanedArgs.push(arg)
  }

  return { serverUrl, webappUrl, cleanedArgs }
}

function shouldRequireServerUrl(argv: string[]): boolean {
  return !argv.includes('--help')
    && !argv.includes('-h')
    && !argv.includes('--version')
    && !argv.includes('-v')
}

class Configuration {
  public readonly serverUrl: string
  public readonly webappUrl: string
  public readonly isDaemonProcess: boolean

  // Directories and paths (from persistence)
  public readonly happyHomeDir: string
  public readonly logsDir: string
  public readonly settingsFile: string
  public readonly privateKeyFile: string
  public readonly daemonStateFile: string
  public readonly daemonLockFile: string
  public readonly currentCliVersion: string

  public readonly isExperimentalEnabled: boolean
  public readonly disableCaffeinate: boolean

  constructor() {
    // Server configuration - required CLI parameter
    const argv = process.argv.slice(2)
    let resolvedServerUrl: string | null = null
    let resolvedWebappUrl: string | null = null
    try {
      const parsed = parseServerUrlArgs(argv)
      resolvedServerUrl = parsed.serverUrl
      resolvedWebappUrl = parsed.webappUrl
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
    if (!resolvedServerUrl && process.env.VITEST && process.env.HAPPY_SERVER_URL) {
      resolvedServerUrl = process.env.HAPPY_SERVER_URL
    }
    if (!resolvedServerUrl && shouldRequireServerUrl(argv)) {
      console.error('Missing required --server-url <url> argument. Example: happy --server-url https://api.example.com')
      process.exit(1)
    }
    if (resolvedServerUrl) {
      process.env.HAPPY_SERVER_URL = resolvedServerUrl
    }
    this.serverUrl = resolvedServerUrl || ''
    if (resolvedWebappUrl) {
      process.env.HAPPY_WEBAPP_URL = resolvedWebappUrl
    }
    this.webappUrl = resolvedWebappUrl || process.env.HAPPY_WEBAPP_URL || ''

    // Check if we're running as daemon based on process args
    const args = process.argv.slice(2)
    this.isDaemonProcess = args.length >= 2 && args[0] === 'daemon' && (args[1] === 'start-sync')

    // Directory configuration - Priority: HAPPY_HOME_DIR env > default home dir
    if (process.env.HAPPY_HOME_DIR) {
      // Expand ~ to home directory if present
      const expandedPath = process.env.HAPPY_HOME_DIR.replace(/^~/, homedir())
      this.happyHomeDir = expandedPath
    } else {
      this.happyHomeDir = join(homedir(), '.happy')
    }

    this.logsDir = join(this.happyHomeDir, 'logs')
    this.settingsFile = join(this.happyHomeDir, 'settings.json')
    this.privateKeyFile = join(this.happyHomeDir, 'access.key')
    this.daemonStateFile = join(this.happyHomeDir, 'daemon.state.json')
    this.daemonLockFile = join(this.happyHomeDir, 'daemon.state.json.lock')

    this.isExperimentalEnabled = ['true', '1', 'yes'].includes(process.env.HAPPY_EXPERIMENTAL?.toLowerCase() || '');
    this.disableCaffeinate = ['true', '1', 'yes'].includes(process.env.HAPPY_DISABLE_CAFFEINATE?.toLowerCase() || '');

    this.currentCliVersion = packageJson.version

    if (!existsSync(this.happyHomeDir)) {
      mkdirSync(this.happyHomeDir, { recursive: true })
    }
    // Ensure directories exist
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true })
    }
  }
}

export const configuration: Configuration = new Configuration()
