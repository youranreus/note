import localforage from 'localforage'
import type { MemoData } from '~/types'

export const useLocalNote = (sid?: string) => {
  const toast = useToast()
  const router = useRouter()

  const memo = ref<MemoData>({
    id: 0, sid: sid || '', content: '', key: '', locked: false, editing: false, favoured: false,
  })
  const loading = ref(false)

  const save = async () => {
    loading.value = true
    try {
      await localforage.setItem(`memo-${sid}`, { ...memo.value, editing: false })
      memo.value.editing = false
      toast.add({ title: '保存成功', color: 'success' })
    } finally {
      loading.value = false
    }
  }

  const remove = async () => {
    loading.value = true
    try {
      await localforage.removeItem(`memo-${sid}`)
      toast.add({ title: '删除成功', color: 'success' })
      router.push('/')
    } catch {
      toast.add({ title: '删除失败', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const setLocked = () => { memo.value.locked = true }
  const toggleFavour = (v: boolean) => { memo.value.favoured = v }

  if (sid) {
    loading.value = true
    localforage.getItem<MemoData>(`memo-${sid}`)
      .then(data => { if (data) Object.assign(memo.value, data) })
      .finally(() => {
        loading.value = false
        memo.value.sid = memo.value.sid || sid
      })
  }

  return { memo, loading, save, remove, setLocked, toggleFavour }
}
