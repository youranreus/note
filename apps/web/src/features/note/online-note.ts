import type { AxiosError } from 'axios'

import type {
  AuthStatus,
  InteractionState,
  NoteEditAccess,
  NoteReadErrorDto,
  NoteReadViewStatus,
  NoteWriteErrorCode,
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

export interface OnlineNoteAuthorizationUiModel {
  canShowEditor: boolean
  canSave: boolean
  shellDescription: string
  modeBadgeLabel: string
  actionLabel: string
  editorHint: string
  editorPlaceholder: string
  shouldShowEditKeyInput: boolean
  editKeyLabel: string
  editKeyHint: string
  shouldShowEditKeyRisk: boolean
}

interface OnlineNoteSaveFeedbackInput {
  viewStatus: NoteReadViewStatus
  editAccess: NoteEditAccess | null
  saveState: OnlineNoteSaveState
  hasUnsavedChanges: boolean
  errorCode?: NoteWriteErrorCode | null
  errorMessage?: string | null
}

interface OnlineNoteObjectHeaderInput {
  sid: string | null
  viewStatus: NoteReadViewStatus
  editAccess: NoteEditAccess | null
  saveState: OnlineNoteSaveState
}

interface OnlineNoteAuthorizationUiInput {
  viewStatus: NoteReadViewStatus
  editAccess: NoteEditAccess | null
  authStatus: AuthStatus
  hasEditKeyValue: boolean
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

  if (editAccess === 'key-editable') {
    return '当前对象已通过编辑密钥授权，你可以继续编辑并保存更新。'
  }

  if (editAccess === 'key-required') {
    return '当前对象可以正常查看，但需要输入编辑密钥后才能继续保存更新。'
  }

  if (editAccess === 'forbidden') {
    return '当前对象已绑定创建者身份，你现在可以查看内容，但不能修改或保存更新。'
  }

  return '当前对象已经存在，持有链接即可继续编辑并保存更新。'
}

export function canEditOnlineNote(editAccess: NoteEditAccess | null) {
  return editAccess !== 'forbidden'
}

export function resolveInteractiveEditAccess(
  editAccess: NoteEditAccess | null,
  hasEditKeyValue: boolean
) {
  if (editAccess === 'key-editable' && !hasEditKeyValue) {
    return 'key-required'
  }

  return editAccess
}

export function resolveOnlineNoteAuthorizationUiModel(
  input: OnlineNoteAuthorizationUiInput
): OnlineNoteAuthorizationUiModel {
  const effectiveEditAccess = resolveInteractiveEditAccess(input.editAccess, input.hasEditKeyValue)
  const canShowEditor = input.viewStatus === 'available' || input.viewStatus === 'not-found'
  const canSave =
    input.viewStatus === 'not-found' ||
    (input.viewStatus === 'available' && effectiveEditAccess !== 'forbidden')

  let shellDescription = '读取当前在线对象时发生异常，请稍后刷新重试。'

  if (input.viewStatus === 'available') {
    if (effectiveEditAccess === 'owner-editable') {
      shellDescription = '当前固定链接已经绑定到你的创建者对象，后续保存会持续更新同一 sid 下的最新正文。'
    } else if (effectiveEditAccess === 'key-editable') {
      shellDescription = '当前固定链接已经通过编辑密钥授权，后续保存会持续更新同一 sid 下的最新正文。'
    } else if (effectiveEditAccess === 'key-required') {
      shellDescription = '当前固定链接仍然可阅读，但需要输入编辑密钥后才能继续保存更新。'
    } else if (effectiveEditAccess === 'forbidden') {
      shellDescription = '当前固定链接已绑定到创建者对象。你现在仍可阅读内容，但需要切回创建者身份后才能继续保存。'
    } else {
      shellDescription = '当前固定链接已经绑定到真实在线对象，持有链接即可继续保存更新。'
    }
  } else if (input.viewStatus === 'loading') {
    shellDescription = '正在根据当前 sid 读取在线便签的最新已保存内容。'
  } else if (input.viewStatus === 'not-found') {
    shellDescription = '当前链接已经成立，但还没有保存过正文。你可以直接开始输入并首次保存。'
  } else if (input.viewStatus === 'deleted') {
    shellDescription = '当前链接曾关联在线便签，但该对象已经被删除。'
  } else if (input.viewStatus === 'invalid-sid') {
    shellDescription = '路由缺少有效 sid，页面不会把空值或异常参数默默转成伪造对象。'
  }

  let modeBadgeLabel = '异常态'

  if (input.viewStatus === 'not-found') {
    modeBadgeLabel = '待首次保存'
  } else if (input.viewStatus === 'available') {
    if (effectiveEditAccess === 'key-editable') {
      modeBadgeLabel = '共享编辑中'
    } else if (effectiveEditAccess === 'key-required') {
      modeBadgeLabel = '等待密钥'
    } else if (effectiveEditAccess === 'forbidden') {
      modeBadgeLabel = '只读查看'
    } else {
      modeBadgeLabel = '可持续更新'
    }
  } else if (input.viewStatus === 'loading') {
    modeBadgeLabel = '读取中'
  }

  const actionLabel =
    !canSave && input.viewStatus === 'available'
      ? '当前不可保存'
      : input.viewStatus === 'available' && effectiveEditAccess === 'key-required'
        ? '验证密钥并保存'
        : input.viewStatus === 'not-found'
          ? '首次保存'
          : '保存更新'

  let editorHint = '当前正文始终以这个 sid 为边界；点击保存后会更新该固定链接下的最新版本。'

  if (input.viewStatus === 'not-found') {
    editorHint = '首次保存会在当前 sid 下创建在线便签对象，后续继续沿用同一链接更新。'
  } else if (effectiveEditAccess === 'forbidden') {
    editorHint = '当前对象已绑定创建者身份，你可以继续阅读内容；如需修改，请先使用创建者身份恢复登录。'
  } else if (effectiveEditAccess === 'key-required') {
    editorHint = '当前对象已开启共享编辑保护。你可以先修改本地草稿，再输入编辑密钥并保存。'
  } else if (effectiveEditAccess === 'key-editable') {
    editorHint = '当前会话已通过编辑密钥授权；这枚明文密钥只保留在当前页面内存中，切换对象后会自动清空。'
  }

  let editorPlaceholder = '继续编辑当前在线便签正文…'

  if (input.viewStatus === 'not-found') {
    editorPlaceholder = '在这里输入第一版在线便签正文…'
  } else if (effectiveEditAccess === 'forbidden') {
    editorPlaceholder = '当前账户仅可查看此在线便签…'
  } else if (effectiveEditAccess === 'key-required') {
    editorPlaceholder = '可以先整理本地草稿，再输入编辑密钥后保存…'
  }

  const shouldShowEditKeyInput =
    input.viewStatus === 'not-found' ||
    (input.viewStatus === 'available' && effectiveEditAccess !== 'forbidden')

  let editKeyLabel = '设置/更新编辑密钥（可选）'

  if (input.viewStatus === 'not-found') {
    editKeyLabel = '编辑密钥（可选）'
  } else if (effectiveEditAccess === 'key-required') {
    editKeyLabel = '编辑密钥'
  } else if (effectiveEditAccess === 'key-editable') {
    editKeyLabel = '当前会话中的编辑密钥'
  }

  let editKeyHint = '输入后会在本次保存中设置或更新编辑密钥；留空则沿用当前权限模型。'

  if (input.viewStatus === 'not-found') {
    editKeyHint = '留空则按普通在线便签首次保存；输入后会把当前对象创建为共享编辑对象。'
  } else if (effectiveEditAccess === 'key-required') {
    editKeyHint = '当前对象需要正确的编辑密钥才能保存更新；明文只保留在当前页面内存中。'
  } else if (effectiveEditAccess === 'key-editable') {
    editKeyHint = '当前会话已通过编辑密钥授权；切换到其他 sid 后，这枚密钥会自动从页面内存中清空。'
  }

  return {
    canShowEditor,
    canSave,
    shellDescription,
    modeBadgeLabel,
    actionLabel,
    editorHint,
    editorPlaceholder,
    shouldShowEditKeyInput,
    editKeyLabel,
    editKeyHint,
    shouldShowEditKeyRisk:
      input.viewStatus === 'not-found' &&
      input.hasEditKeyValue &&
      input.authStatus === 'anonymous'
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
    candidate.status === 'available' &&
    (candidate.editAccess === 'owner-editable' ||
      candidate.editAccess === 'anonymous-editable' ||
      candidate.editAccess === 'key-required' ||
      candidate.editAccess === 'key-editable' ||
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
      candidate.editAccess === 'key-required' ||
      candidate.editAccess === 'key-editable' ||
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
    if (input.errorCode === 'NOTE_EDIT_KEY_ACTION_INVALID') {
      return {
        tone: 'warning',
        state: 'default',
        title: '编辑密钥操作无效',
        description: input.errorMessage ?? '请确认这次保存是在设置密钥还是使用现有密钥后再试。'
      }
    }

    if (input.errorCode === 'NOTE_EDIT_KEY_REQUIRED') {
      return {
        tone: 'warning',
        state: 'default',
        title: '需要编辑密钥',
        description: input.errorMessage ?? '当前对象需要输入编辑密钥后才能保存更新。'
      }
    }

    if (input.errorCode === 'NOTE_EDIT_KEY_INVALID') {
      return {
        tone: 'danger',
        state: 'error',
        title: '编辑密钥不正确',
        description: input.errorMessage ?? '当前编辑密钥不正确，请确认后重试。'
      }
    }

    if (input.errorCode === 'NOTE_FORBIDDEN') {
      return {
        tone: 'warning',
        state: 'default',
        title: '当前账户只能查看',
        description: input.errorMessage ?? '该对象已绑定创建者，如需编辑请先使用创建者身份恢复登录。'
      }
    }

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

  if (input.viewStatus === 'available' && input.editAccess === 'key-required') {
    return {
      tone: 'warning',
      state: 'default',
      title: '需要编辑密钥',
      description: '当前对象可以正常查看，输入正确密钥后才能保存更新。'
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

  if (input.editAccess === 'key-editable') {
    return {
      label: '密钥已验证',
      tone: 'success' as const,
      caption: '当前会话已通过编辑密钥授权，可以继续保存更新。'
    }
  }

  if (input.editAccess === 'key-required') {
    return {
      label: '输入密钥后可编辑',
      tone: 'warning' as const,
      caption: '当前对象开启了共享编辑保护，输入正确密钥后才能保存更新。'
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
