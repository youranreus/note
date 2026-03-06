import { queryNote } from '~/server/database/repos/noteRepo'
import { NOTE_NOT_FOUND } from '~/constants'

export default defineEventHandler(async (event) => {
  const sid = getRouterParam(event, 'sid')
  if (!sid) return sendError(event, createError({ statusCode: 400, statusMessage: 'sid required' }))

  const { user } = await getUserSession(event)
  const note = await queryNote(sid)

  if (!note) {
    return sendError(event, createError({ statusCode: 404, statusMessage: NOTE_NOT_FOUND }))
  }

  return transformNote(note, user?.id)
})
