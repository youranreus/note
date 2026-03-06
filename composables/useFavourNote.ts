import type { MemoRes, PaginationData, PaginationRes } from '~/types'

const useStore = defineStore('user-favour', () => {
  const { get } = useRequest()
  const { isLogged } = useAuth()
  const pagination = ref<PaginationData>({ page: 1, limit: 10, total: 0 })
  const data = ref<MemoRes[]>([])
  const loading = ref(false)

  const load = async () => {
    if (!isLogged.value) return
    loading.value = true
    const res = await get<PaginationRes<MemoRes>>('/api/user/favourites', {
      query: { page: pagination.value.page, limit: pagination.value.limit },
    })
    pagination.value.total = res.total
    data.value = res.data
    loading.value = false
  }

  watch([() => pagination.value.page], load)

  return { data, pagination, loading, load }
}, {
  persist: process.client && { storage: persistedState.localStorage, key: 'user-favour' },
})

export const useFavourNote = () => {
  const store = useStore()
  return { ...store, ...storeToRefs(store) }
}
