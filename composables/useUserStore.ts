import { defineStore } from 'pinia'
import { type UserJwtPayload, UserRole } from '@reus-able/types'

const INIT_USER_DATA = {
  email: '',
  role: UserRole.USER,
  refresh: false,
  id: 0,
};

export const useUserStore = defineStore('user', () => {
  const userData = ref<UserJwtPayload>({ ...INIT_USER_DATA });

  const update = (data: UserJwtPayload) => {
    userData.value = data;
  }

  const clear = () => {
    userData.value = { ...INIT_USER_DATA };
  }

  const isLogged = computed(() => !!userData.value.id)

  return { userData, isLogged, update, clear };
}, {
  persist: process.client && {
    storage: persistedState.localStorage,
    key: 'user-store'
  },
})