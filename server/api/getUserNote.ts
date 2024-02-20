import { UserJwtPayload } from "@reus-able/types";
import { getUserNote } from "../database/repos/noteRepo"

export default defineEventHandler(async (e) => {
  const token = getHeader(e, 'authorization')
  const { page, limit } = getQuery(e)
  const api = useRuntimeConfig().ssoApi;

  if (!token)
    return sendError(e, createError('token required!'))

  try {
    const userData = await $fetch<{ data: UserJwtPayload }>(`${api}/user/validate`, {
      headers: {
        authorization: token,
      }
    })

    const [data, meta] = await getUserNote(userData.data.id, Number(page ?? 1), Number(limit ?? 100))

    return {
      total: meta.totalCount,
      data: data.map(transformNote),
    }
  } catch (error) {
    console.error(error)
    return sendError(e, createError('Failed to retrieve data!'))
  }
})