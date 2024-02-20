import prisma from '~/server/database/client'

export async function queryNote(sid: string) {
  return await prisma.note.findFirst({
    where: {
      sid,
    },
  })
}

export async function updateNote(id: number, content: string, key?: string) {
  return await prisma.note.update({
    data: {
      content,
      key,
    },
    where: {
      id,
    }
  })
}

export async function createNote(sid: string, author?: number) {
  return await prisma.note.create({ data: {sid, content: '', authorId: author} })
}

export async function deleteNote(sid: string) {
  return await prisma.note.deleteMany({ where: { sid } })
}

export async function getUserNote(ssoId: number, page = 1, limit = 100) {
  return await prisma.note.paginate({
    where: {
      authorId: ssoId,
    },
  }).withPages({
    page,
    limit,
    includePageCount: true,
  })
}

export async function getUserFavourNote(ssoId: number, page = 1, limit = 100) {
  return await prisma.note.paginate({
    include: {
      favourBy: {
        where: {
          userId: ssoId
        }
      }
    },
  }).withPages({
    page,
    limit,
    includePageCount: true,
  })
}
