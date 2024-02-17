import prisma from '~/server/database/client'

export async function queryNote(sid: string) {
  return await prisma.note.findFirst({
    where: {
      sid,
    },
  })
}
