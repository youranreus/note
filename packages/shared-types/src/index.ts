export type AuthStatus = 'anonymous' | 'authenticated' | 'recovering'

export type NoteMode = 'online' | 'local'

export type InteractionState = 'default' | 'focus' | 'error' | 'disabled'

export type NoteReadStatus = 'available' | 'not-found' | 'deleted'

export type NoteReadViewStatus = 'loading' | NoteReadStatus | 'invalid-sid' | 'error'

export type NoteReadErrorCode =
  | 'INVALID_SID'
  | 'NOTE_NOT_FOUND'
  | 'NOTE_DELETED'
  | 'NOTE_SID_CONFLICT'

export type NoteReadErrorStatus = Exclude<NoteReadViewStatus, 'loading' | 'available'>

export type OnlineNoteSaveResult = 'created' | 'updated'

export type NoteWriteErrorCode = 'INVALID_SID' | 'NOTE_DELETED' | 'NOTE_SID_CONFLICT'

export type NoteWriteErrorStatus = 'invalid-sid' | 'deleted' | 'error'

export interface ShellRouteDefinition {
  mode: NoteMode
  path: string
  title: string
  description: string
}

export interface HealthResponse {
  ok: true
  service: 'api'
  timestamp: string
}

export interface OnlineNoteDetailDto {
  sid: string
  content: string
  status: 'available'
}

export interface OnlineNoteSaveRequestDto {
  content: string
}

export interface OnlineNoteSaveResponseDto extends OnlineNoteDetailDto {
  saveResult: OnlineNoteSaveResult
}

export interface NoteReadErrorDto {
  sid: string
  code: NoteReadErrorCode
  status: NoteReadErrorStatus
  message: string
}

export interface NoteWriteErrorDto {
  sid: string
  code: NoteWriteErrorCode
  status: NoteWriteErrorStatus
  message: string
}
