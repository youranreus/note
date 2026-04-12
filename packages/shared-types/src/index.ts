export type AuthStatus = 'anonymous' | 'authenticated' | 'recovering'
export type PostLoginActionType = 'favorite-note'

export type AuthCallbackErrorCode =
  | 'AUTH_CODE_MISSING'
  | 'AUTH_STATE_INVALID'
  | 'AUTH_CALLBACK_FAILED'

export type NoteMode = 'online' | 'local'

export type InteractionState = 'default' | 'focus' | 'error' | 'disabled'

export type NoteReadStatus = 'available' | 'not-found' | 'deleted'
export type NoteEditAccess =
  | 'owner-editable'
  | 'anonymous-editable'
  | 'key-required'
  | 'key-editable'
  | 'forbidden'

export type NoteReadViewStatus = 'loading' | NoteReadStatus | 'invalid-sid' | 'error'
export type OnlineNoteFavoriteState = 'not-favorited' | 'favorited' | 'self-owned'

export type NoteReadErrorCode =
  | 'INVALID_SID'
  | 'NOTE_NOT_FOUND'
  | 'NOTE_DELETED'
  | 'NOTE_SID_CONFLICT'

export type NoteReadErrorStatus = Exclude<NoteReadViewStatus, 'loading' | 'available'>

export type OnlineNoteSaveResult = 'created' | 'updated'
export type OnlineNoteDeleteResult = 'deleted'

export type NoteWriteErrorCode =
  | 'INVALID_SID'
  | 'NOTE_DELETED'
  | 'NOTE_EDIT_KEY_ACTION_INVALID'
  | 'NOTE_EDIT_KEY_REQUIRED'
  | 'NOTE_EDIT_KEY_INVALID'
  | 'NOTE_FORBIDDEN'
  | 'NOTE_SID_CONFLICT'

export type NoteDeleteErrorCode =
  | 'INVALID_SID'
  | 'NOTE_NOT_FOUND'
  | 'NOTE_DELETED'
  | 'NOTE_EDIT_KEY_REQUIRED'
  | 'NOTE_EDIT_KEY_INVALID'
  | 'NOTE_FORBIDDEN'
  | 'NOTE_SID_CONFLICT'

export type NoteWriteErrorStatus = 'invalid-sid' | 'deleted' | 'forbidden' | 'error'
export type NoteDeleteErrorStatus = 'invalid-sid' | 'not-found' | 'deleted' | 'forbidden' | 'error'
export type FavoriteErrorCode =
  | 'FAVORITE_AUTH_REQUIRED'
  | 'FAVORITE_NOTE_NOT_FOUND'
  | 'FAVORITE_NOTE_DELETED'
  | 'FAVORITE_SELF_OWNED_NOT_ALLOWED'
  | 'FAVORITE_NOTE_SID_CONFLICT'

export type FavoriteErrorStatus =
  | 'unauthorized'
  | 'not-found'
  | 'deleted'
  | 'forbidden'
  | 'error'
export type MeErrorCode = 'ME_AUTH_REQUIRED'
export type MeErrorStatus = 'unauthorized'
export type UserPanelTab = 'created' | 'favorites'

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
  ssoId: string
  displayName: string
  avatarUrl: string | null
}

export interface AnonymousSessionDto {
  status: 'anonymous'
}

export interface AuthenticatedSessionDto {
  status: 'authenticated'
  user: AuthUserDto
}

export type SessionResponseDto = AnonymousSessionDto | AuthenticatedSessionDto

export interface FavoriteNotePostLoginActionDto {
  type: 'favorite-note'
  sid: string
}

export type PostLoginActionDto = FavoriteNotePostLoginActionDto

export interface AuthCallbackSuccessDto extends AuthenticatedSessionDto {
  returnTo: string
  postLoginAction: PostLoginActionDto | null
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
  editAccess: NoteEditAccess
  favoriteState: OnlineNoteFavoriteState
}

export interface OnlineNoteDetailRequestDto {
  editKey?: string
}

export type OnlineNoteEditKeyAction = 'none' | 'set' | 'use'

export interface OnlineNoteSaveRequestDto {
  content: string
  editKey?: string
  editKeyAction?: OnlineNoteEditKeyAction
}

export interface OnlineNoteSaveResponseDto extends OnlineNoteDetailDto {
  saveResult: OnlineNoteSaveResult
}

export interface OnlineNoteDeleteResponseDto {
  sid: string
  status: OnlineNoteDeleteResult
  message: string
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

export interface NoteDeleteErrorDto {
  sid: string
  code: NoteDeleteErrorCode
  status: NoteDeleteErrorStatus
  message: string
}

export interface FavoriteRequestDto {
  sid: string
}

export interface FavoriteResponseDto {
  sid: string
  favoriteState: 'favorited'
}

export interface FavoriteErrorDto {
  sid: string
  code: FavoriteErrorCode
  status: FavoriteErrorStatus
  message: string
}

export interface MyNotesQueryDto {
  page?: number
  limit?: number
}

export interface MyNoteSummaryDto {
  sid: string
  preview: string
  updatedAt: string
}

export interface MyNotesResponseDto {
  items: MyNoteSummaryDto[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface MyFavoriteSummaryDto {
  sid: string
  preview: string
  updatedAt: string
  favoritedAt: string
}

export interface MyFavoritesResponseDto {
  items: MyFavoriteSummaryDto[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface MeErrorDto {
  code: MeErrorCode
  status: MeErrorStatus
  message: string
}

const safeAuthReturnToPatterns = [/^\/$/u, /^\/[ol](?:\/[A-Za-z0-9-]+)?$/u]

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
