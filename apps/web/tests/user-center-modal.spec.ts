// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserCenterModal from '../src/features/user-panel/components/UserCenterModal.vue'

function mountUserCenterModal(
  overrides: Record<string, unknown> = {}
) {
  return mount(UserCenterModal, {
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
})
