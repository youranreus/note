import { queryNote } from "../database/repos/noteRepo"

export default defineEventHandler(async (e) => {
  const { sid } = getQuery(e)

  if (!sid)
    return sendError(e, createError('sid required!'))

  try {
    const note = await queryNote(`${sid}`)

    if (!note) {
      return sendError(e, createError({
        statusCode: 401,
        statusMessage: 'note not exist!',
      }))
    }

    return {
      content: note.content,
      sid: note.sid,
      id: note.id,
      locked: !!note.key
    }
  } catch (error) {
    console.error(error)
    return sendError(e, createError('Failed to retrieve data!'))
  }
})