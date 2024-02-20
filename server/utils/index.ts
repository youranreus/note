import type { Note } from "@prisma/client";

export const transformNote = (note: Note) => {
  return {
    content: note.content,
    sid: note.sid,
    id: note.id,
    locked: !!note.key,
  }
}