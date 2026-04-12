import type { InteractionState } from '@note/shared-types'

import { isLocalNoteStorageError } from './storage/local-note-storage'

export type LocalNoteViewStatus = 'ready' | 'invalid-sid' | 'storage-unavailable'
export type LocalNoteSaveState = 'unsaved' | 'saving' | 'saved' | 'save-error'
export type LocalNoteRestorationState = 'idle' | 'restored' | 'empty' | 'restore-error'
export type LocalNoteObjectHeaderTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export interface LocalNoteViewModel {
  status: LocalNoteViewStatus
  sid: string | null
  title: string
  description: string
}

export interface LocalNoteFeedback {
  tone: 'info' | 'success' | 'warning' | 'danger'
  state: InteractionState
  title: string
  description: string
}

export interface LocalNoteObjectHeaderModel {
  sid: string
  saveStatusLabel: string
  saveStatusTone: LocalNoteObjectHeaderTone
  localStatusLabel: string
  localStatusTone: LocalNoteObjectHeaderTone
  localStatusDescription: string
  boundaryStatusLabel: string
  boundaryStatusTone: LocalNoteObjectHeaderTone
  boundaryStatusCaption: string
}

interface LocalNoteViewModelInput {
  sid: string | null
  storageAvailable: boolean
}

interface LocalNoteFeedbackInput {
  viewStatus: LocalNoteViewStatus
  saveState: LocalNoteSaveState
  hasUnsavedChanges: boolean
  restorationState: LocalNoteRestorationState
  saveErrorMessage?: string | null
  restoreErrorMessage?: string | null
}

interface LocalNoteObjectHeaderInput {
  sid: string | null
  viewStatus: LocalNoteViewStatus
  saveState: LocalNoteSaveState
  restorationState: LocalNoteRestorationState
  hasUnsavedChanges: boolean
}

function resolveSaveStatus(
  saveState: LocalNoteSaveState,
  hasUnsavedChanges: boolean
): { label: string; tone: LocalNoteObjectHeaderTone } {
  if (saveState === 'saving') {
    return {
      label: '保存中',
      tone: 'accent'
    }
  }

  if (hasUnsavedChanges) {
    return {
      label: '未保存到本地',
      tone: 'warning'
    }
  }

  if (saveState === 'saved') {
    return {
      label: '已保存在本地',
      tone: 'success'
    }
  }

  if (saveState === 'save-error') {
    return {
      label: '保存失败',
      tone: 'danger'
    }
  }

  return {
    label: '等待保存',
    tone: 'warning'
  }
}

export function resolveLocalNoteStorageMessage(
  error: unknown,
  operation: 'read' | 'write' | 'access'
) {
  if (isLocalNoteStorageError(error)) {
    return error.message
  }

  if (operation === 'write') {
    return '保存当前本地便签失败，请检查浏览器本地存储权限或可用空间后重试。'
  }

  if (operation === 'read') {
    return '读取当前本地便签失败，请检查浏览器本地存储权限后重试。'
  }

  return '当前浏览器环境不支持本地便签存储，无法在此模式下保存或恢复内容。'
}

export function resolveLocalNoteViewModel(
  input: LocalNoteViewModelInput
): LocalNoteViewModel {
  if (!input.sid) {
    return {
      status: 'invalid-sid',
      sid: null,
      title: '当前链接缺少有效 sid',
      description: '路由参数必须是单个非空字符串，本地模式不会把空值或异常参数默默转成伪造对象。'
    }
  }

  if (!input.storageAvailable) {
    return {
      status: 'storage-unavailable',
      sid: input.sid,
      title: '当前浏览器不支持本地便签',
      description: '本地模式依赖浏览器本地存储。当前环境无法提供这项能力，因此不会进入伪造的临时内存模式。'
    }
  }

  return {
    status: 'ready',
    sid: input.sid,
    title: '本地便签内容',
    description: '当前正文只保存在这个浏览器的本地存储中，不会进入在线分享对象或远端数据库。'
  }
}

export function resolveLocalNoteFeedback(
  input: LocalNoteFeedbackInput
): LocalNoteFeedback | null {
  if (input.viewStatus === 'storage-unavailable') {
    return {
      tone: 'danger',
      state: 'error',
      title: '无法使用本地便签',
      description:
        input.restoreErrorMessage ??
        '当前浏览器环境不支持本地便签存储，无法在此模式下保存或恢复内容。'
    }
  }

  if (input.saveState === 'saving') {
    return {
      tone: 'info',
      state: 'focus',
      title: '正在保存到本地',
      description: '我们正在把当前正文写入这个浏览器里的本地便签存储。'
    }
  }

  if (input.saveState === 'save-error') {
    return {
      tone: 'danger',
      state: 'error',
      title: '保存到本地失败',
      description:
        input.saveErrorMessage ??
        '保存当前本地便签失败，请检查浏览器本地存储权限或可用空间后重试。'
    }
  }

  if (input.restorationState === 'restore-error') {
    return {
      tone: 'danger',
      state: 'error',
      title: '恢复本地内容失败',
      description:
        input.restoreErrorMessage ??
        '当前 sid 的本地内容无法读取。你可以继续编辑，并在保存后覆盖这份损坏的数据。'
    }
  }

  if (input.hasUnsavedChanges) {
    return {
      tone: 'warning',
      state: 'default',
      title: '未保存到本地',
      description: '你已经修改了当前正文，点击“保存到本地”后才会写入这个浏览器。'
    }
  }

  if (input.saveState === 'saved') {
    return {
      tone: 'success',
      state: 'default',
      title: '已保存到本地',
      description: '这次修改已经写入当前浏览器的本地便签存储。'
    }
  }

  if (input.restorationState === 'restored') {
    return {
      tone: 'info',
      state: 'default',
      title: '已恢复本地内容',
      description: '我们已经按当前 sid 恢复这台设备上最近一次成功保存的本地正文。'
    }
  }

  if (input.restorationState === 'empty') {
    return {
      tone: 'info',
      state: 'default',
      title: '当前 sid 还没有本地内容',
      description: '你可以直接开始输入，并在准备好后显式保存到本地。'
    }
  }

  return null
}

export function resolveLocalNoteObjectHeader(
  input: LocalNoteObjectHeaderInput
): LocalNoteObjectHeaderModel | null {
  if (!input.sid || input.viewStatus !== 'ready') {
    return null
  }

  const saveStatus = resolveSaveStatus(input.saveState, input.hasUnsavedChanges)

  if (input.restorationState === 'restored') {
    return {
      sid: input.sid,
      saveStatusLabel: saveStatus.label,
      saveStatusTone: saveStatus.tone,
      localStatusLabel: '已恢复本地内容',
      localStatusTone: 'success',
      localStatusDescription: '当前正文来自这个浏览器里按 sid 保存的本地记录，你可以继续修改并再次保存。',
      boundaryStatusLabel: '不会同步到在线',
      boundaryStatusTone: 'accent',
      boundaryStatusCaption: '不可直接分享'
    }
  }

  if (input.restorationState === 'restore-error') {
    return {
      sid: input.sid,
      saveStatusLabel: saveStatus.label,
      saveStatusTone: saveStatus.tone,
      localStatusLabel: '本地内容读取失败',
      localStatusTone: 'danger',
      localStatusDescription: '当前 sid 的本地数据可能损坏了。你仍然可以继续编辑，并在保存后覆盖它。',
      boundaryStatusLabel: '不会同步到在线',
      boundaryStatusTone: 'accent',
      boundaryStatusCaption: '不可直接分享'
    }
  }

  return {
    sid: input.sid,
    saveStatusLabel: saveStatus.label,
    saveStatusTone: saveStatus.tone,
    localStatusLabel: '尚无本地内容',
    localStatusTone: 'warning',
    localStatusDescription: '这个 sid 在当前浏览器里还没有保存过本地正文。首次保存后，后续可按同一 sid 恢复。',
    boundaryStatusLabel: '不会同步到在线',
    boundaryStatusTone: 'accent',
    boundaryStatusCaption: '不可直接分享'
  }
}
