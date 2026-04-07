import type { MyNotesResponseDto } from '@note/shared-types'

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

export function resolveUserPanelErrorMessage(error: unknown) {
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

  return '读取我的创建失败，请稍后重试。'
}

export function formatUserPanelUpdatedAt(updatedAt: string) {
  const parsedDate = new Date(updatedAt)

  if (Number.isNaN(parsedDate.getTime())) {
    return '更新时间未知'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsedDate)
}
