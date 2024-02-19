import { queryUser } from "../database/repos/userRepo"
import { UserJwtPayload } from "@reus-able/types";

export default defineEventHandler(async (e) => {
  const { ticket } = getQuery(e)
  const api = useRuntimeConfig().ssoApi;

  if (!ticket)
    return sendError(e, createError('ticket required!'))
  
  try {
    const userData = await $fetch<{ data: UserJwtPayload }>(`${api}/user/validate`, {
      headers: {
        authorization: `Bearer ${ticket}`
      }
    })
    
    await queryUser(userData.data.id)

    return userData.data
  } catch (error) {
    console.error(error)
    return sendError(e, createError('Failed to retrieve data!'))
  }
})