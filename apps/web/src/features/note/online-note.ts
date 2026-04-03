import type { AxiosError } from 'axios'

import type {
  InteractionState,
  NoteReadErrorDto,
  NoteReadViewStatus,
  NoteWriteErrorDto,
  OnlineNoteDetailDto,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

export type OnlineNoteSaveState = 'unsaved' | 'saving' | 'saved' | 'save-error'

export interface OnlineNoteViewModel {
  status: NoteReadViewStatus
  sid: string | null
  content: string | null
  title: string
  description: string
}

export interface OnlineNoteStateSnapshot {
  sid: string | null
  loading: boolean
  note?: unknown
  error?: unknown
}

export interface OnlineNoteSaveFeedback {
  tone: 'info' | 'success' | 'warning' | 'danger'
  state: InteractionState
  title: string
  description: string
}

interface OnlineNoteSaveFeedbackInput {
  viewStatus: NoteReadViewStatus
  saveState: OnlineNoteSaveState
  hasUnsavedChanges: boolean
  errorMessage?: string | null
}

function createViewModel(
  status: NoteReadViewStatus,
  sid: string | null,
  title: string,
  description: string,
  content: string | null = null
): OnlineNoteViewModel {
  return {
    status,
    sid,
    content,
    title,
    description
  }
}

export function isNoteReadErrorDto(value: unknown): value is NoteReadErrorDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<NoteReadErrorDto>

  return (
    typeof candidate.sid === 'string' &&
    typeof candidate.code === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.message === 'string'
  )
}

export function isNoteWriteErrorDto(value: unknown): value is NoteWriteErrorDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<NoteWriteErrorDto>

  return (
    typeof candidate.sid === 'string' &&
    typeof candidate.code === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.message === 'string'
  )
}

export function isOnlineNoteDetailDto(value: unknown): value is OnlineNoteDetailDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<OnlineNoteDetailDto>

  return (
    typeof candidate.sid === 'string' &&
    typeof candidate.content === 'string' &&
    candidate.status === 'available'
  )
}

export function isOnlineNoteSaveResponseDto(value: unknown): value is OnlineNoteSaveResponseDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<OnlineNoteSaveResponseDto>

  return (
    typeof candidate.sid === 'string' &&
    typeof candidate.content === 'string' &&
    candidate.status === 'available' &&
    (candidate.saveResult === 'created' || candidate.saveResult === 'updated')
  )
}

export function resolveNoteReadErrorDto(error: unknown) {
  const responseData = (error as AxiosError<unknown> | undefined)?.response?.data

  return isNoteReadErrorDto(responseData) ? responseData : null
}

export function resolveNoteWriteErrorDto(error: unknown) {
  const responseData = (error as AxiosError<unknown> | undefined)?.response?.data

  return isNoteWriteErrorDto(responseData) ? responseData : null
}

export function resolveOnlineNoteViewModel(snapshot: OnlineNoteStateSnapshot): OnlineNoteViewModel {
  if (!snapshot.sid) {
    return createViewModel(
      'invalid-sid',
      null,
      '当前链接缺少有效 sid',
      '路由参数必须是单个非空字符串，页面不会把空值或异常参数默默转成伪造对象。'
    )
  }

  if (snapshot.loading) {
    return createViewModel(
      'loading',
      snapshot.sid,
      '正在读取在线便签',
      '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。'
    )
  }

  const noteReadError = resolveNoteReadErrorDto(snapshot.error)

  if (noteReadError?.status === 'not-found') {
    return createViewModel(
      'not-found',
      snapshot.sid,
      '这个 sid 还没有保存内容',
      '你可以直接开始输入正文，并在当前固定链接下首次保存。'
    )
  }

  if (noteReadError?.status === 'deleted') {
    return createViewModel('deleted', snapshot.sid, '该在线便签已删除', noteReadError.message)
  }

  if (isOnlineNoteDetailDto(snapshot.note) && snapshot.note.sid === snapshot.sid) {
    return createViewModel(
      'available',
      snapshot.note.sid,
      '在线便签内容',
      '当前对象已经存在，可以继续编辑并保存更新。',
      snapshot.note.content
    )
  }

  if (snapshot.note) {
    return createViewModel(
      'error',
      snapshot.sid,
      '读取在线便签失败',
      '当前在线对象返回了无法识别的响应格式，请稍后刷新重试。'
    )
  }

  if (snapshot.error) {
    return createViewModel(
      'error',
      snapshot.sid,
      '读取在线便签失败',
      '读取当前在线对象时发生异常，请稍后刷新重试。'
    )
  }

  return createViewModel(
    'loading',
    snapshot.sid,
    '正在读取在线便签',
    '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。'
  )
}

export function resolveOnlineNoteSaveFeedback(
  input: OnlineNoteSaveFeedbackInput
): OnlineNoteSaveFeedback | null {
  if (input.saveState === 'saving') {
    return {
      tone: 'info',
      state: 'focus',
      title: '保存中',
      description: '正在将当前正文写入该 sid 对应的在线便签。'
    }
  }

  if (input.saveState === 'save-error') {
    return {
      tone: 'danger',
      state: 'error',
      title: '保存失败',
      description: input.errorMessage ?? '保存当前在线对象时发生异常，请稍后重试。'
    }
  }

  if (input.saveState === 'saved') {
    return {
      tone: 'success',
      state: 'default',
      title: '已保存',
      description: '最新修改已经写回当前 sid。'
    }
  }

  if (input.viewStatus === 'not-found') {
    return {
      tone: 'warning',
      state: 'default',
      title: '尚未保存',
      description: '当前 sid 还没有远端对象，点击保存后会创建第一版内容。'
    }
  }

  if (input.hasUnsavedChanges) {
    return {
      tone: 'warning',
      state: 'default',
      title: '未保存变更',
      description: '你已经修改当前正文，点击“保存更新”后会写回同一 sid。'
    }
  }

  return null
}
