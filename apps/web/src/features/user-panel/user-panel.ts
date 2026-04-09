import type {
  MyFavoritesResponseDto,
  MyNotesResponseDto
} from '@note/shared-types'

export function isMyNotesResponseDto(value: unknown): value is MyNotesResponseDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<MyNotesResponseDto>

  return (
    Array.isArray(candidate.items) &&
    typeof candidate.page === 'number' &&
    typeof candidate.limit === 'number' &&
    typeof candidate.total === 'number' &&
    typeof candidate.hasMore === 'boolean'
  )
}

export function isMyFavoritesResponseDto(value: unknown): value is MyFavoritesResponseDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<MyFavoritesResponseDto>

  return (
    Array.isArray(candidate.items) &&
    typeof candidate.page === 'number' &&
    typeof candidate.limit === 'number' &&
    typeof candidate.total === 'number' &&
    typeof candidate.hasMore === 'boolean'
  )
}

export function resolveUserPanelErrorMessage(
  error: unknown,
  fallback = '读取我的创建失败，请稍后重试。'
) {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message
  }

  return fallback
}

export function isUnauthorizedUserPanelError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    'response' in error &&
    !!error.response &&
    typeof error.response === 'object' &&
    'status' in error.response &&
    error.response.status === 401
  )
}

export function formatUserPanelUpdatedAt(updatedAt: string) {
  const parsedDate = new Date(updatedAt)

  if (Number.isNaN(parsedDate.getTime())) {
    return '更新时间未知'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsedDate)
}

export function formatUserPanelFavoritedAt(favoritedAt: string) {
  const formattedValue = formatUserPanelUpdatedAt(favoritedAt)

  if (formattedValue === '更新时间未知') {
    return '收藏时间未知'
  }

  return `收藏于 ${formattedValue}`
}
