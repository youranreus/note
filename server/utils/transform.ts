import type { notes, favourites } from '../database/schema'
import type { InferSelectModel } from 'drizzle-orm'
import { NOTE_NOT_FOUND, TOKEN_EXPIRED } from '~/constants'

type NoteRow = InferSelectModel<typeof notes> & {
  favourBy: InferSelectModel<typeof favourites>[]
}

export const transformNote = (note: NoteRow | undefined | null, userId?: number) => {
  if (!note) return null
  return {
    id: note.id,
    sid: note.sid,
    content: note.content,
    locked: !!note.key,
    favoured: note.favourBy?.some(f => f.userId === userId) ?? false,
  }
}

export const handleError = (error: any, event: any) => {
  if (error?.status === 401) {
    return sendError(event, createError({ statusCode: 401, statusMessage: TOKEN_EXPIRED }))
  }
  return sendError(event, createError('Internal server error'))
}
