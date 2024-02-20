import type { MemoRes, PaginationRes, PaginationData } from "~/types"

export const useUserNote = () => {
  const pagination = ref<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
  })
  const data = ref<MemoRes[]>([])
  const loading = ref(false)

  const load = async () => {
    loading.value = true
    const res = await useGet<PaginationRes<MemoRes>>('/api/getUserNote', {
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
}