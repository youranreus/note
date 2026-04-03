import type {
  OnlineNoteDetailDto,
  OnlineNoteSaveRequestDto,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

import { alovaClient } from './http-client'

export function createGetOnlineNoteDetailMethod(sid: string) {
  return alovaClient.Get<OnlineNoteDetailDto>(`/api/notes/${encodeURIComponent(sid)}`, {
    name: `online-note-detail:${sid}`,
    cacheFor: 0
  })
}

export function createSaveOnlineNoteMethod(sid: string, payload: OnlineNoteSaveRequestDto) {
  return alovaClient.Put<OnlineNoteSaveResponseDto>(`/api/notes/${encodeURIComponent(sid)}`, payload, {
    name: `online-note-save:${sid}`,
    cacheFor: 0
  })
}
