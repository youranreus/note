import type { PrismaClient } from "@prisma/client";
import type { UserSummary } from "../types/auth.js";

export interface UserService {
  upsertBySsoId(user: UserSummary): Promise<void>;
}

export function createPrismaUserService(client: PrismaClient): UserService {
  return {
    async upsertBySsoId(user) {
      await client.user.upsert({
        where: { ssoId: BigInt(user.ssoId) },
        update: {},
        create: { ssoId: BigInt(user.ssoId) }
      });
    }
  };
}
