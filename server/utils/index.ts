import type { Note } from "@prisma/client";
import { TOKEN_EXPIRED } from "~/constants";

export const transformNote = (note: Note) => {
  return {
    content: note.content,
    sid: note.sid,
    id: note.id,
    locked: !!note.key,
  }
}

export const handleError = (error: any, e: any) => {
  if (error?.data?.code === 20003 && error?.status === 401) {
    return sendError(e, createError({
      statusCode: 401,
      statusMessage: TOKEN_EXPIRED,
    }))
  }
  return sendError(e, createError('Failed to retrieve data!'))
}