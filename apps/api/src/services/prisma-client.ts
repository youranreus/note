export interface PrismaQueryClientLike {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>
}

export interface PrismaTransactionalClientLike extends PrismaQueryClientLike {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>
}

export interface PrismaClientLike extends PrismaTransactionalClientLike {
  $transaction<T>(
    callback: (transactionClient: PrismaTransactionalClientLike) => Promise<T>
  ): Promise<T>
}

interface PrismaModuleLike {
  PrismaClient?: new () => PrismaClientLike
  default?: {
    PrismaClient?: new () => PrismaClientLike
  }
}

let prismaClientPromise: Promise<PrismaClientLike> | undefined

export async function getPrismaClient() {
  if (!prismaClientPromise) {
    prismaClientPromise = import('@prisma/client').then((module) => {
      const prismaModule = module as PrismaModuleLike
      const PrismaClientConstructor =
        prismaModule.PrismaClient ?? prismaModule.default?.PrismaClient

      if (!PrismaClientConstructor) {
        throw new Error(
          'PrismaClient is unavailable. Run pnpm --filter @note/api db:init to generate the client.'
        )
      }

      return new PrismaClientConstructor()
    })
  }

  return prismaClientPromise
}
