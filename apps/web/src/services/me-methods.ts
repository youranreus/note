import type { MyNotesQueryDto, MyNotesResponseDto } from '@note/shared-types'

import { alovaClient } from './http-client'

const myNotesCacheRevisions = new Map<string, number>()

function resolveMyNotesCacheRevision(cacheScope: string) {
  return myNotesCacheRevisions.get(cacheScope) ?? 0
}

export function invalidateMyNotesCache(cacheScope = 'anonymous') {
  myNotesCacheRevisions.set(
    cacheScope,
    resolveMyNotesCacheRevision(cacheScope) + 1
  )
}

export function invalidateMyNotesCacheForUser(userId: string | null | undefined) {
  const normalizedUserId = userId?.trim()

  if (!normalizedUserId) {
    return
  }

  invalidateMyNotesCache(`user:${normalizedUserId}`)
}

export function createGetMyNotesMethod(
  query: MyNotesQueryDto = {},
  cacheScope = 'anonymous'
) {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const revision = resolveMyNotesCacheRevision(cacheScope)

  return alovaClient.Get<MyNotesResponseDto>('/api/me/notes', {
    params: {
      page,
      limit
    },
    name: `me-notes:${cacheScope}:r${revision}:${page}:${limit}`,
    cacheFor: 30 * 1000
  })
}
