import type { FavoriteRequestDto, FavoriteResponseDto } from '@note/shared-types'

import { alovaClient } from './http-client'

export function createFavoriteNoteMethod(payload: FavoriteRequestDto) {
  return alovaClient.Post<FavoriteResponseDto>('/api/favorites', payload, {
    name: `favorite-note:${payload.sid}`,
    cacheFor: 0
  })
}
