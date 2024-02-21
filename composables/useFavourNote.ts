import type { MemoRes, PaginationRes, PaginationData } from "~/types"

const useStore = defineStore('user-favour-store', () => {
  const pagination = ref<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
  })
  const data = ref<MemoRes[]>([])
  const loading = ref(false)
  const { isLogged } = useUser()

  const load = async () => {
    if (!isLogged.value) return;

    loading.value = true
    const res = await useGet<PaginationRes<MemoRes>>('/api/getFavourNote', {
      query: {
        page: pagination.value.page,
        limit: pagination.value.limit,
      }
    })

    pagination.value.total = res.total
    data.value = [...res.data]
    loading.value = false
  }

  watch(
    [() => pagination.value.page, () => pagination.value.limit],
    async () => {
      await load()
    }
  )
  
  return { data, pagination, loading, load }
}, {
  persist: process.client && {
    storage: persistedState.localStorage,
    key: 'user-favour-store'
  },
})

export const useFavourNote = () => {
  const store = useStore();

  return {
    ...store,
    ...storeToRefs(store),
  }
}