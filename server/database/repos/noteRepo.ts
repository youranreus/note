import prisma from '~/server/database/client'

export async function getNote(sid: string) {
  return await prisma.note.findUnique({
    where: {
      sid,
    },
  })
}
