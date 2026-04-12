import type { AuthenticatedSessionDto } from '@note/shared-types'

import {
  getPrismaClient,
  type PrismaClientLike,
  type PrismaQueryClientLike,
  type PrismaTransactionalClientLike
} from './prisma-client.js'

const userLookupSql = 'SELECT id, sso_id AS ssoId FROM users WHERE sso_id = ? LIMIT 1'
const userInsertSql =
  'INSERT IGNORE INTO users (sso_id, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))'

interface PrismaUserRepositoryOptions {
  getPrismaClient?: () => Promise<PrismaClientLike>
}

export interface UserRecordRow {
  id: number | bigint
  ssoId: number | bigint
}

export interface UserRepository {
  ensureBySsoId(
    ssoId: bigint,
    transactionClient: PrismaTransactionalClientLike
  ): Promise<UserRecordRow>
  findBySsoId(
    ssoId: bigint,
    queryClient?: PrismaQueryClientLike
  ): Promise<UserRecordRow | null>
}

export function normalizeAuthSessionSsoId(
  session: AuthenticatedSessionDto | null
): bigint | null {
  if (!session) {
    return null
  }

  const normalized = session.user.id.trim()

  return /^[0-9]+$/u.test(normalized) ? BigInt(normalized) : null
}

export function toBigInt(value: number | bigint) {
  return typeof value === 'bigint' ? value : BigInt(value)
}

export function createPrismaUserRepository(
  options: PrismaUserRepositoryOptions = {}
): UserRepository {
  const resolvePrismaClient = options.getPrismaClient ?? getPrismaClient

  async function lookupUser(
    ssoId: bigint,
    queryClient?: PrismaQueryClientLike
  ) {
    const prisma = queryClient ?? (await resolvePrismaClient())
    const matchedUsers = await prisma.$queryRawUnsafe<UserRecordRow[]>(
      userLookupSql,
      ssoId.toString()
    )

    return matchedUsers[0] ?? null
  }

  return {
    async ensureBySsoId(ssoId, transactionClient) {
      await transactionClient.$executeRawUnsafe(userInsertSql, ssoId.toString())

      const matchedUser = await lookupUser(ssoId, transactionClient)

      if (!matchedUser) {
        throw new Error(`Unable to resolve user mapping for SSO id "${ssoId.toString()}".`)
      }

      return matchedUser
    },
    findBySsoId(ssoId, queryClient) {
      return lookupUser(ssoId, queryClient)
    }
  }
}
