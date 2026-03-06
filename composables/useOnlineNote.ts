import { NoteType } from '~/types'
import type { MemoData, MemoRes } from '~/types'

export const useOnlineNote = (sid?: string) => {
  const toast = useToast()
  const router = useRouter()
  const { get, post, del } = useRequest()
  const { user, isLogged } = useAuth()

  const memo = ref<MemoData>({
    id: 0, sid: sid || '', content: '', key: '', locked: false, editing: false, favoured: false,
  })
  const loading = ref(false)
  const hasSynced = ref(false)

  const save = async () => {
    loading.value = true
    try {
      const res = await post<MemoRes>(`/api/note/${sid}`, {
        content: memo.value.content,
        key: memo.value.key || undefined,
      })
      Object.assign(memo.value, res)
      memo.value.editing = false
      hasSynced.value = true
      toast.add({ title: '保存成功', color: 'success' })
    } catch {
      toast.add({ title: '保存失败', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const remove = async () => {
    loading.value = true
    try {
      await del(`/api/note/${sid}`, { query: { key: memo.value.key || undefined } })
      toast.add({ title: '删除成功', color: 'success' })
      router.push('/')
    } catch {
      toast.add({ title: '删除失败', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const toggleFavour = async (favoured: boolean) => {
    if (!hasSynced.value) {
      toast.add({ title: '请先保存便签再收藏', color: 'warning' })
      return
    }
    loading.value = true
    try {
      if (favoured) {
        await post(`/api/favour`, null, { query: { id: memo.value.id } })
      } else {
        await del(`/api/favour`, { query: { id: memo.value.id } })
      }
      memo.value.favoured = favoured
      toast.add({ title: favoured ? '已收藏' : '已取消收藏', color: 'success' })
    } catch {
      toast.add({ title: '操作失败', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const setLocked = () => { memo.value.locked = true }

  // 初始加载
  if (sid) {
    loading.value = true
    get<MemoRes>(`/api/note/${sid}`)
      .then(res => { Object.assign(memo.value, res); hasSynced.value = true })
      .catch(() => { memo.value.content = '' })
      .finally(() => { loading.value = false })
  }

  return { memo, loading, isLogged, hasSynced, save, remove, toggleFavour, setLocked }
}
