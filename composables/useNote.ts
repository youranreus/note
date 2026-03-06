import { NoteType } from '~/types'
import { useClipboard } from '@vueuse/core'

export const useNote = (sid?: string, type?: NoteType) => {
  const { copy } = useClipboard()
  const toast = useToast()

  const copyUrl = () => {
    copy(window.location.href)
    toast.add({ title: '链接已复制', color: 'success' })
  }

  const hooks = type === NoteType.ONLINE ? useOnlineNote(sid) : useLocalNote(sid)

  return { ...hooks, copyUrl }
}
