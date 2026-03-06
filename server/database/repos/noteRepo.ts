import { eq, desc } from 'drizzle-orm'
import { useDB } from '../client'
import { notes, favourites } from '../schema'

export async function queryNote(sid: string) {
  const db = useDB()
  return db.query.notes.findFirst({
    where: eq(notes.sid, sid),
    with: { favourBy: true },
  })
}

export async function createNote(sid: string, authorId?: number) {
  const db = useDB()
  await db.insert(notes).values({ sid, content: '', authorId })
  return queryNote(sid)
}

export async function updateNote(id: number, content: string, key?: string) {
  const db = useDB()
  await db.update(notes).set({ content, key: key ?? null }).where(eq(notes.id, id))
  return db.query.notes.findFirst({
    where: eq(notes.id, id),
    with: { favourBy: true },
  })
}

export async function deleteNote(sid: string) {
  const db = useDB()
  return db.delete(notes).where(eq(notes.sid, sid))
}

export async function getUserNote(userId: number, page = 1, limit = 10) {
  const db = useDB()
  const offset = (page - 1) * limit
  const [data, countResult] = await Promise.all([
    db.query.notes.findMany({
      where: eq(notes.authorId, userId),
      with: { favourBy: true },
      orderBy: [desc(notes.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: notes.id }).from(notes).where(eq(notes.authorId, userId)),
  ])
  return { data, total: countResult.length }
}

export async function getUserFavourNote(userId: number, page = 1, limit = 10) {
  const db = useDB()
  const offset = (page - 1) * limit
  const favs = await db.query.favourites.findMany({
    where: eq(favourites.userId, userId),
    with: { note: { with: { favourBy: true } } },
    orderBy: [desc(favourites.createdAt)],
    limit,
    offset,
  })
  const total = await db.select({ id: favourites.noteId })
    .from(favourites).where(eq(favourites.userId, userId))
  return { data: favs.map(f => f.note), total: total.length }
}

export async function addFavourite(userId: number, noteId: number) {
  const db = useDB()
  return db.insert(favourites).values({ userId, noteId })
}

export async function removeFavourite(userId: number, noteId: number) {
  const db = useDB()
  return db.delete(favourites)
    .where(eq(favourites.userId, userId))
}
