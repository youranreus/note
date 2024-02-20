import type { Note } from "@prisma/client";

export enum NoteType {
  LOCAL = 'l',
  ONLINE = 'o',
}

export interface MemoRes extends Omit<Note, 'key' | 'authorId'> {
  locked: boolean;
}

export interface MemoData extends Omit<Note, 'authorId'> {
  locked: boolean;
  editing: boolean;
}

export interface PaginationRes<T> {
  data: T[];
  total: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
}