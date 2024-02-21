import { UserJwtPayload } from "@reus-able/types"
import { userFavourNote } from "../database/repos/noteRepo"

export default defineEventHandler(async (e) => {
  const { id } = getQuery(e)
  const token = getHeader(e, 'authorization')
  const api = useRuntimeConfig().ssoApi

  if (!id || !token)
    return sendError(e, createError('params missing!'))

  try {
    const userData = await $fetch<{ data: UserJwtPayload }>(`${api}/user/validate`, {
      headers: {
        authorization: token,
      }
    })

    await userFavourNote(userData.data.id, Number(id))

    return { msg: 'ok' }
  } catch (error) {
    return handleError(error, e)
  }
})