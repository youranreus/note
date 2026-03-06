import { queryNote, deleteNote } from '~/server/database/repos/noteRepo'

export default defineEventHandler(async (event) => {
  const sid = getRouterParam(event, 'sid')
  const { key } = getQuery(event)

  if (!sid) return sendError(event, createError({ statusCode: 400, statusMessage: 'sid required' }))

  const note = await queryNote(sid)
  if (!note) return { msg: 'ok' }

  if (note.key && note.key !== key) {
    return sendError(event, createError({ statusCode: 403, statusMessage: 'key error' }))
  }

  await deleteNote(sid)
  return { msg: 'ok' }
})
