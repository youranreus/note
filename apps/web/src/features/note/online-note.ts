import type { AxiosError } from 'axios'

import type {
  InteractionState,
  NoteEditAccess,
  NoteReadErrorDto,
  NoteReadViewStatus,
  NoteWriteErrorDto,
  OnlineNoteDetailDto,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

export type OnlineNoteSaveState = 'unsaved' | 'saving' | 'saved' | 'save-error'
export type OnlineNoteObjectHeaderTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export interface OnlineNoteViewModel {
  status: NoteReadViewStatus
  sid: string | null
  content: string | null
  editAccess: NoteEditAccess | null
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

export interface OnlineNoteObjectHeaderModel {
  sid: string
  saveStatusLabel: string
  saveStatusTone: OnlineNoteObjectHeaderTone
  shareStatusLabel: string
  shareStatusTone: OnlineNoteObjectHeaderTone
  shareStatusDescription: string
  editStatusLabel: string
  editStatusTone: OnlineNoteObjectHeaderTone
  editStatusCaption: string
  canCopyShareLink: boolean
  copyButtonLabel: string
  copyButtonState: InteractionState
}

interface OnlineNoteSaveFeedbackInput {
  viewStatus: NoteReadViewStatus
  editAccess: NoteEditAccess | null
  saveState: OnlineNoteSaveState
  hasUnsavedChanges: boolean
  errorMessage?: string | null
}

interface OnlineNoteObjectHeaderInput {
  sid: string | null
  viewStatus: NoteReadViewStatus
  editAccess: NoteEditAccess | null
  saveState: OnlineNoteSaveState
}

function resolveSaveStatusLabel(
  viewStatus: NoteReadViewStatus,
  saveState: OnlineNoteSaveState
): { label: string; tone: OnlineNoteObjectHeaderTone } {
  if (saveState === 'saving') {
    return {
      label: '保存中',
      tone: 'accent'
    }
  }

  if (saveState === 'saved') {
    return {
      label: '已保存',
      tone: 'success'
    }
  }

  if (saveState === 'save-error') {
    return {
      label: '保存失败',
      tone: 'danger'
    }
  }

  if (viewStatus === 'not-found') {
    return {
      label: '尚未保存',
      tone: 'warning'
    }
  }

  return {
    label: '未保存变更',
    tone: 'warning'
  }
}

function createViewModel(
  status: NoteReadViewStatus,
  sid: string | null,
  title: string,
  description: string,
  content: string | null = null,
  editAccess: NoteEditAccess | null = null
): OnlineNoteViewModel {
  return {
    status,
    sid,
    content,
    editAccess,
    title,
    description
  }
}

function createAvailableDescription(editAccess: NoteEditAccess) {
  if (editAccess === 'owner-editable') {
    return '当前对象已经绑定到你的创建者身份，可以继续编辑并保存更新。'
  }

  if (editAccess === 'forbidden') {
    return '当前对象已绑定创建者身份，你现在可以查看内容，但不能修改或保存更新。'
  }

  return '当前对象已经存在，持有链接即可继续编辑并保存更新。'
}

export function canEditOnlineNote(editAccess: NoteEditAccess | null) {
  return editAccess !== 'forbidden'
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
    candidate.status === 'available' &&
    (candidate.editAccess === 'owner-editable' ||
      candidate.editAccess === 'anonymous-editable' ||
      candidate.editAccess === 'forbidden')
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
    (candidate.editAccess === 'owner-editable' ||
      candidate.editAccess === 'anonymous-editable' ||
      candidate.editAccess === 'forbidden') &&
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
      createAvailableDescription(snapshot.note.editAccess),
      snapshot.note.content,
      snapshot.note.editAccess
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

  if (input.viewStatus === 'available' && input.editAccess === 'forbidden') {
    return {
      tone: 'warning',
      state: 'default',
      title: '当前账户只能查看',
      description: '该对象已绑定创建者，如需编辑请先使用创建者身份恢复登录。'
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

export function downgradeOnlineNoteDetailToForbidden(note: unknown, sid: string) {
  if (!isOnlineNoteDetailDto(note) || note.sid !== sid) {
    return null
  }

  return {
    ...note,
    editAccess: 'forbidden' as const
  }
}

function resolveEditStatus(input: OnlineNoteObjectHeaderInput) {
  if (input.viewStatus === 'not-found') {
    return {
      label: '首次保存后决定编辑身份',
      tone: 'warning' as const,
      caption: '已登录时会绑定创建者，未登录则保持匿名可编辑。'
    }
  }

  if (input.editAccess === 'owner-editable') {
    return {
      label: '创建者可编辑',
      tone: 'success' as const,
      caption: '当前登录身份与对象作者一致，可以继续保存更新。'
    }
  }

  if (input.editAccess === 'forbidden') {
    return {
      label: '当前账户不可编辑',
      tone: 'danger' as const,
      caption: '请使用创建者身份重新登录后再试。'
    }
  }

  return {
    label: '匿名可编辑',
    tone: 'warning' as const,
    caption: '该对象尚未绑定创建者，持有链接即可继续修改。'
  }
}

export function resolveOnlineNoteObjectHeader(
  input: OnlineNoteObjectHeaderInput
): OnlineNoteObjectHeaderModel | null {
  if (!input.sid) {
    return null
  }

  if (input.viewStatus !== 'available' && input.viewStatus !== 'not-found') {
    return null
  }

  const saveStatus = resolveSaveStatusLabel(input.viewStatus, input.saveState)
  const canCopyShareLink = input.viewStatus === 'available' && input.saveState !== 'saving'
  const isExistingSharedObject = input.viewStatus === 'available'
const editStatus = resolveEditStatus(input)

  return {
    sid: input.sid,
    saveStatusLabel: saveStatus.label,
    saveStatusTone: saveStatus.tone,
    shareStatusLabel: isExistingSharedObject ? '可分享' : '保存后可分享',
    shareStatusTone: isExistingSharedObject ? 'success' : 'warning',
    shareStatusDescription: isExistingSharedObject
      ? input.saveState === 'saving'
        ? '当前固定链接仍然可分享，接收者会先看到最近一次成功保存的内容，最新修改保存完成后再同步。'
        : '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。'
      : '先完成首次保存，当前 sid 才会成为可直接分享的稳定对象链接。',
    editStatusLabel: editStatus.label,
    editStatusTone: editStatus.tone,
    editStatusCaption: editStatus.caption,
    canCopyShareLink,
    copyButtonLabel: '复制链接',
    copyButtonState: canCopyShareLink ? 'default' : 'disabled'
  }
}

export function createOnlineNoteCopySuccessFeedback(): OnlineNoteSaveFeedback {
  return {
    tone: 'success',
    state: 'default',
    title: '已复制当前在线便签链接',
    description: '你可以把这个稳定链接直接发给别人。'
  }
}

export function createOnlineNoteCopyFailureFeedback(
  description = '当前浏览器无法复制链接，请手动复制地址栏中的链接后重试。'
): OnlineNoteSaveFeedback {
  return {
    tone: 'danger',
    state: 'error',
    title: '复制当前在线便签链接失败',
    description
  }
}
