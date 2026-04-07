import { describe, expect, it } from 'vitest'

import type { AuthenticatedSessionDto } from '@note/shared-types'

import { resolveNoteAuthorizationContext } from '../src/services/note-authorization-service.js'

function createSession(userId = '1001'): AuthenticatedSessionDto {
  return {
    status: 'authenticated',
    user: {
      id: userId,
      displayName: 'Demo User'
    }
  }
}

describe('note authorization service', () => {
  it('treats anonymous notes without edit keys as anonymous-editable', async () => {
    const context = await resolveNoteAuthorizationContext(
      {
        authorId: null,
        keyHash: null
      },
      null,
      {
        async findBySsoId() {
          return null
        }
      }
    )

    expect(context).toEqual({
      actor: 'anonymous',
      actorUserId: null,
      editAccess: 'anonymous-editable',
      hasEditKeyProtection: false
    })
  })

  it('treats keyed notes as key-required for non-owner sessions', async () => {
    const context = await resolveNoteAuthorizationContext(
      {
        authorId: 7,
        keyHash: 'hashed-secret'
      },
      createSession('2002'),
      {
        async findBySsoId() {
          return {
            id: 9,
            ssoId: 2002n
          }
        }
      }
    )

    expect(context).toEqual({
      actor: 'session-non-owner',
      actorUserId: 9,
      editAccess: 'key-required',
      hasEditKeyProtection: true
    })
  })

  it('treats keyed owner-bound notes as owner-editable for the owner session', async () => {
    const context = await resolveNoteAuthorizationContext(
      {
        authorId: 7,
        keyHash: 'hashed-secret'
      },
      createSession('1001'),
      {
        async findBySsoId() {
          return {
            id: 7,
            ssoId: 1001n
          }
        }
      }
    )

    expect(context).toEqual({
      actor: 'owner',
      actorUserId: 7,
      editAccess: 'owner-editable',
      hasEditKeyProtection: true
    })
  })

  it('treats owner-bound notes without a valid session as forbidden', async () => {
    const context = await resolveNoteAuthorizationContext(
      {
        authorId: 7,
        keyHash: null
      },
      null,
      {
        async findBySsoId() {
          return null
        }
      }
    )

    expect(context).toEqual({
      actor: 'anonymous',
      actorUserId: null,
      editAccess: 'forbidden',
      hasEditKeyProtection: false
    })
  })
})
