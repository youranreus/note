import { NoteType } from '~/types'


export const useMemo = (sid?: string, type?: NoteType) => {
  const { copy } = useClipboard()
  const msg = useMessage()

  const copyUrl = () => {
    copy(window.location.href)
    msg.success('复制链接成功')
  }

  const memoHooks = type === NoteType.ONLINE ? useOnlineNote(sid) : useLocalNote(sid);

  return {
    ...memoHooks,
    copyUrl,
  }
}