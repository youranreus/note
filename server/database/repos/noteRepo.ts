import prisma from '~/server/database/client'

export async function queryNote(sid: string) {
  return await prisma.note.findFirst({
    where: {
      sid,
    },
    include: {
      favourBy: true,
    }
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
    },
    include: {
      favourBy: true
    },
  })
}

export async function createNote(sid: string, author?: number) {
  return await prisma.note.create({
    data: {sid, content: '', authorId: author},
    include: {
      favourBy: true
    },
  })
}

export async function deleteNote(sid: string) {
  return await prisma.note.deleteMany({ where: { sid } })
}

export async function getUserNote(ssoId: number, page = 1, limit = 100) {
  return await prisma.note.paginate({
    where: {
      authorId: ssoId,
    },
    include: {
      favourBy: true
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
      favourBy: true
    },
    where: {
      favourBy: {
        some: {
          userId: ssoId,
        }
      }
    }
  }).withPages({
    page,
    limit,
    includePageCount: true,
  })
}

export async function userFavourNote(ssoId: number, noteId: number) {
  await prisma.noteOnUsers.create({
    data: {
      noteId,
      userId: ssoId,
      assignedBy: `${ssoId}`
    }
  })

  return true
}

export async function userUnFavourNote(ssoId: number, noteId: number) {
  await prisma.noteOnUsers.delete({
    where: {
      noteId_userId: {
        noteId,
        userId: ssoId,
      }
    }
  })

  return true
}