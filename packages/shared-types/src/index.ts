export type AuthStatus = 'anonymous' | 'authenticated' | 'recovering'

export type AuthCallbackErrorCode =
  | 'AUTH_CODE_MISSING'
  | 'AUTH_STATE_INVALID'
  | 'AUTH_CALLBACK_FAILED'

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

export interface AuthUserDto {
  id: string
  displayName: string
}

export interface AnonymousSessionDto {
  status: 'anonymous'
}

export interface AuthenticatedSessionDto {
  status: 'authenticated'
  user: AuthUserDto
}

export type SessionResponseDto = AnonymousSessionDto | AuthenticatedSessionDto

export interface AuthCallbackSuccessDto extends AuthenticatedSessionDto {
  returnTo: string
  message: string
}

export interface AuthCallbackErrorDto {
  status: 'error'
  code: AuthCallbackErrorCode
  message: string
}

export type AuthCallbackResponseDto = AuthCallbackSuccessDto | AuthCallbackErrorDto

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

const safeAuthReturnToPatterns = [/^\/$/u, /^\/note\/[ol](?:\/[A-Za-z0-9-]+)?$/u]

export function isSafeAuthReturnToPath(path: string) {
  if (!path || path.includes('\n') || path.includes('\r') || path.startsWith('//')) {
    return false
  }

  return safeAuthReturnToPatterns.some((pattern) => pattern.test(path))
}

export function normalizeAuthReturnToPath(
  input: string | null | undefined,
  fallback = '/'
) {
  const safeFallback = isSafeAuthReturnToPath(fallback) ? fallback : '/'

  if (typeof input !== 'string') {
    return safeFallback
  }

  const trimmed = input.trim()

  if (!trimmed.startsWith('/')) {
    return safeFallback
  }

  try {
    const normalizedUrl = new URL(trimmed, 'https://note.local')
    const normalizedPath = normalizedUrl.pathname

    return isSafeAuthReturnToPath(normalizedPath) ? normalizedPath : safeFallback
  } catch {
    return safeFallback
  }
}
