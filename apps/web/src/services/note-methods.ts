import type {
  OnlineNoteDeleteResponseDto,
  OnlineNoteDetailRequestDto,
  OnlineNoteDetailDto,
  OnlineNoteSaveRequestDto,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

import { alovaClient } from './http-client'

export function createGetOnlineNoteDetailMethod(
  sid: string,
  request: OnlineNoteDetailRequestDto = {}
) {
  const normalizedEditKey = request.editKey?.trim()

  return alovaClient.Get<OnlineNoteDetailDto>(
    `/api/notes/${encodeURIComponent(sid)}`,
    {
      headers: normalizedEditKey
        ? {
            'x-note-edit-key': normalizedEditKey
          }
        : undefined,
      name: `online-note-detail:${sid}`,
      cacheFor: 0
    }
  )
}

export function createSaveOnlineNoteMethod(sid: string, payload: OnlineNoteSaveRequestDto) {
  return alovaClient.Put<OnlineNoteSaveResponseDto>(`/api/notes/${encodeURIComponent(sid)}`, payload, {
    name: `online-note-save:${sid}`,
    cacheFor: 0
  })
}

export function createDeleteOnlineNoteMethod(
  sid: string,
  request: { editKey?: string } = {}
) {
  const normalizedEditKey = request.editKey?.trim()

  return alovaClient.Delete<OnlineNoteDeleteResponseDto>(`/api/notes/${encodeURIComponent(sid)}`, {
    headers: normalizedEditKey
      ? {
          'x-note-edit-key': normalizedEditKey
        }
      : undefined,
    name: `online-note-delete:${sid}`,
    cacheFor: 0
  })
}
