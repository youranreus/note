import { NoteType } from '~/types'


export const useMemo = (sid?: string, type?: NoteType) => {
  if (type === NoteType.ONLINE) {
    return useOnlineNote(sid);
  }

  return useLocalNote(sid);
}