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

export async function createNote(sid: string) {
  return await prisma.note.create({ data: {sid, content: ''} })
}

export async function deleteNote(sid: string) {
  return await prisma.note.deleteMany({ where: { sid } })
}
