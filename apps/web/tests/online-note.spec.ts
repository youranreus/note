// @vitest-environment jsdom

import { computed, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import {
  resolveOnlineNoteAuthorizationUiModel,
  resolveOnlineNoteObjectHeader,
  resolveOnlineNoteViewModel,
  type OnlineNoteObjectHeaderModel,
  type OnlineNoteSaveFeedback,
  type OnlineNoteSaveState,
  type OnlineNoteViewModel
} from '../src/features/note/online-note'
import OnlineNoteShell from '../src/features/note/components/OnlineNoteShell.vue'
import { useAuthStore } from '../src/stores/auth-store'

const mockedViewModel = vi.hoisted(
  (): {
    value: OnlineNoteViewModel
  } => ({
    value: {
      status: 'loading',
      sid: 'note123abc4',
      content: null,
      editAccess: null,
      favoriteState: null,
      title: '正在读取在线便签',
      description: '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。'
    }
  })
)

const mockedDraftContent = vi.hoisted(() => ({ value: '' }))
const mockedEditKey = vi.hoisted(() => ({ value: '' }))
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
const mockedFavoriteNote = vi.hoisted(() => vi.fn(async () => undefined))
const mockedDeleteConfirmOpen = vi.hoisted(() => {
  let boundState: { value: boolean } | null = null

  return {
    bind(state: { value: boolean }) {
      boundState = state
    },
    set(value: boolean) {
      if (boundState) {
        boundState.value = value
      }
    }
  }
})
const mockedOpenDeleteConfirm = vi.hoisted(
  () =>
    vi.fn(() => {
      mockedDeleteConfirmOpen.set(true)
    })
)
const mockedCloseDeleteConfirm = vi.hoisted(
  () =>
    vi.fn(() => {
      mockedDeleteConfirmOpen.set(false)
    })
)
const mockedConfirmDelete = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('../src/features/note/use-online-note', async () => {
  const { ref } = await import('vue')
  const isDeleteConfirmOpen = ref(false)
  mockedDeleteConfirmOpen.bind(isDeleteConfirmOpen)

  return {
    useOnlineNote: () => ({
      viewModel: computed(() => mockedViewModel.value),
      draftContent: computed({
        get: () => mockedDraftContent.value,
        set: (value: string) => {
          mockedDraftContent.value = value
        }
      }),
      editKey: computed({
        get: () => mockedEditKey.value,
        set: (value: string) => {
          mockedEditKey.value = value
        }
      }),
      saveState: computed(() => mockedSaveState.value),
      saveFeedback: computed(() => mockedSaveFeedback.value),
      primaryFeedback: computed(() => mockedSaveFeedback.value),
      objectHeader: computed(() => mockedObjectHeader.value),
      saveNote: mockedSaveNote,
      copyShareLink: mockedCopyShareLink,
      favoriteNote: mockedFavoriteNote,
      isDeleteConfirmOpen,
      openDeleteConfirm: mockedOpenDeleteConfirm,
      closeDeleteConfirm: mockedCloseDeleteConfirm,
      confirmDelete: mockedConfirmDelete
    })
  }
})

function createViewModel(overrides: Partial<OnlineNoteViewModel>): OnlineNoteViewModel {
  return {
    status: 'loading',
    sid: 'note123abc4',
    content: null,
    editAccess: null,
    favoriteState: null,
    title: '正在读取在线便签',
    description: '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。',
    ...overrides
  }
}

function mountShell(
  authStatus: 'anonymous' | 'authenticated' = 'anonymous',
  options: { attachTo?: HTMLElement } = {}
) {
  const pinia = createPinia()
  const authStore = useAuthStore(pinia)

  if (authStatus === 'authenticated') {
    authStore.setAuthenticated({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Demo User'
      }
    })
  } else {
    authStore.setAnonymous()
  }

  return mount(OnlineNoteShell, {
    props: {
      sid: mockedViewModel.value.sid
    },
    attachTo: options.attachTo,
    global: {
      plugins: [pinia]
    }
  })
}

describe('online note shell', () => {
  it('renders a clear loading state while the note detail is being fetched', () => {
    mockedViewModel.value = createViewModel({
      status: 'loading'
    })
    mockedDraftContent.value = ''
    mockedEditKey.value = ''
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
    mockedEditKey.value = ''
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
      editStatusLabel: '首次保存后决定编辑身份',
      editStatusTone: 'warning',
      editStatusCaption: '已登录时会绑定创建者，未登录则保持匿名可编辑。',
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
      description: '当前对象已经存在，持有链接即可继续编辑并保存更新。',
      content: '这是最新已保存内容。',
      editAccess: 'anonymous-editable',
      favoriteState: 'not-favorited'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedEditKey.value = ''
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
      editStatusLabel: '匿名可编辑',
      editStatusTone: 'warning',
      editStatusCaption: '该对象尚未绑定创建者，持有链接即可继续修改。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default',
      showFavoriteButton: true,
      favoriteButtonLabel: '登录后收藏',
      favoriteButtonState: 'default'
    }

    const wrapper = mountShell()
    const textarea = wrapper.find('textarea')

    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('这是最新已保存内容。')
    expect(wrapper.text()).toContain('保存更新')
    expect(wrapper.text()).toContain('已保存')
    expect(wrapper.text()).toContain('可分享')
    expect(wrapper.text()).toContain('匿名可编辑')
    expect(wrapper.text()).toContain('复制链接')
    expect(wrapper.text()).toContain('登录后收藏')
  })

  it('opens the delete confirmation modal from the object header and moves focus into the dialog', async () => {
    mockedDeleteConfirmOpen.set(false)
    mockedOpenDeleteConfirm.mockClear()
    mockedCloseDeleteConfirm.mockClear()
    mockedConfirmDelete.mockClear()
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已经存在，持有链接即可继续编辑并保存更新。',
      content: '这是最新已保存内容。',
      editAccess: 'owner-editable',
      favoriteState: 'self-owned'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedEditKey.value = ''
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = null
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '创建者可管理',
      editStatusTone: 'success',
      editStatusCaption: '当前对象已绑定创建者身份，可继续保存或删除。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default',
      showDeleteButton: true,
      deleteButtonLabel: '删除便签',
      deleteButtonState: 'default'
    }

    const wrapper = mountShell('authenticated', {
      attachTo: document.body
    })
    const deleteButton = wrapper.get('[data-testid="note-delete-trigger"]')

    ;(deleteButton.element as HTMLButtonElement).focus()
    await deleteButton.trigger('click')
    await nextTick()
    await nextTick()

    const cancelButton = wrapper.get('[data-testid="delete-note-confirm-cancel"]')

    expect(mockedOpenDeleteConfirm).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('删除后不可恢复')
    expect(document.activeElement).toBe(cancelButton.element)
  })

  it('closes the delete confirmation modal on escape and restores focus to the trigger', async () => {
    mockedDeleteConfirmOpen.set(false)
    mockedOpenDeleteConfirm.mockClear()
    mockedCloseDeleteConfirm.mockClear()
    mockedConfirmDelete.mockClear()
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已经存在，持有链接即可继续编辑并保存更新。',
      content: '这是最新已保存内容。',
      editAccess: 'owner-editable',
      favoriteState: 'self-owned'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedEditKey.value = ''
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = null
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '创建者可管理',
      editStatusTone: 'success',
      editStatusCaption: '当前对象已绑定创建者身份，可继续保存或删除。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default',
      showDeleteButton: true,
      deleteButtonLabel: '删除便签',
      deleteButtonState: 'default'
    }

    const wrapper = mountShell('authenticated', {
      attachTo: document.body
    })
    const deleteButton = wrapper.get('[data-testid="note-delete-trigger"]')

    ;(deleteButton.element as HTMLButtonElement).focus()
    await deleteButton.trigger('click')
    await nextTick()
    await nextTick()

    await wrapper.get('[data-testid="delete-note-confirm-modal"]').trigger('keydown', {
      key: 'Escape'
    })
    await nextTick()
    await nextTick()

    expect(mockedCloseDeleteConfirm).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="delete-note-confirm-modal"]').exists()).toBe(false)
    expect(document.activeElement).toBe(deleteButton.element)
  })

  it('closes the delete confirmation modal when the overlay is clicked', async () => {
    mockedDeleteConfirmOpen.set(false)
    mockedOpenDeleteConfirm.mockClear()
    mockedCloseDeleteConfirm.mockClear()
    mockedConfirmDelete.mockClear()
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已经存在，持有链接即可继续编辑并保存更新。',
      content: '这是最新已保存内容。',
      editAccess: 'owner-editable',
      favoriteState: 'self-owned'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedEditKey.value = ''
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = null
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '创建者可管理',
      editStatusTone: 'success',
      editStatusCaption: '当前对象已绑定创建者身份，可继续保存或删除。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default',
      showDeleteButton: true,
      deleteButtonLabel: '删除便签',
      deleteButtonState: 'default'
    }

    const wrapper = mountShell('authenticated', {
      attachTo: document.body
    })
    const deleteButton = wrapper.get('[data-testid="note-delete-trigger"]')

    ;(deleteButton.element as HTMLButtonElement).focus()
    await deleteButton.trigger('click')
    await nextTick()
    await nextTick()

    await wrapper.get('[data-testid="modal-overlay"]').trigger('click')
    await nextTick()
    await nextTick()

    expect(mockedCloseDeleteConfirm).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="delete-note-confirm-modal"]').exists()).toBe(false)
    expect(document.activeElement).toBe(deleteButton.element)
  })

  it('shows an authenticated favorite action on readable shared notes', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已绑定创建者身份，你现在可以查看内容，但不能修改或保存更新。',
      content: '这是分享给我的正文。',
      editAccess: 'forbidden',
      favoriteState: 'not-favorited'
    })
    mockedDraftContent.value = '这是分享给我的正文。'
    mockedEditKey.value = ''
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = null
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '当前账户不可编辑',
      editStatusTone: 'danger',
      editStatusCaption: '请使用创建者身份重新登录后再试。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default',
      showFavoriteButton: true,
      favoriteButtonLabel: '收藏',
      favoriteButtonState: 'default'
    }

    const wrapper = mountShell('authenticated')

    expect(wrapper.text()).toContain('收藏')
  })

  it('shows a saving indicator while the save request is in flight', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      content: '草稿内容。',
      editAccess: 'anonymous-editable'
    })
    mockedDraftContent.value = '草稿内容。'
    mockedEditKey.value = ''
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
      editStatusLabel: '匿名可编辑',
      editStatusTone: 'warning',
      editStatusCaption: '该对象尚未绑定创建者，持有链接即可继续修改。',
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
      content: '旧内容。',
      editAccess: 'anonymous-editable'
    })
    mockedDraftContent.value = '用户尚未保存的新草稿。'
    mockedEditKey.value = ''
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
      editStatusLabel: '匿名可编辑',
      editStatusTone: 'warning',
      editStatusCaption: '该对象尚未绑定创建者，持有链接即可继续修改。',
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
    mockedEditKey.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = null
    mockedObjectHeader.value = null

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('该在线便签已删除')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('首次保存')
    expect(wrapper.text()).not.toContain('复制链接')
  })

  it('shows owner-bound notes as readable but not editable for the current account', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已绑定创建者身份，你现在可以查看内容，但不能修改或保存更新。',
      content: '创建者正文。',
      editAccess: 'forbidden'
    })
    mockedDraftContent.value = '创建者正文。'
    mockedEditKey.value = ''
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = {
      tone: 'warning',
      state: 'default',
      title: '当前账户只能查看',
      description: '该对象已绑定创建者，如需编辑请先使用创建者身份恢复登录。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '当前账户不可编辑',
      editStatusTone: 'danger',
      editStatusCaption: '请使用创建者身份重新登录后再试。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()
    const textarea = wrapper.find('textarea')
    const buttons = wrapper.findAll('button')
    const saveButton = buttons.find((button) => button.text().includes('当前不可保存'))

    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).disabled).toBe(true)
    expect(wrapper.text()).toContain('只读查看')
    expect(wrapper.text()).toContain('当前账户不可编辑')
    expect(wrapper.text()).toContain('当前账户只能查看')
    expect(saveButton?.attributes('disabled')).toBeDefined()
  })

  it('shows keyed notes as readable objects that need an edit key before saving', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象可以正常查看，但需要输入编辑密钥后才能继续保存更新。',
      content: '共享正文。',
      editAccess: 'key-required'
    })
    mockedDraftContent.value = '共享正文。'
    mockedEditKey.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = {
      tone: 'warning',
      state: 'default',
      title: '需要编辑密钥',
      description: '当前对象需要输入编辑密钥后才能保存更新。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '未保存变更',
      saveStatusTone: 'warning',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '输入密钥后可编辑',
      editStatusTone: 'warning',
      editStatusCaption: '当前对象开启了共享编辑保护，输入正确密钥后才能保存更新。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('输入密钥后可编辑')
    expect(wrapper.text()).toContain('需要编辑密钥')
    expect(wrapper.text()).toContain('编辑密钥')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('保存更新')
  })

  it('announces edit-key feedback politely and associates it with the password field', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象可以正常查看，但需要输入编辑密钥后才能继续保存更新。',
      content: '共享正文。',
      editAccess: 'key-required'
    })
    mockedDraftContent.value = '共享正文。'
    mockedEditKey.value = 'wrong-secret'
    mockedSaveState.value = 'save-error'
    mockedSaveFeedback.value = {
      tone: 'danger',
      state: 'error',
      title: '编辑密钥不正确',
      description: '当前编辑密钥不正确，请确认后重试。',
      describedField: 'editKey'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '保存失败',
      saveStatusTone: 'danger',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '输入密钥后可编辑',
      editStatusTone: 'warning',
      editStatusCaption: '当前对象开启了共享编辑保护，输入正确密钥后才能保存更新。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()
    const feedback = wrapper.get('[role="status"]')
    const editKeyInput = wrapper.get('input[type="password"]')
    const describedBy = editKeyInput.attributes('aria-describedby')

    expect(feedback.attributes('aria-live')).toBe('polite')
    expect(feedback.attributes('aria-atomic')).toBe('true')
    expect(describedBy).toBeTruthy()

    for (const id of describedBy!.split(/\s+/)) {
      expect(wrapper.find(`#${id}`).exists()).toBe(true)
    }
  })

  it('shows the irreversible-risk warning only for anonymous first saves with an edit key', () => {
    mockedViewModel.value = createViewModel({
      status: 'not-found',
      title: '这个 sid 还没有保存内容',
      description: '你可以直接开始输入正文，并在当前固定链接下首次保存。'
    })
    mockedDraftContent.value = '待保存正文。'
    mockedEditKey.value = 'shared-secret'
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = {
      tone: 'warning',
      state: 'default',
      title: '尚未保存',
      description: '当前 sid 还没有远端对象，点击保存后会创建第一版内容。'
    }
    mockedObjectHeader.value = null

    const anonymousWrapper = mountShell('anonymous')
    const authenticatedWrapper = mountShell('authenticated')
    const riskFeedback = anonymousWrapper
      .findAll('[role="status"]')
      .find((wrapper) => wrapper.text().includes('遗失编辑密钥后将无法恢复编辑权'))

    expect(anonymousWrapper.text()).toContain('遗失编辑密钥后将无法恢复编辑权')
    expect(riskFeedback).toBeTruthy()
    expect(riskFeedback?.attributes('aria-live')).toBe('polite')
    expect(riskFeedback?.attributes('aria-atomic')).toBe('true')
    expect(authenticatedWrapper.text()).not.toContain('遗失编辑密钥后将无法恢复编辑权')
  })

  it('does not render an edit-key input for forbidden notes', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已绑定创建者身份，你现在可以查看内容，但不能修改或保存更新。',
      content: '创建者正文。',
      editAccess: 'forbidden'
    })
    mockedDraftContent.value = '创建者正文。'
    mockedEditKey.value = ''
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = {
      tone: 'warning',
      state: 'default',
      title: '当前账户只能查看',
      description: '该对象已绑定创建者，如需编辑请先使用创建者身份恢复登录。'
    }
    mockedObjectHeader.value = {
      sid: 'note123abc4',
      saveStatusLabel: '已保存',
      saveStatusTone: 'success',
      shareStatusLabel: '可分享',
      shareStatusTone: 'success',
      shareStatusDescription: '复制的是当前固定链接，接收者会看到最近一次成功保存的内容。',
      editStatusLabel: '当前账户不可编辑',
      editStatusTone: 'danger',
      editStatusCaption: '请使用创建者身份重新登录后再试。',
      canCopyShareLink: true,
      copyButtonLabel: '复制链接',
      copyButtonState: 'default'
    }

    const wrapper = mountShell()

    expect(wrapper.text()).not.toContain('设置/更新编辑密钥')
    expect(wrapper.text()).not.toContain('编辑密钥')
  })

  it('calls the share action when the copy button is triggered from the object header', async () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已经存在，持有链接即可继续编辑并保存更新。',
      content: '这是最新已保存内容。',
      editAccess: 'anonymous-editable'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedEditKey.value = ''
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
      editStatusLabel: '匿名可编辑',
      editStatusTone: 'warning',
      editStatusCaption: '该对象尚未绑定创建者，持有链接即可继续修改。',
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
  it('gives invalid sid states a clear next step instead of only technical explanation', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: null,
      loading: false
    })

    expect(viewModel).toMatchObject({
      status: 'invalid-sid',
      sid: null,
      title: '当前链接缺少有效 sid'
    })
    expect(viewModel.description).toContain('检查链接')
  })

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

  it('surfaces owner-bound notes as readable but non-editable in the view model', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: 'owner123',
      loading: false,
      note: {
        sid: 'owner123',
        content: '创建者正文。',
        status: 'available',
        editAccess: 'forbidden'
      }
    })

    expect(viewModel).toMatchObject({
      status: 'available',
      sid: 'owner123',
      editAccess: 'forbidden'
    })
    expect(viewModel.description).toContain('不能修改')
  })

  it('surfaces keyed notes as readable objects that still need an edit key', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: 'shared123',
      loading: false,
      note: {
        sid: 'shared123',
        content: '共享正文。',
        status: 'available',
        editAccess: 'key-required'
      }
    })

    expect(viewModel).toMatchObject({
      status: 'available',
      sid: 'shared123',
      editAccess: 'key-required'
    })
    expect(viewModel.description).toContain('需要输入编辑密钥')
  })

  it('keeps the latest readable note visible while a background refetch is still loading', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: 'shared123',
      loading: true,
      note: {
        sid: 'shared123',
        content: '共享正文。',
        status: 'available',
        editAccess: 'forbidden',
        favoriteState: 'favorited'
      }
    })

    expect(viewModel).toMatchObject({
      status: 'available',
      sid: 'shared123',
      editAccess: 'forbidden',
      favoriteState: 'favorited'
    })
  })
})

describe('resolveOnlineNoteObjectHeader', () => {
  it('keeps existing notes shareable in the header while a save is in flight', () => {
    const header = resolveOnlineNoteObjectHeader({
      sid: 'note123abc4',
      viewStatus: 'available',
      editAccess: 'anonymous-editable',
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

  it('describes key-protected notes as unlockable before editing', () => {
    const header = resolveOnlineNoteObjectHeader({
      sid: 'shared123',
      viewStatus: 'available',
      editAccess: 'key-required',
      saveState: 'unsaved'
    })

    expect(header).toMatchObject({
      editStatusLabel: '输入密钥后可编辑',
      editStatusTone: 'warning'
    })
    expect(header?.editStatusCaption).toContain('输入正确密钥')
  })

  it('shows a delete action for owner-editable notes in the object header', () => {
    const header = resolveOnlineNoteObjectHeader({
      sid: 'owned123',
      viewStatus: 'available',
      editAccess: 'owner-editable',
      saveState: 'saved'
    })

    expect(header).toMatchObject({
      showDeleteButton: true,
      deleteButtonLabel: '删除便签',
      deleteButtonState: 'default'
    })
  })

  it('does not show a delete action when the current page still needs an edit key', () => {
    const header = resolveOnlineNoteObjectHeader({
      sid: 'shared123',
      viewStatus: 'available',
      editAccess: 'key-required',
      saveState: 'saved'
    })

    expect(header).not.toMatchObject({
      showDeleteButton: true
    })
  })
})

describe('resolveOnlineNoteAuthorizationUiModel', () => {
  it('describes key-required notes as readable but waiting for key verification', () => {
    const uiModel = resolveOnlineNoteAuthorizationUiModel({
      viewStatus: 'available',
      editAccess: 'key-required',
      authStatus: 'anonymous',
      hasEditKeyValue: false
    })

    expect(uiModel).toMatchObject({
      canShowEditor: true,
      canSave: true,
      modeBadgeLabel: '等待密钥',
      actionLabel: '验证密钥并保存',
      editKeyLabel: '编辑密钥'
    })
    expect(uiModel.shellDescription).toContain('需要输入编辑密钥')
    expect(uiModel.editorHint).toContain('共享编辑保护')
  })

  it('gives deleted notes an explicit terminal badge instead of generic exception semantics', () => {
    const uiModel = resolveOnlineNoteAuthorizationUiModel({
      viewStatus: 'deleted',
      editAccess: null,
      authStatus: 'anonymous',
      hasEditKeyValue: false
    })

    expect(uiModel).toMatchObject({
      canShowEditor: false,
      canSave: false,
      modeBadgeLabel: '已删除'
    })
    expect(uiModel.shellDescription).toContain('不可恢复')
  })

  it('describes forbidden notes as readable but not savable', () => {
    const uiModel = resolveOnlineNoteAuthorizationUiModel({
      viewStatus: 'available',
      editAccess: 'forbidden',
      authStatus: 'anonymous',
      hasEditKeyValue: false
    })

    expect(uiModel).toMatchObject({
      canShowEditor: true,
      canSave: false,
      modeBadgeLabel: '只读查看',
      actionLabel: '当前不可保存',
      shouldShowEditKeyInput: false
    })
    expect(uiModel.editorPlaceholder).toContain('仅可查看')
  })

  it('downgrades key-editable to key-required when the current page no longer holds the key', () => {
    const uiModel = resolveOnlineNoteAuthorizationUiModel({
      viewStatus: 'available',
      editAccess: 'key-editable',
      authStatus: 'anonymous',
      hasEditKeyValue: false
    })

    expect(uiModel).toMatchObject({
      modeBadgeLabel: '等待密钥',
      actionLabel: '验证密钥并保存',
      editKeyLabel: '编辑密钥'
    })
  })

  it('shows irreversible key risk only for anonymous first-save flows with a key value', () => {
    const anonymousUi = resolveOnlineNoteAuthorizationUiModel({
      viewStatus: 'not-found',
      editAccess: null,
      authStatus: 'anonymous',
      hasEditKeyValue: true
    })
    const authenticatedUi = resolveOnlineNoteAuthorizationUiModel({
      viewStatus: 'not-found',
      editAccess: null,
      authStatus: 'authenticated',
      hasEditKeyValue: true
    })

    expect(anonymousUi.shouldShowEditKeyRisk).toBe(true)
    expect(authenticatedUi.shouldShowEditKeyRisk).toBe(false)
    expect(anonymousUi.editKeyLabel).toBe('编辑密钥（可选）')
  })
})
