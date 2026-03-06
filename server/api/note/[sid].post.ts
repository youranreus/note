import { queryNote, createNote, updateNote } from '~/server/database/repos/noteRepo'

export default defineEventHandler(async (event) => {
  const sid = getRouterParam(event, 'sid')
  const { user } = await getUserSession(event)
  const body = await readBody(event)

  if (!sid || !body?.content === undefined) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'data missing' }))
  }

  let note = await queryNote(sid)

  if (!note) {
    note = await createNote(sid, user?.id)
  }

  if (note!.key && note!.key !== body.key) {
    return sendError(event, createError({ statusCode: 403, statusMessage: 'key error' }))
  }

  const updated = await updateNote(note!.id, body.content, body.key)
  return transformNote(updated, user?.id)
})
