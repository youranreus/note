// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import {
  resolveOnlineNoteObjectHeader,
  resolveOnlineNoteViewModel,
  type OnlineNoteObjectHeaderModel,
  type OnlineNoteSaveFeedback,
  type OnlineNoteSaveState,
  type OnlineNoteViewModel
} from '../src/features/note/online-note'
import OnlineNoteShell from '../src/features/note/components/OnlineNoteShell.vue'

const mockedViewModel = vi.hoisted(
  (): {
    value: OnlineNoteViewModel
  } => ({
    value: {
      status: 'loading',
      sid: 'note123abc4',
      content: null,
      title: '正在读取在线便签',
      description: '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。'
    }
  })
)

const mockedDraftContent = vi.hoisted(() => ({ value: '' }))
const mockedSaveState = vi.hoisted((): { value: OnlineNoteSaveState } => ({ value: 'unsaved' }))
const mockedSaveFeedback = vi.hoisted((): { value: OnlineNoteSaveFeedback | null } => ({ value: null }))
const mockedObjectHeader = vi.hoisted(
  (): {
    value: OnlineNoteObjectHeaderModel | null
  } => ({
    value: null
  })
)
const mockedSaveNote = vi.hoisted(() => vi.fn(async () => undefined))
const mockedCopyShareLink = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('../src/features/note/use-online-note', async () => {
  return {
    useOnlineNote: () => ({
      viewModel: computed(() => mockedViewModel.value),
      draftContent: computed({
        get: () => mockedDraftContent.value,
        set: (value: string) => {
          mockedDraftContent.value = value
        }
      }),
      saveState: computed(() => mockedSaveState.value),
      saveFeedback: computed(() => mockedSaveFeedback.value),
      primaryFeedback: computed(() => mockedSaveFeedback.value),
      objectHeader: computed(() => mockedObjectHeader.value),
      saveNote: mockedSaveNote,
      copyShareLink: mockedCopyShareLink
    })
  }
})

function createViewModel(overrides: Partial<OnlineNoteViewModel>): OnlineNoteViewModel {
  return {
    status: 'loading',
    sid: 'note123abc4',
    content: null,
    title: '正在读取在线便签',
    description: '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。',
    ...overrides
  }
}

function mountShell() {
  return mount(OnlineNoteShell, {
    props: {
      sid: mockedViewModel.value.sid
    }
  })
}

describe('online note shell', () => {
  it('renders a clear loading state while the note detail is being fetched', () => {
    mockedViewModel.value = createViewModel({
      status: 'loading'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = null
    mockedObjectHeader.value = null

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('正在读取在线便签')
    expect(wrapper.text()).toContain('note123abc4')
  })

  it('turns not-found into an editable first-save state', () => {
    mockedViewModel.value = createViewModel({
      status: 'not-found',
      title: '这个 sid 还没有保存内容',
      description: '你可以直接开始输入正文，并在当前固定链接下首次保存。'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = {
      tone: 'warning',
      state: 'default',
      title: '尚未保存',
      description: '当前 sid 还没有远端对象，点击保存后会创建第一版内容。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '尚未保存',
      saveStatusTone: 'warning',
      shareStatusLabel: '保存后可分享',
      shareStatusTone: 'warning',
      shareStatusDescription: '先完成首次保存，当前 sid 才会成为可直接分享的稳定对象链接。',
      editStatusLabel: '当前可继续编辑',
      editStatusTone: 'accent',
      editStatusCaption: '权限模型待 Epic 2 接入',
      canCopyShareLink: false,
      copyButtonLabel: '复制链接',
      copyButtonState: 'disabled'
    }

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('这个 sid 还没有保存内容')
    expect(wrapper.text()).toContain('尚未保存')
    expect(wrapper.text()).toContain('保存后可分享')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('首次保存')
    expect(wrapper.find('button[disabled]').exists()).toBe(true)
  })

  it('renders the loaded content inside an editable area for existing notes', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已经存在，可以继续编辑并保存更新。',
      content: '这是最新已保存内容。'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = {
      tone: 'success',
      state: 'default',
      title: '已保存',
      description: '最新修改已经写回当前 sid。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '当前可继续编辑',
      editStatusTone: 'accent',
      editStatusCaption: '权限模型待 Epic 2 接入',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()
    const textarea = wrapper.find('textarea')

    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('这是最新已保存内容。')
    expect(wrapper.text()).toContain('保存更新')
    expect(wrapper.text()).toContain('已保存')
    expect(wrapper.text()).toContain('可分享')
    expect(wrapper.text()).toContain('当前可继续编辑')
    expect(wrapper.text()).toContain('复制链接')
  })

  it('shows a saving indicator while the save request is in flight', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      content: '草稿内容。'
    })
    mockedDraftContent.value = '草稿内容。'
    mockedSaveState.value = 'saving'
    mockedSaveFeedback.value = {
      tone: 'info',
      state: 'focus',
      title: '保存中',
      description: '正在将当前正文写入该 sid 对应的在线便签。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '保存中',
      saveStatusTone: 'accent',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '当前可继续编辑',
      editStatusTone: 'accent',
      editStatusCaption: '权限模型待 Epic 2 接入',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()
    const buttons = wrapper.findAll('button')
    const saveButton = buttons.find((button) => button.text().includes('保存更新'))

    expect(wrapper.text()).toContain('保存中')
    expect(wrapper.find('button[disabled]').exists()).toBe(true)
    expect(saveButton?.attributes('disabled')).toBeDefined()
  })

  it('shows a clear failure message while preserving the local draft after save errors', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      content: '旧内容。'
    })
    mockedDraftContent.value = '用户尚未保存的新草稿。'
    mockedSaveState.value = 'save-error'
    mockedSaveFeedback.value = {
      tone: 'danger',
      state: 'error',
      title: '保存失败',
      description: '服务端拒绝了当前写入，请稍后重试。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '保存失败',
      saveStatusTone: 'danger',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '当前可继续编辑',
      editStatusTone: 'accent',
      editStatusCaption: '权限模型待 Epic 2 接入',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()
    const textarea = wrapper.find('textarea')

    expect(wrapper.text()).toContain('保存失败')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('用户尚未保存的新草稿。')
  })

  it('keeps deleted notes in a non-editable error state', () => {
    mockedViewModel.value = createViewModel({
      status: 'deleted',
      title: '该在线便签已删除',
      description: '该在线便签已删除，当前链接不可继续读取。'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = null
    mockedObjectHeader.value = null

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('该在线便签已删除')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('首次保存')
    expect(wrapper.text()).not.toContain('复制链接')
  })

  it('calls the share action when the copy button is triggered from the object header', async () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已经存在，可以继续编辑并保存更新。',
      content: '这是最新已保存内容。'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = {
      tone: 'success',
      state: 'default',
      title: '已复制当前在线便签链接',
      description: '你可以把这个稳定链接直接发给别人。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '当前可继续编辑',
      editStatusTone: 'accent',
      editStatusCaption: '权限模型待 Epic 2 接入',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()
    const buttons = wrapper.findAll('button')
    const copyButton = buttons.find((button) => button.text().includes('复制链接'))

    expect(copyButton).toBeDefined()

    await copyButton!.trigger('click')

    expect(mockedCopyShareLink).toHaveBeenCalledTimes(1)
  })
})

describe('resolveOnlineNoteViewModel', () => {
  it('falls back to an error state when a 200 payload is not a valid note detail dto', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: 'shell-status',
      loading: false,
      note: {
        module: 'notes',
        scope: 'notes module shell is reserved for future stories.'
      }
    })

    expect(viewModel).toMatchObject({
      status: 'error',
      sid: 'shell-status',
      title: '读取在线便签失败'
    })
    expect(viewModel.description).toContain('无法识别的响应格式')
  })

  it('marks a missing sid as creatable not-found state instead of a terminal error', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: 'fresh123',
      loading: false,
      error: {
        response: {
          data: {
            sid: 'fresh123',
            code: 'NOTE_NOT_FOUND',
            status: 'not-found',
            message: '未找到与当前 sid 对应的在线便签。'
          }
        }
      }
    })

    expect(viewModel).toMatchObject({
      status: 'not-found',
      sid: 'fresh123'
    })
    expect(viewModel.description).toContain('首次保存')
  })
})

describe('resolveOnlineNoteObjectHeader', () => {
  it('keeps existing notes shareable in the header while a save is in flight', () => {
    const header = resolveOnlineNoteObjectHeader({
      sid: 'note123abc4',
      viewStatus: 'available',
      saveState: 'saving'
    })

    expect(header).toMatchObject({
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      canCopyShareLink: false,
      copyButtonState: 'disabled'
    })
    expect(header?.shareStatusDescription).toContain('最近一次成功保存')
  })
})
