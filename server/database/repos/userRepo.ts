import { eq } from 'drizzle-orm'
import { useDB } from '../client'
import { users } from '../schema'

export async function findOrCreateUser(ssoId: number, email: string) {
  const db = useDB()
  let user = await db.query.users.findFirst({ where: eq(users.ssoId, ssoId) })
  if (!user) {
    await db.insert(users).values({ ssoId, email })
    user = await db.query.users.findFirst({ where: eq(users.ssoId, ssoId) })
  }
  return user!
}
