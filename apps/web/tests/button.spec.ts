// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Button from '../src/components/ui/Button.vue'

describe('Button', () => {
  it('maps note action icons to the expected Ionicons outline names', () => {
    const cases: Array<{
      icon: 'copy' | 'star' | 'lock' | 'save' | 'trash' | 'close'
      name: string
    }> = [
      {
        icon: 'close',
        name: 'close-outline'
      },
      {
        icon: 'copy',
        name: 'copy-outline'
      },
      {
        icon: 'star',
        name: 'star-outline'
      },
      {
        icon: 'lock',
        name: 'lock-closed-outline'
      },
      {
        icon: 'save',
        name: 'save-outline'
      },
      {
        icon: 'trash',
        name: 'trash-outline'
      }
    ]

    for (const testCase of cases) {
      const wrapper = mount(Button, {
        props: {
          icon: testCase.icon
        },
        slots: {
          default: '操作'
        }
      })

      expect(wrapper.get('ion-icon').attributes('name')).toBe(testCase.name)
    }
  })

  it('does not keep an extra slot wrapper for icon-only buttons', () => {
    const wrapper = mount(Button, {
      props: {
        icon: 'copy',
        size: 'icon',
        ariaLabel: '复制链接'
      },
      slots: {
        default: '<span class="sr-only">复制链接</span>'
      }
    })

    expect(wrapper.findAll('button > span').map((node) => node.classes())).toEqual([['sr-only']])
  })
})
