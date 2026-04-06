import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import type {
  AuthStatus,
  AuthenticatedSessionDto,
  AuthUserDto,
  PostLoginActionDto
} from '@note/shared-types'

export const useAuthStore = defineStore('auth', () => {
  const status = shallowRef<AuthStatus>('anonymous')
  const user = shallowRef<AuthUserDto | null>(null)
  const loginModalOpen = shallowRef(false)
  const sessionHydrated = shallowRef(false)
  const loginIntent = shallowRef<PostLoginActionDto | null>(null)
  const pendingPostLoginAction = shallowRef<PostLoginActionDto | null>(null)

  const label = computed(() => {
    if (status.value === 'recovering') {
      return '登录恢复中'
    }

    if (status.value === 'authenticated') {
      return user.value?.displayName ? `${user.value.displayName}` : '已登录'
    }

    return '未登录'
  })

  const description = computed(() => {
    if (status.value === 'recovering') {
      return '正在完成回跳与会话恢复'
    }

    if (status.value === 'authenticated') {
      return '后续会在这里接入个人中心'
    }

    return '登录后会回到当前上下文'
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

  function openLoginModal(intent: PostLoginActionDto | null = null) {
    if (status.value !== 'anonymous') {
      return
    }

    loginIntent.value = intent
    loginModalOpen.value = true
  }

  function closeLoginModal() {
    loginModalOpen.value = false
    loginIntent.value = null
  }

  function setRecovering() {
    status.value = 'recovering'
    closeLoginModal()
  }

  function setAuthenticated(
    session: AuthenticatedSessionDto,
    postLoginAction: PostLoginActionDto | null = null
  ) {
    status.value = 'authenticated'
    user.value = session.user
    pendingPostLoginAction.value = postLoginAction
    sessionHydrated.value = true
    closeLoginModal()
  }

  function setAnonymous() {
    status.value = 'anonymous'
    user.value = null
    pendingPostLoginAction.value = null
    sessionHydrated.value = true
    closeLoginModal()
  }

  function markSessionHydrated() {
    sessionHydrated.value = true
  }

  function clearPendingPostLoginAction() {
    pendingPostLoginAction.value = null
  }

  return {
    status,
    user,
    label,
    description,
    tone,
    loginModalOpen,
    sessionHydrated,
    loginIntent,
    pendingPostLoginAction,
    openLoginModal,
    closeLoginModal,
    setRecovering,
    setAuthenticated,
    setAnonymous,
    markSessionHydrated,
    clearPendingPostLoginAction
  }
})
