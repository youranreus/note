import { UserJwtPayload } from "@reus-able/types"
import { userUnFavourNote } from "../database/repos/noteRepo"

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

    await userUnFavourNote(userData.data.id, Number(id))

    return { msg: 'ok' }
  } catch (error) {
    return handleError(error, e)
  }
})