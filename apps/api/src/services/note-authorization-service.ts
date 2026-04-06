import type { AuthenticatedSessionDto, NoteEditAccess } from '@note/shared-types'

import type { PrismaQueryClientLike } from './prisma-client.js'
import {
  normalizeAuthSessionSsoId,
  toBigInt,
  type UserRepository
} from './user-service.js'

export interface NoteAuthorizationRecord {
  authorId: number | bigint | null
  keyHash: string | null
}

export interface NoteAuthorizationContext {
  actor: 'anonymous' | 'owner' | 'session-non-owner'
  editAccess: NoteEditAccess
  hasEditKeyProtection: boolean
}

export async function resolveNoteAuthorizationContext(
  record: NoteAuthorizationRecord,
  session: AuthenticatedSessionDto | null,
  userRepository: Pick<UserRepository, 'findBySsoId'>,
  queryClient?: PrismaQueryClientLike
): Promise<NoteAuthorizationContext> {
  const hasEditKeyProtection = record.keyHash != null

  if (record.authorId == null) {
    return {
      actor: 'anonymous',
      editAccess: hasEditKeyProtection ? 'key-required' : 'anonymous-editable',
      hasEditKeyProtection
    }
  }

  const ssoId = normalizeAuthSessionSsoId(session)

  if (!ssoId) {
    return {
      actor: 'anonymous',
      editAccess: hasEditKeyProtection ? 'key-required' : 'forbidden',
      hasEditKeyProtection
    }
  }

  const matchedUser = await userRepository.findBySsoId(ssoId, queryClient)

  if (!matchedUser) {
    return {
      actor: 'anonymous',
      editAccess: hasEditKeyProtection ? 'key-required' : 'forbidden',
      hasEditKeyProtection
    }
  }

  if (toBigInt(matchedUser.id) === toBigInt(record.authorId)) {
    return {
      actor: 'owner',
      editAccess: 'owner-editable',
      hasEditKeyProtection
    }
  }

  return {
    actor: 'session-non-owner',
    editAccess: hasEditKeyProtection ? 'key-required' : 'forbidden',
    hasEditKeyProtection
  }
}
