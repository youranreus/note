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
  actorUserId: number | bigint | null
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
  const ssoId = normalizeAuthSessionSsoId(session)
  const matchedUser = ssoId
    ? await userRepository.findBySsoId(ssoId, queryClient)
    : null

  if (record.authorId == null) {
    return {
      actor: 'anonymous',
      actorUserId: matchedUser?.id ?? null,
      editAccess: hasEditKeyProtection ? 'key-required' : 'anonymous-editable',
      hasEditKeyProtection
    }
  }

  if (!matchedUser) {
    return {
      actor: 'anonymous',
      actorUserId: null,
      editAccess: hasEditKeyProtection ? 'key-required' : 'forbidden',
      hasEditKeyProtection
    }
  }

  if (toBigInt(matchedUser.id) === toBigInt(record.authorId)) {
    return {
      actor: 'owner',
      actorUserId: matchedUser.id,
      editAccess: 'owner-editable',
      hasEditKeyProtection
    }
  }

  return {
    actor: 'session-non-owner',
    actorUserId: matchedUser.id,
    editAccess: hasEditKeyProtection ? 'key-required' : 'forbidden',
    hasEditKeyProtection
  }
}
