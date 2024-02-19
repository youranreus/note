import { queryNote } from "../database/repos/noteRepo"
import { NOTE_NOT_FOUND } from '~/constants'

export default defineEventHandler(async (e) => {
  const { sid } = getQuery(e)

  if (!sid)
    return sendError(e, createError('sid required!'))

  try {
    const note = await queryNote(`${sid}`)

    if (!note) {
      return sendError(e, createError({
        statusCode: 401,
        statusMessage: NOTE_NOT_FOUND,
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