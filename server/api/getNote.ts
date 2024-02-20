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
        statusCode: 404,
        statusMessage: NOTE_NOT_FOUND,
      }))
    }

    return transformNote(note)
  } catch (error) {
    return handleError(error, e)
  }
})