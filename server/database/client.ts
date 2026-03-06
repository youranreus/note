import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDB() {
  if (!_db) {
    const pool = mysql.createPool(process.env.DATABASE_URL || '')
    _db = drizzle(pool, { schema, mode: 'default' })
  }
  return _db
}
