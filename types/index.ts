import type { Note } from "@prisma/client";

export enum NoteType {
  LOCAL = 'l',
  ONLINE = 'o',
}

export interface MemoRes extends Omit<Note, 'key'> {
  locked: boolean;
}

export interface MemoData extends Note {
  locked: boolean;
}