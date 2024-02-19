import prisma from '~/server/database/client'

export async function queryUser(ssoId: number) {
  const user = await prisma.user.findFirst({
    where: {
      ssoId,
    }
  })

  if (user) {
    return user
  }

  return await prisma.user.create({
    data: {
      ssoId
    }
  })
}
