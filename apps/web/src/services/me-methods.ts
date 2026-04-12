import type {
  MyFavoritesResponseDto,
  MyNotesQueryDto,
  MyNotesResponseDto
} from '@note/shared-types'

import { alovaClient } from './http-client'

const myNotesCacheRevisions = new Map<string, number>()
const myFavoritesCacheRevisions = new Map<string, number>()
const myListsPageSize = 5

function resolveMyNotesCacheRevision(cacheScope: string) {
  return myNotesCacheRevisions.get(cacheScope) ?? 0
}

function resolveMyFavoritesCacheRevision(cacheScope: string) {
  return myFavoritesCacheRevisions.get(cacheScope) ?? 0
}

export function invalidateMyNotesCache(cacheScope = 'anonymous') {
  myNotesCacheRevisions.set(
    cacheScope,
    resolveMyNotesCacheRevision(cacheScope) + 1
  )
}

export function invalidateMyFavoritesCache(cacheScope = 'anonymous') {
  myFavoritesCacheRevisions.set(
    cacheScope,
    resolveMyFavoritesCacheRevision(cacheScope) + 1
  )
}

export function invalidateMyNotesCacheForUser(userId: string | null | undefined) {
  const normalizedUserId = userId?.trim()

  if (!normalizedUserId) {
    return
  }

  invalidateMyNotesCache(`user:${normalizedUserId}`)
}

export function invalidateMyFavoritesCacheForUser(userId: string | null | undefined) {
  const normalizedUserId = userId?.trim()

  if (!normalizedUserId) {
    return
  }

  invalidateMyFavoritesCache(`user:${normalizedUserId}`)
}

export function createGetMyNotesMethod(
  query: MyNotesQueryDto = {},
  cacheScope = 'anonymous'
) {
  const page = query.page ?? 1
  const limit = query.limit ?? myListsPageSize
  const revision = resolveMyNotesCacheRevision(cacheScope)

  return alovaClient.Get<MyNotesResponseDto>('/api/me/notes', {
    params: {
      page,
      limit
    },
    name: `me-notes:${cacheScope}:r${revision}:${page}:${limit}`,
    cacheFor: 0
  })
}

export function createGetMyFavoritesMethod(
  query: MyNotesQueryDto = {},
  cacheScope = 'anonymous'
) {
  const page = query.page ?? 1
  const limit = query.limit ?? myListsPageSize
  const revision = resolveMyFavoritesCacheRevision(cacheScope)

  return alovaClient.Get<MyFavoritesResponseDto>('/api/me/favorites', {
    params: {
      page,
      limit
    },
    name: `me-favorites:${cacheScope}:r${revision}:${page}:${limit}`,
    cacheFor: 0
  })
}
