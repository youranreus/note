// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InlineFeedback from '../src/components/ui/InlineFeedback.vue'

describe('InlineFeedback', () => {
  it('maps optional live-region props to accessible attributes', () => {
    const wrapper = mount(InlineFeedback, {
      props: {
        id: 'edit-key-feedback',
        title: '需要编辑密钥',
        description: '请输入正确的编辑密钥后再试。',
        tone: 'warning',
        state: 'default',
        role: 'status',
        ariaLive: 'polite',
        ariaAtomic: true
      }
    })

    const feedback = wrapper.get('#edit-key-feedback')

    expect(feedback.attributes('role')).toBe('status')
    expect(feedback.attributes('aria-live')).toBe('polite')
    expect(feedback.attributes('aria-atomic')).toBe('true')
  })
})
