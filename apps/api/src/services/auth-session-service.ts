import { randomBytes } from 'node:crypto'

import type { AuthUserDto, AuthenticatedSessionDto } from '@note/shared-types'

export interface PendingAuthFlow {
  expiresAt: number
  returnTo: string
  state: string
}

export interface AuthSessionService {
  createPendingFlow: (returnTo: string) => PendingAuthFlow
  createSession: (user: AuthUserDto) => string
  getSession: (sessionId: string | undefined) => AuthenticatedSessionDto | null
  parsePendingFlow: (cookieValue: string | undefined) => PendingAuthFlow | null
  serializePendingFlow: (flow: PendingAuthFlow) => string
}

export function createAuthSessionService(options: { sessionTtlSeconds: number }): AuthSessionService {
  const sessions = new Map<
    string,
    {
      expiresAt: number
      user: AuthUserDto
    }
  >()

  function now() {
    return Date.now()
  }

  function pruneSession(sessionId: string) {
    const session = sessions.get(sessionId)

    if (!session) {
      return null
    }

    if (session.expiresAt <= now()) {
      sessions.delete(sessionId)
      return null
    }

    return session
  }

  function pruneExpiredSessions() {
    const currentTime = now()

    for (const [sessionId, session] of sessions.entries()) {
      if (session.expiresAt <= currentTime) {
        sessions.delete(sessionId)
      }
    }
  }

  return {
    createPendingFlow(returnTo) {
      return {
        expiresAt: now() + 10 * 60 * 1000,
        returnTo,
        state: randomBytes(16).toString('hex')
      }
    },
    createSession(user) {
      pruneExpiredSessions()
      const sessionId = randomBytes(24).toString('hex')

      sessions.set(sessionId, {
        expiresAt: now() + options.sessionTtlSeconds * 1000,
        user
      })

      return sessionId
    },
    getSession(sessionId) {
      if (!sessionId) {
        return null
      }

      const session = pruneSession(sessionId)

      if (!session) {
        return null
      }

      return {
        status: 'authenticated',
        user: session.user
      }
    },
    parsePendingFlow(cookieValue) {
      if (!cookieValue) {
        return null
      }

      try {
        const parsedValue = JSON.parse(Buffer.from(cookieValue, 'base64url').toString('utf8')) as PendingAuthFlow

        if (
          !parsedValue ||
          typeof parsedValue !== 'object' ||
          typeof parsedValue.state !== 'string' ||
          typeof parsedValue.returnTo !== 'string' ||
          typeof parsedValue.expiresAt !== 'number'
        ) {
          return null
        }

        return parsedValue.expiresAt > now() ? parsedValue : null
      } catch {
        return null
      }
    },
    serializePendingFlow(flow) {
      return Buffer.from(JSON.stringify(flow)).toString('base64url')
    }
  }
}
