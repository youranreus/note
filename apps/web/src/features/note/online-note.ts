import type { AxiosError } from 'axios'

import type {
  AuthStatus,
  FavoriteErrorDto,
  FavoriteResponseDto,
  InteractionState,
  NoteDeleteErrorCode,
  NoteDeleteErrorDto,
  NoteEditAccess,
  NoteReadErrorDto,
  NoteReadViewStatus,
  NoteWriteErrorCode,
  NoteWriteErrorDto,
  OnlineNoteDeleteResponseDto,
  OnlineNoteDetailDto,
  OnlineNoteFavoriteState,
  OnlineNoteSaveResponseDto
} from '@note/shared-types'

import {
  createPoliteInlineFeedback,
  type InlineFeedbackModel
} from '@/components/ui/inline-feedback'

export type OnlineNoteSaveState = 'unsaved' | 'saving' | 'saved' | 'save-error'
export type OnlineNoteObjectHeaderTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export interface OnlineNoteViewModel {
  status: NoteReadViewStatus
  sid: string | null
  content: string | null
  editAccess: NoteEditAccess | null
  favoriteState: OnlineNoteFavoriteState | null
  title: string
  description: string
}

export interface OnlineNoteStateSnapshot {
  sid: string | null
  loading: boolean
  note?: unknown
  error?: unknown
}

export interface OnlineNoteSaveFeedback extends InlineFeedbackModel {
  describedField?: 'editKey'
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
  showFavoriteButton?: boolean
  favoriteButtonLabel?: string
  favoriteButtonState?: InteractionState
  showDeleteButton?: boolean
  deleteButtonLabel?: string
  deleteButtonState?: InteractionState
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
  errorCode?: NoteWriteErrorCode | null
  errorMessage?: string | null
}

interface OnlineNoteObjectHeaderInput {
  sid: string | null
  viewStatus: NoteReadViewStatus
  editAccess: NoteEditAccess | null
  favoriteState?: OnlineNoteFavoriteState | null
  authStatus?: AuthStatus
  saveState: OnlineNoteSaveState
  favoriteActionState?: InteractionState
  deleteActionState?: InteractionState
}

interface OnlineNoteAuthorizationUiInput {
  viewStatus: NoteReadViewStatus
  editAccess: NoteEditAccess | null
  authStatus: AuthStatus
  hasEditKeyValue: boolean
}

function appendNextStep(message: string, nextStep: string) {
  const trimmedMessage = message.trim()
  const trimmedNextStep = nextStep.trim()

  if (!trimmedMessage) {
    return trimmedNextStep
  }

  if (trimmedMessage.includes(trimmedNextStep)) {
    return trimmedMessage
  }

  return `${trimmedMessage} ${trimmedNextStep}`
}

function createOnlineNoteFeedback(
  input: Omit<OnlineNoteSaveFeedback, 'role' | 'ariaLive' | 'ariaAtomic'>
): OnlineNoteSaveFeedback {
  const { describedField, ...feedback } = input

  return {
    ...createPoliteInlineFeedback(feedback),
    describedField
  }
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
  editAccess: NoteEditAccess | null = null,
  favoriteState: OnlineNoteFavoriteState | null = null
): OnlineNoteViewModel {
  return {
    status,
    sid,
    content,
    editAccess,
    favoriteState,
    title,
    description
  }
}

export function createDeletedOnlineNoteViewModel(
  sid: string,
  description: string
): OnlineNoteViewModel {
  return createViewModel(
    'deleted',
    sid,
    '该在线便签已删除',
    appendNextStep(
      description,
      '如需继续记录，请向分享者确认是否有新链接，或返回首页重新开始。'
    )
  )
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

export function canDeleteOnlineNote(editAccess: NoteEditAccess | null) {
  return (
    editAccess === 'anonymous-editable' ||
    editAccess === 'owner-editable' ||
    editAccess === 'key-editable'
  )
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
    shellDescription = '当前链接曾关联在线便签，但该对象已经被删除且不可恢复。'
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
  } else if (input.viewStatus === 'deleted') {
    modeBadgeLabel = '已删除'
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
      candidate.editAccess === 'forbidden') &&
    (candidate.favoriteState == null ||
      candidate.favoriteState === 'not-favorited' ||
      candidate.favoriteState === 'favorited' ||
      candidate.favoriteState === 'self-owned')
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
    (candidate.favoriteState == null ||
      candidate.favoriteState === 'not-favorited' ||
      candidate.favoriteState === 'favorited' ||
      candidate.favoriteState === 'self-owned') &&
    (candidate.saveResult === 'created' || candidate.saveResult === 'updated')
  )
}

export function isFavoriteResponseDto(value: unknown): value is FavoriteResponseDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<FavoriteResponseDto>

  return typeof candidate.sid === 'string' && candidate.favoriteState === 'favorited'
}

export function isOnlineNoteDeleteResponseDto(value: unknown): value is OnlineNoteDeleteResponseDto {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<OnlineNoteDeleteResponseDto>

  return (
    typeof candidate.sid === 'string' &&
    candidate.status === 'deleted' &&
    typeof candidate.message === 'string'
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

export function resolveFavoriteErrorDto(error: unknown) {
  const responseData = (error as AxiosError<unknown> | undefined)?.response?.data as Partial<FavoriteErrorDto> | undefined

  if (
    responseData &&
    typeof responseData.sid === 'string' &&
    typeof responseData.code === 'string' &&
    typeof responseData.status === 'string' &&
    typeof responseData.message === 'string'
  ) {
    return responseData as FavoriteErrorDto
  }

  return null
}

export function resolveNoteDeleteErrorDto(error: unknown) {
  const responseData = (error as AxiosError<unknown> | undefined)?.response?.data

  if (
    responseData &&
    typeof responseData === 'object' &&
    typeof (responseData as Partial<NoteDeleteErrorDto>).sid === 'string' &&
    typeof (responseData as Partial<NoteDeleteErrorDto>).code === 'string' &&
    typeof (responseData as Partial<NoteDeleteErrorDto>).status === 'string' &&
    typeof (responseData as Partial<NoteDeleteErrorDto>).message === 'string'
  ) {
    return responseData as NoteDeleteErrorDto
  }

  return null
}

export function resolveOnlineNoteViewModel(snapshot: OnlineNoteStateSnapshot): OnlineNoteViewModel {
  if (!snapshot.sid) {
    return createViewModel(
      'invalid-sid',
      null,
      '当前链接缺少有效 sid',
      '路由参数必须是单个非空字符串。请检查链接是否完整，或返回首页重新打开目标便签。'
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
    return createDeletedOnlineNoteViewModel(snapshot.sid, noteReadError.message)
  }

  if (isOnlineNoteDetailDto(snapshot.note) && snapshot.note.sid === snapshot.sid) {
    return createViewModel(
      'available',
      snapshot.note.sid,
      '在线便签内容',
      createAvailableDescription(snapshot.note.editAccess),
      snapshot.note.content,
      snapshot.note.editAccess,
      snapshot.note.favoriteState ?? 'not-favorited'
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
      '读取当前在线对象时发生异常。请刷新页面后重试；如果问题持续，请返回首页重新打开目标便签。'
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
    return createOnlineNoteFeedback({
      tone: 'info',
      state: 'focus',
      title: '保存中',
      description: '正在将当前正文写入该 sid 对应的在线便签，请稍候。'
    })
  }

  if (input.saveState === 'save-error') {
    if (input.errorCode === 'NOTE_EDIT_KEY_ACTION_INVALID') {
      return createOnlineNoteFeedback({
        tone: 'warning',
        state: 'default',
        title: '编辑密钥操作无效',
        description:
          input.errorMessage ??
          '请确认这次保存是在设置新密钥还是使用现有密钥，然后重新保存。'
      })
    }

    if (input.errorCode === 'NOTE_EDIT_KEY_REQUIRED') {
      return createOnlineNoteFeedback({
        tone: 'warning',
        state: 'default',
        title: '需要编辑密钥',
        description:
          input.errorMessage ??
          '当前对象需要输入正确的编辑密钥后才能保存更新。请在下方输入密钥后再试。',
        describedField: 'editKey'
      })
    }

    if (input.errorCode === 'NOTE_EDIT_KEY_INVALID') {
      return createOnlineNoteFeedback({
        tone: 'danger',
        state: 'error',
        title: '编辑密钥不正确',
        description:
          input.errorMessage ?? '当前编辑密钥不正确。请检查输入是否有误，然后重新保存。',
        describedField: 'editKey'
      })
    }

    if (input.errorCode === 'NOTE_FORBIDDEN') {
      return createOnlineNoteFeedback({
        tone: 'warning',
        state: 'default',
        title: '当前账户只能查看',
        description:
          input.errorMessage ??
          '该对象已绑定创建者。请切换到创建者身份重新登录后，再继续保存更新。'
      })
    }

    return createOnlineNoteFeedback({
      tone: 'danger',
      state: 'error',
      title: '保存失败',
      description:
        input.errorMessage ?? '保存当前在线对象时发生异常。请稍后重试；如有需要可先复制正文避免丢失。'
    })
  }

  if (input.viewStatus === 'available' && input.editAccess === 'forbidden') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '当前账户只能查看',
      description: '该对象已绑定创建者。请切换到创建者身份重新登录后，再继续保存更新。'
    })
  }

  if (input.viewStatus === 'available' && input.editAccess === 'key-required') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '需要编辑密钥',
      description: '当前对象可以正常查看，输入正确密钥后才能保存更新。请在下方输入密钥后再试。',
      describedField: 'editKey'
    })
  }

  if (input.saveState === 'saved') {
    return createOnlineNoteFeedback({
      tone: 'success',
      state: 'default',
      title: '已保存',
      description: '最新修改已经写回当前 sid。'
    })
  }

  if (input.viewStatus === 'not-found') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '尚未保存',
      description: '当前 sid 还没有远端对象，点击保存后会创建第一版内容。'
    })
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

function resolveFavoriteAction(input: OnlineNoteObjectHeaderInput) {
  if (input.viewStatus !== 'available') {
    return {
      showFavoriteButton: false,
      favoriteButtonLabel: '',
      favoriteButtonState: 'disabled' as InteractionState
    }
  }

  if (input.favoriteState === 'self-owned') {
    return {
      showFavoriteButton: false,
      favoriteButtonLabel: '',
      favoriteButtonState: 'disabled' as InteractionState
    }
  }

  if (input.favoriteState === 'favorited') {
    return {
      showFavoriteButton: true,
      favoriteButtonLabel: '已收藏',
      favoriteButtonState: 'disabled' as InteractionState
    }
  }

  return {
    showFavoriteButton: true,
    favoriteButtonLabel: (input.authStatus ?? 'anonymous') === 'anonymous' ? '登录后收藏' : '收藏',
    favoriteButtonState: input.favoriteActionState ?? 'default'
  }
}

function resolveDeleteAction(input: OnlineNoteObjectHeaderInput) {
  if (input.viewStatus !== 'available' || !canDeleteOnlineNote(input.editAccess)) {
    return {
      showDeleteButton: false,
      deleteButtonLabel: '',
      deleteButtonState: 'disabled' as InteractionState
    }
  }

  return {
    showDeleteButton: true,
    deleteButtonLabel: '删除便签',
    deleteButtonState: input.deleteActionState ?? 'default'
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
  const favoriteAction = resolveFavoriteAction(input)
  const deleteAction = resolveDeleteAction(input)

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
    copyButtonState: canCopyShareLink ? 'default' : 'disabled',
    showFavoriteButton: favoriteAction.showFavoriteButton,
    favoriteButtonLabel: favoriteAction.favoriteButtonLabel,
    favoriteButtonState: favoriteAction.favoriteButtonState,
    showDeleteButton: deleteAction.showDeleteButton,
    deleteButtonLabel: deleteAction.deleteButtonLabel,
    deleteButtonState: deleteAction.deleteButtonState
  }
}

export function createOnlineNoteCopySuccessFeedback(): OnlineNoteSaveFeedback {
  return createOnlineNoteFeedback({
    tone: 'success',
    state: 'default',
    title: '已复制当前在线便签链接',
    description: '你可以把这个稳定链接直接发给别人。'
  })
}

export function createOnlineNoteCopyFailureFeedback(
  description = '当前浏览器无法复制链接，请手动复制地址栏中的链接后重试。'
): OnlineNoteSaveFeedback {
  return createOnlineNoteFeedback({
    tone: 'danger',
    state: 'error',
    title: '复制当前在线便签链接失败',
    description
  })
}

export function createOnlineNoteFavoriteSuccessFeedback(): OnlineNoteSaveFeedback {
  return createOnlineNoteFeedback({
    tone: 'success',
    state: 'default',
    title: '已收藏当前在线便签',
    description: '这条内容已经进入你的收藏资产，后续可从“我的收藏”继续回访。'
  })
}

export function resolveOnlineNoteFavoriteFeedback(error: unknown): OnlineNoteSaveFeedback {
  const favoriteError = resolveFavoriteErrorDto(error)

  if (favoriteError?.code === 'FAVORITE_SELF_OWNED_NOT_ALLOWED') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '自己的便签无需收藏',
      description: favoriteError.message ?? '这条便签已经属于你的创建资产，无需重复收藏。你可以在“我的创建”继续回访。'
    })
  }

  if (favoriteError?.code === 'FAVORITE_NOTE_NOT_FOUND') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '未找到可收藏的便签',
      description:
        favoriteError.message ?? '未找到可收藏的在线便签。请检查 sid 是否正确，或刷新页面后重试。'
    })
  }

  if (favoriteError?.code === 'FAVORITE_NOTE_DELETED') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '这条便签已删除',
      description:
        favoriteError.message ?? '这条在线便签已删除，当前无法加入收藏。请向分享者确认是否有新的可访问链接。'
    })
  }

  return createOnlineNoteFeedback({
    tone: favoriteError?.status === 'forbidden' ? 'warning' : 'danger',
    state: favoriteError?.status === 'forbidden' ? 'default' : 'error',
    title: '收藏失败',
    description: favoriteError?.message ?? '当前在线便签暂时无法加入收藏。请稍后重试。'
  })
}

export function resolveOnlineNoteDeleteFeedback(
  errorCode?: NoteDeleteErrorCode | null,
  errorMessage?: string | null
): OnlineNoteSaveFeedback {
  if (errorCode === 'INVALID_SID') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '当前链接缺少有效 sid',
      description:
        errorMessage ?? '当前链接中的 sid 无效。请检查链接是否完整，确认当前页面对应的是有效在线便签。'
    })
  }

  if (errorCode === 'NOTE_EDIT_KEY_REQUIRED') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '删除前需要编辑密钥',
      description: errorMessage ?? '删除前需要输入编辑密钥。请先在当前页面输入正确密钥后再试。',
      describedField: 'editKey'
    })
  }

  if (errorCode === 'NOTE_EDIT_KEY_INVALID') {
    return createOnlineNoteFeedback({
      tone: 'danger',
      state: 'error',
      title: '编辑密钥不正确',
      description: errorMessage ?? '当前编辑密钥不正确。请检查输入后重新尝试删除。',
      describedField: 'editKey'
    })
  }

  if (errorCode === 'NOTE_FORBIDDEN') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '当前账户不能删除',
      description:
        errorMessage ?? '当前账户没有删除该在线便签的权限。请切换到创建者身份重新登录后再试。'
    })
  }

  if (errorCode === 'NOTE_NOT_FOUND') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '这条在线便签不存在',
      description:
        errorMessage ?? '未找到与当前 sid 对应的在线便签。请检查链接是否正确，或向分享者确认是否已变更。'
    })
  }

  if (errorCode === 'NOTE_DELETED') {
    return createOnlineNoteFeedback({
      tone: 'warning',
      state: 'default',
      title: '该在线便签已删除',
      description:
        errorMessage ?? '这条在线便签已经被删除，当前链接无法再次删除。请返回首页重新开始，或向分享者确认是否有新链接。'
    })
  }

  if (errorCode === 'NOTE_SID_CONFLICT') {
    return createOnlineNoteFeedback({
      tone: 'danger',
      state: 'error',
      title: '当前在线便签出现 sid 冲突',
      description:
        errorMessage ?? '当前 sid 命中了多条记录，系统无法确认要删除的唯一对象。请稍后重试；如果持续出现，请联系管理员。'
    })
  }

  return createOnlineNoteFeedback({
    tone: 'danger',
    state: 'error',
    title: '删除当前在线便签失败',
    description: errorMessage ?? '删除当前在线便签时发生异常。请稍后重试。'
  })
}
