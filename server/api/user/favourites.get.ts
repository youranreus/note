import { getUserFavourNote } from '~/server/database/repos/noteRepo'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) return sendError(event, createError({ statusCode: 401, statusMessage: 'unauthorized' }))

  const { page, limit } = getQuery(event)
  const { data, total } = await getUserFavourNote(user.id, Number(page ?? 1), Number(limit ?? 10))

  return {
    total,
    data: data.map(n => transformNote(n, user.id)),
  }
})
