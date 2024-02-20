import { UserJwtPayload } from "@reus-able/types"
import { createNote, queryNote, updateNote } from "../database/repos/noteRepo"

export default defineEventHandler(async (e) => {
  const { sid } = getQuery(e)
  const token = getHeader(e, 'authorization')
  const ssoId = getHeader(e, 'x-user-id')
  const data = await readBody(e)
  const api = useRuntimeConfig().ssoApi;

  if (!sid || !data.content)
    return sendError(e, createError('data missing!'))

  try {
    let note = await queryNote(`${sid}`)

    if (!note) {
      if (token) {
        const userData = await $fetch<{ data: UserJwtPayload }>(`${api}/user/validate`, {
          headers: {
            authorization: token,
          }
        })
        note = await createNote(`${sid}`, userData.data.id);
      } else {
        note = await createNote(`${sid}`);
      }
    }

    if (note.key && note.key !== data.key)
      return sendError(e, createError('key error!'))

    note = await updateNote(note.id, data.content, data.key)

    return transformNote(note, Number(ssoId))
  } catch (error) {
    return handleError(error, e)
  }
})