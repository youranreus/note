import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

import type { HealthResponse } from '@note/shared-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function readDefinedValue(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim()
    }
  }

  return undefined
}

function normalizeBasePath(basePath?: string) {
  if (!basePath || basePath === '/') {
    return '/'
  }

  return `/${basePath.replace(/^\/+|\/+$/gu, '')}/`
}

function resolveCallbackPath(basePath?: string) {
  const normalizedBasePath = normalizeBasePath(basePath)

  if (normalizedBasePath === '/') {
    return '/auth/callback'
  }

  return `${normalizedBasePath.slice(0, -1)}/auth/callback`
}

function normalizeOrigin(
  origin: string | undefined,
  fallbackOrigin: string,
  label: string
) {
  const explicitOrigin = readDefinedValue(origin)
  const candidate = explicitOrigin ?? fallbackOrigin

  try {
    return new URL(candidate).origin
  } catch {
    if (explicitOrigin) {
      throw new Error(`Invalid ${label}: ${explicitOrigin}`)
    }

    return fallbackOrigin
  }
}

function resolveEnvFilePath() {
  const directCandidates = [path.resolve(process.cwd(), '.env')]
  const discoveredCandidates: string[] = []

  let currentDir = __dirname

  while (true) {
    discoveredCandidates.push(path.join(currentDir, '.env'))

    const parentDir = path.dirname(currentDir)

    if (parentDir === currentDir) {
      break
    }

    currentDir = parentDir
  }

  const candidates = [...new Set([...directCandidates, ...discoveredCandidates])]

  return candidates.find((candidate) => existsSync(candidate))
}

const envFilePath = resolveEnvFilePath()

dotenv.config(envFilePath ? { path: envFilePath } : undefined)

export interface AppConfig {
  apiOrigin: string
  authFlowCookieName: string
  cookieName: string
  cookieSecure: boolean
  port: number
  sessionTtlSeconds: number
  ssoBrowserUrl: string
  ssoId: string
  ssoRedirect: string
  ssoSecret?: string
  ssoUrl: string
  ssoMockEnabled: boolean
  ssoMockTicketPrefix: string
  webOrigin: string
}

function readBooleanValue(value: string | undefined, fallback: boolean) {
  const normalizedValue = readDefinedValue(value)

  if (!normalizedValue) {
    return fallback
  }

  if (normalizedValue === 'true') {
    return true
  }

  if (normalizedValue === 'false') {
    return false
  }

  return fallback
}

export function normalizeCallbackUrl(
  urlString: string | undefined,
  webOrigin: string,
  basePath = '/'
) {
  const callbackPath = resolveCallbackPath(basePath)
  const fallback = new URL(callbackPath, webOrigin).toString()
  const normalizedInput = readDefinedValue(urlString)

  if (!normalizedInput) {
    return fallback
  }

  try {
    const url = new URL(normalizedInput)
    url.pathname = callbackPath
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return fallback
  }
}

export function resolveAppConfig(overrides: Partial<NodeJS.ProcessEnv> = {}): AppConfig {
  const basePath = readDefinedValue(overrides.VITE_BASE_URL, process.env.VITE_BASE_URL)
  const webOrigin = normalizeOrigin(
    overrides.WEB_ORIGIN ?? process.env.WEB_ORIGIN,
    'http://localhost:5173',
    'WEB_ORIGIN'
  )
  const apiOrigin = normalizeOrigin(
    overrides.API_ORIGIN ?? process.env.API_ORIGIN,
    'http://localhost:3001',
    'API_ORIGIN'
  )
  const cookieName = readDefinedValue(overrides.COOKIE_NAME, process.env.COOKIE_NAME) ?? 'sid'
  const cookieSecure = readBooleanValue(
    overrides.COOKIE_SECURE ?? process.env.COOKIE_SECURE,
    false
  )
  const port = Number(readDefinedValue(overrides.PORT, process.env.PORT) ?? '3001')
  const sessionTtlSeconds = Number(
    readDefinedValue(overrides.SESSION_TTL_SECONDS, process.env.SESSION_TTL_SECONDS) ?? '604800'
  )
  const ssoBrowserUrl = normalizeOrigin(
    overrides.VITE_SSO_URL ?? process.env.VITE_SSO_URL,
    'https://sf.imouto.tech',
    'VITE_SSO_URL'
  )
  const ssoId = readDefinedValue(overrides.SSO_ID, process.env.SSO_ID) ?? 'note-web'
  const ssoRedirect = normalizeCallbackUrl(
    overrides.SSO_REDIRECT ?? process.env.SSO_REDIRECT,
    webOrigin,
    basePath
  )
  const ssoSecret = readDefinedValue(overrides.SSO_SECRET, process.env.SSO_SECRET)
  const ssoUrl = normalizeOrigin(
    overrides.SSO_URL ?? process.env.SSO_URL,
    'https://sf.imouto.tech',
    'SSO_URL'
  )
  const ssoMockEnabled = readBooleanValue(
    overrides.SSO_MOCK_ENABLED ?? process.env.SSO_MOCK_ENABLED,
    false
  )
  const ssoMockTicketPrefix =
    readDefinedValue(overrides.SSO_MOCK_TICKET_PREFIX, process.env.SSO_MOCK_TICKET_PREFIX) ?? 'mock:'

  return {
    apiOrigin,
    authFlowCookieName: `${cookieName}_flow`,
    cookieName,
    cookieSecure,
    port,
    sessionTtlSeconds,
    ssoBrowserUrl,
    ssoId,
    ssoRedirect,
    ssoSecret,
    ssoUrl,
    ssoMockEnabled,
    ssoMockTicketPrefix,
    webOrigin
  }
}

export function createHealthPayload(): HealthResponse {
  return {
    ok: true,
    service: 'api',
    timestamp: new Date().toISOString()
  }
}
