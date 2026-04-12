// @vitest-environment jsdom

import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  LocalNoteFeedback,
  LocalNoteObjectHeaderModel,
  LocalNoteSaveState,
  LocalNoteViewModel
} from '../src/features/local-note/local-note'
import TextInput from '../src/components/ui/TextInput.vue'
import LocalNoteShell from '../src/features/local-note/components/LocalNoteShell.vue'

const mockedRouter = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(async () => undefined)
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRouter: () => mockedRouter
  }
})

const mockedViewModel = vi.hoisted(
  (): { value: LocalNoteViewModel } => ({
    value: {
      status: 'ready',
      sid: 'local-note-1',
      title: '本地便签内容',
      description: '当前正文只保存在这个浏览器的本地存储中，不会进入在线分享对象或远端数据库。'
    }
  })
)
const mockedDraftContent = vi.hoisted(() => ({ value: '' }))
const mockedSaveState = vi.hoisted((): { value: LocalNoteSaveState } => ({ value: 'unsaved' }))
const mockedPrimaryFeedback = vi.hoisted(
  (): { value: LocalNoteFeedback | null } => ({
    value: null
  })
)
const mockedObjectHeader = vi.hoisted(
  (): { value: LocalNoteObjectHeaderModel | null } => ({
    value: null
  })
)
const mockedSaveNote = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('../src/features/local-note/use-local-note', async () => {
  return {
    useLocalNote: () => ({
      viewModel: computed(() => mockedViewModel.value),
      draftContent: computed({
        get: () => mockedDraftContent.value,
        set: (value: string) => {
          mockedDraftContent.value = value
        }
      }),
      saveState: computed(() => mockedSaveState.value),
      primaryFeedback: computed(() => mockedPrimaryFeedback.value),
      objectHeader: computed(() => mockedObjectHeader.value),
      saveNote: mockedSaveNote
    })
  }
})

function createViewModel(overrides: Partial<LocalNoteViewModel>): LocalNoteViewModel {
  return {
    status: 'ready',
    sid: 'local-note-1',
    title: '本地便签内容',
    description: '当前正文只保存在这个浏览器的本地存储中，不会进入在线分享对象或远端数据库。',
    ...overrides
  }
}

function mountShell() {
  return mount(LocalNoteShell, {
    props: {
      sid: mockedViewModel.value.sid
    }
  })
}

describe('local note shell', () => {
  beforeEach(() => {
    mockedSaveNote.mockReset()
    mockedRouter.back.mockReset()
    mockedRouter.push.mockReset()
  })

  it('renders an editable local-note shell with explicit local-only messaging', () => {
    mockedViewModel.value = createViewModel({})
    mockedDraftContent.value = '仅保存在本地的草稿'
    mockedSaveState.value = 'saved'
    mockedPrimaryFeedback.value = {
      tone: 'success',
      state: 'default',
      title: '已保存到本地',
      description: '这次修改已经写入当前浏览器的本地便签存储。'
    }
    mockedObjectHeader.value = {
      sid: 'local-note-1',
      saveStatusLabel: '已保存在本地',
      saveStatusTone: 'success',
      localStatusLabel: '已恢复本地内容',
      localStatusTone: 'success',
      localStatusDescription: '当前正文来自这个浏览器里按 sid 保存的本地记录，你可以继续修改并再次保存。',
      boundaryStatusLabel: '不会同步到在线',
      boundaryStatusTone: 'accent',
      boundaryStatusCaption: '不可直接分享'
    }

    const wrapper = mountShell()
    const textarea = wrapper.find('textarea')
    const textInput = wrapper.findComponent(TextInput)

    expect(wrapper.text()).toContain('本地模式')
    expect(wrapper.text()).toContain('不会同步到在线')
    expect(wrapper.text()).toContain('当前正文来自这个浏览器里按 sid 保存的本地记录')
    expect(wrapper.text()).toContain('保存到本地')
    expect(textInput.props('state')).toBe('default')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('仅保存在本地的草稿')
  })

  it('returns to the previous page from the local note header', async () => {
    window.history.pushState({}, '', '/from-home')
    mockedViewModel.value = createViewModel({})
    mockedDraftContent.value = '仅保存在本地的草稿'
    mockedSaveState.value = 'saved'
    mockedPrimaryFeedback.value = null
    mockedObjectHeader.value = {
      sid: 'local-note-1',
      saveStatusLabel: '已保存在本地',
      saveStatusTone: 'success',
      localStatusLabel: '已恢复本地内容',
      localStatusTone: 'success',
      localStatusDescription: '当前正文来自这个浏览器里按 sid 保存的本地记录，你可以继续修改并再次保存。',
      boundaryStatusLabel: '不会同步到在线',
      boundaryStatusTone: 'accent',
      boundaryStatusCaption: '不可直接分享'
    }

    const wrapper = mountShell()

    await wrapper.get('[data-testid="note-back-button"]').trigger('click')

    expect(mockedRouter.back).toHaveBeenCalledTimes(1)
    expect(mockedRouter.push).not.toHaveBeenCalled()
  })

  it('shows a clear invalid-sid state without rendering the editor', () => {
    mockedViewModel.value = createViewModel({
      status: 'invalid-sid',
      sid: null,
      title: '当前链接缺少有效 sid',
      description: '路由参数必须是单个非空字符串，本地模式不会把空值或异常参数默默转成伪造对象。'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedPrimaryFeedback.value = null
    mockedObjectHeader.value = null

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('当前链接缺少有效 sid')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('保存到本地')
  })

  it('shows a storage-unavailable message instead of falling back to a fake local editor', () => {
    mockedViewModel.value = createViewModel({
      status: 'storage-unavailable',
      title: '当前浏览器不支持本地便签',
      description: '本地模式依赖浏览器本地存储。当前环境无法提供这项能力，因此不会进入伪造的临时内存模式。'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedPrimaryFeedback.value = {
      tone: 'danger',
      state: 'error',
      title: '无法使用本地便签',
      description: '当前浏览器环境不支持本地便签存储，无法在此模式下保存或恢复内容。'
    }
    mockedObjectHeader.value = null

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('无法使用本地便签')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('保存到本地')
  })

  it('disables the editor and save button while local persistence is running', () => {
    mockedViewModel.value = createViewModel({})
    mockedDraftContent.value = '准备保存的本地正文'
    mockedSaveState.value = 'saving'
    mockedPrimaryFeedback.value = {
      tone: 'info',
      state: 'focus',
      title: '正在保存到本地',
      description: '我们正在把当前正文写入这个浏览器里的本地便签存储。'
    }
    mockedObjectHeader.value = {
      sid: 'local-note-1',
      saveStatusLabel: '保存中',
      saveStatusTone: 'accent',
      localStatusLabel: '尚无本地内容',
      localStatusTone: 'warning',
      localStatusDescription: '这个 sid 在当前浏览器里还没有保存过本地正文。首次保存后，后续可按同一 sid 恢复。',
      boundaryStatusLabel: '不会同步到在线',
      boundaryStatusTone: 'accent',
      boundaryStatusCaption: '不可直接分享'
    }

    const wrapper = mountShell()
    const buttons = wrapper.findAll('button')
    const button = buttons.find((candidate) => candidate.text().includes('保存'))
    const textarea = wrapper.find('textarea')
    const textInput = wrapper.findComponent(TextInput)

    expect(button?.attributes('disabled')).toBeDefined()
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(textInput.props('state')).toBe('disabled')
  })

  it('keeps the shell lightweight in normal states but still surfaces explicit save errors', () => {
    mockedViewModel.value = createViewModel({})
    mockedDraftContent.value = '保存失败后的本地正文'
    mockedSaveState.value = 'save-error'
    mockedPrimaryFeedback.value = {
      tone: 'danger',
      state: 'error',
      title: '保存到本地失败',
      description: '请检查浏览器本地存储权限或可用空间后重试。'
    }
    mockedObjectHeader.value = {
      sid: 'local-note-1',
      saveStatusLabel: '保存失败',
      saveStatusTone: 'danger',
      localStatusLabel: '已恢复本地内容',
      localStatusTone: 'success',
      localStatusDescription: '当前正文来自这个浏览器里按 sid 保存的本地记录，你可以继续修改并再次保存。',
      boundaryStatusLabel: '不会同步到在线',
      boundaryStatusTone: 'accent',
      boundaryStatusCaption: '不可直接分享'
    }

    const wrapper = mountShell()
    const textInput = wrapper.findComponent(TextInput)

    expect(wrapper.text()).toContain('保存到本地失败')
    expect(wrapper.text()).toContain('请检查浏览器本地存储权限或可用空间后重试。')
    expect(textInput.props('state')).toBe('error')
  })
})
