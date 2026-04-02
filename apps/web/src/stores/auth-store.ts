import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import type { AuthStatus } from '@note/shared-types'

export const useAuthStore = defineStore('auth', () => {
  const status = shallowRef<AuthStatus>('anonymous')

  const label = computed(() => {
    if (status.value === 'recovering') {
      return 'Recovering'
    }

    if (status.value === 'authenticated') {
      return 'Signed in'
    }

    return 'Anonymous'
  })

  const description = computed(() => {
    if (status.value === 'recovering') {
      return '等待回调完成'
    }

    if (status.value === 'authenticated') {
      return '后续接入真实会话'
    }

    return '右上状态入口占位'
  })

  const tone = computed(() => {
    if (status.value === 'recovering') {
      return 'accent'
    }

    if (status.value === 'authenticated') {
      return 'success'
    }

    return 'neutral'
  })

  return {
    status,
    label,
    description,
    tone
  }
})
