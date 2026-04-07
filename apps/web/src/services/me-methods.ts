import type { MyNotesQueryDto, MyNotesResponseDto } from '@note/shared-types'

import { alovaClient } from './http-client'

export function createGetMyNotesMethod(
  query: MyNotesQueryDto = {},
  cacheScope = 'anonymous'
) {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return alovaClient.Get<MyNotesResponseDto>('/api/me/notes', {
    params: {
      page,
      limit
    },
    name: `me-notes:${cacheScope}:${page}:${limit}`,
    cacheFor: 30 * 1000
  })
}
