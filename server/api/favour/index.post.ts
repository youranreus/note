import { addFavourite } from '~/server/database/repos/noteRepo'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) return sendError(event, createError({ statusCode: 401, statusMessage: 'unauthorized' }))

  const { id } = getQuery(event)
  if (!id) return sendError(event, createError({ statusCode: 400, statusMessage: 'id required' }))

  await addFavourite(user.id, Number(id))
  return { msg: 'ok' }
})
