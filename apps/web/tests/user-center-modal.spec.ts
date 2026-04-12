// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserCenterModal from '../src/features/user-panel/components/UserCenterModal.vue'

function mountUserCenterModal(
  overrides: Record<string, unknown> = {}
) {
  return mount(UserCenterModal, {
    attachTo: document.body,
    props: {
      open: true,
      activeTab: 'created',
      createdNotes: [],
      createdPage: 1,
      createdTotal: 0,
      createdHasMore: false,
      createdLoading: false,
      createdLoadingMore: false,
      createdErrorMessage: '',
      favoriteNotes: [],
      favoritePage: 1,
      favoriteTotal: 0,
      favoriteHasMore: false,
      favoriteLoading: false,
      favoriteLoadingMore: false,
      favoriteErrorMessage: '',
      ...overrides
    }
  })
}

describe('user center modal', () => {
  it('renders created notes with recognizable information and enter actions', async () => {
    const wrapper = mountUserCenterModal({
      createdNotes: [
        {
          sid: 'alpha123',
          preview: '第一条便签摘要',
          updatedAt: '2026-04-07T10:00:00.000Z'
        }
      ]
    })

    expect(wrapper.text()).toContain('个人中心')
    expect(wrapper.text()).toContain('我的创建')
    expect(wrapper.text()).toContain('alpha123')
    expect(wrapper.text()).toContain('第一条便签摘要')

    await wrapper.get('[data-testid="user-center-open-note-alpha123"]').trigger('click')

    expect(wrapper.emitted('openNote')).toEqual([['alpha123']])
  })

  it('renders an empty state with a clear reason and first-create suggestion', async () => {
    const wrapper = mountUserCenterModal()

    expect(wrapper.text()).toContain('你还没有创建过在线便签')
    expect(wrapper.text()).toContain('回到首页创建第一条便签')

    await wrapper.get('[data-testid="user-center-create-first-note"]').trigger('click')

    expect(wrapper.emitted('createFirstNote')).toHaveLength(1)
  })

  it('supports keyboard tab switching between created and favorites tabs', async () => {
    const wrapper = mountUserCenterModal()

    const createdTab = wrapper.get('[data-testid="user-center-tab-created"]')
    await createdTab.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('selectTab')).toEqual([['favorites']])
  })

  it('moves initial focus to the active tab when the modal opens', async () => {
    const wrapper = mountUserCenterModal()

    await flushPromises()

    expect(document.activeElement).toBe(wrapper.get('[data-testid="user-center-tab-created"]').element)
  })

  it('keeps initial focus on the selected favorites tab when the modal opens there', async () => {
    const wrapper = mountUserCenterModal({
      activeTab: 'favorites'
    })

    await flushPromises()

    expect(document.activeElement).toBe(wrapper.get('[data-testid="user-center-tab-favorites"]').element)
  })

  it('exposes tab-panel relationships and supports reverse keyboard switching', async () => {
    const wrapper = mountUserCenterModal({
      activeTab: 'favorites'
    })

    const favoritesTab = wrapper.get('[data-testid="user-center-tab-favorites"]')
    const favoritesPanel = wrapper.get('#user-center-panel-favorites')

    expect(favoritesTab.attributes('role')).toBe('tab')
    expect(favoritesTab.attributes('aria-controls')).toBe('user-center-panel-favorites')
    expect(favoritesTab.attributes('id')).toBe('user-center-tab-favorites')
    expect(favoritesPanel.attributes('role')).toBe('tabpanel')
    expect(favoritesPanel.attributes('aria-labelledby')).toBe('user-center-tab-favorites')

    await favoritesTab.trigger('keydown', { key: 'ArrowLeft' })

    expect(wrapper.emitted('selectTab')).toEqual([['created']])
  })

  it('uses button-sized touch targets for tabs and the close action', () => {
    const wrapper = mountUserCenterModal()

    expect(wrapper.get('[data-testid="user-center-tab-created"]').classes()).toContain('min-h-11')

    const closeButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text() === '关闭个人中心')

    expect(closeButton).toBeDefined()
    expect(closeButton!.classes()).toContain('min-h-11')
  })

  it('renders pagination progress and emits load-more for additional created notes', async () => {
    const wrapper = mountUserCenterModal({
      createdNotes: [
        {
          sid: 'alpha123',
          preview: '第一页便签摘要',
          updatedAt: '2026-04-07T10:00:00.000Z'
        }
      ],
      createdPage: 1,
      createdTotal: 21,
      createdHasMore: true
    })

    expect(wrapper.text()).toContain('当前已显示 1 / 21 条创建记录')
    expect(wrapper.text()).toContain('当前页为第 1 页')

    await wrapper.get('[data-testid="user-center-load-more"]').trigger('click')

    expect(wrapper.emitted('loadMoreCreated')).toHaveLength(1)
  })

  it('keeps tabs fixed while letting the created note panel scroll', () => {
    const wrapper = mountUserCenterModal({
      createdNotes: Array.from({ length: 8 }, (_, index) => ({
        sid: `note-${index + 1}`,
        preview: `第 ${index + 1} 条便签摘要`,
        updatedAt: '2026-04-07T10:00:00.000Z'
      }))
    })

    expect(wrapper.get('[data-testid="user-center-modal"]').classes()).toContain('grid-rows-[auto,minmax(0,1fr)]')
    expect(wrapper.get('#user-center-panel-created').classes()).toContain('overflow-y-auto')
  })

  it('renders favorite notes with favorite semantics and enter actions', async () => {
    const wrapper = mountUserCenterModal({
      activeTab: 'favorites',
      favoriteNotes: [
        {
          sid: 'shared123',
          preview: '收藏的便签摘要',
          updatedAt: '2026-04-08T10:00:00.000Z',
          favoritedAt: '2026-04-09T08:30:00.000Z'
        }
      ]
    })

    expect(wrapper.text()).toContain('我的收藏')
    expect(wrapper.text()).toContain('shared123')
    expect(wrapper.text()).toContain('收藏的便签摘要')
    expect(wrapper.text()).toContain('收藏于')
    expect(wrapper.text()).toContain('最近更新')

    await wrapper.get('[data-testid="user-center-open-favorite-shared123"]').trigger('click')

    expect(wrapper.emitted('openNote')).toEqual([['shared123']])
  })

  it('clamps note preview text to two lines and keeps the full value in the title', () => {
    const longPreview = '这是一个非常长的便签摘要，用来验证个人中心里展示的 note 文本会被限制为最多两行，同时仍然可以通过 title 查看完整内容。'
    const wrapper = mountUserCenterModal({
      createdNotes: [
        {
          sid: 'alpha123',
          preview: longPreview,
          updatedAt: '2026-04-07T10:00:00.000Z'
        }
      ]
    })

    const preview = wrapper.get('.user-center-note-preview')

    expect(preview.attributes('title')).toBe(longPreview)
    expect(preview.classes()).toContain('leading-5')
  })

  it('renders an empty favorites state with a clear browse-and-favorite suggestion', async () => {
    const wrapper = mountUserCenterModal({
      activeTab: 'favorites'
    })

    expect(wrapper.text()).toContain('当前没有收藏内容')
    expect(wrapper.text()).toContain('去阅读并收藏')

    await wrapper.get('[data-testid="user-center-browse-notes"]').trigger('click')

    expect(wrapper.emitted('browseNotes')).toHaveLength(1)
  })
})
