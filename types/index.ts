import type { Note } from 'drizzle-orm/mysql-core'

export enum NoteType {
  LOCAL = 'l',
  ONLINE = 'o',
}

export interface MemoRes {
  id: number
  sid: string
  content: string
  locked: boolean
  favoured: boolean
}

export interface MemoData extends MemoRes {
  key: string
  editing: boolean
}

export interface PaginationRes<T> {
  data: T[]
  total: number
}

export interface PaginationData {
  page: number
  limit: number
  total: number
}

export interface UserInfo {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
}
