import { createNote, queryNote, updateNote } from "../database/repos/noteRepo"

export default defineEventHandler(async (e) => {
  const { sid } = getQuery(e)
  const data = await readBody(e)

  if (!sid || !data.content)
    return sendError(e, createError('data missing!'))

  try {
    let note = await queryNote(`${sid}`)

    if (!note) {
      note = await createNote(`${sid}`);
    }

    if (note.key && note.key !== data.key)
      return sendError(e, createError('key error!'))

    await updateNote(note.id, data.content, data.key)

    return {
      content: note.content,
      sid: note.sid,
      id: note.id,
    }
  } catch (error) {
    console.error(error)
    return sendError(e, createError('Failed to retrieve data!'))
  }
})