import { deleteNote, queryNote } from "../database/repos/noteRepo"

export default defineEventHandler(async (e) => {
  const { sid, key } = getQuery(e)

  if (!sid)
    return sendError(e, createError('sid required!'))

  try {
    const note = await queryNote(`${sid}`)

    if (!note) {
      return { msg: 'ok' }
    }

    if (note.key && note.key !== key)
      return sendError(e, createError('key error'))

    await deleteNote(note.sid);

    return { msg: 'ok' }
  } catch (error) {
    console.error(error)
    return sendError(e, createError('Failed to retrieve data!'))
  }
})