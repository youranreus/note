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
  const loading = ref(false);
  const panelActive = ref(false);
  const msg = useMessage();

  const update = (data: UserJwtPayload) => {
    userData.value = data;
  }

  const clear = () => {
    userData.value = { ...INIT_USER_DATA };
  }

  const isLogged = computed(() => !!userData.value.id)

  const togglePanel = (v = true) => {
    panelActive.value = v;
  }

  const login = async (ticket: string) => {
    togglePanel()
    loading.value = true
    const data = await useGet<UserJwtPayload>('/api/login', { query: { ticket } })
    update(data)
    msg.success('登录成功')
    loading.value = false
  }

  return { loading, userData, isLogged, panelActive, update, clear, login, togglePanel };
}, {
  persist: process.client && {
    storage: persistedState.localStorage,
    key: 'user-store'
  },
})