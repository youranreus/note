import { mysqlTable, varchar, text, int, timestamp, primaryKey } from 'drizzle-orm/mysql-core'

export const notes = mysqlTable('notes', {
  id:        int('id').autoincrement().primaryKey(),
  sid:       varchar('sid', { length: 64 }).notNull().unique(),
  content:   text('content').notNull().$default(() => ''),
  key:       varchar('key', { length: 255 }),
  authorId:  int('author_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
})

export const users = mysqlTable('users', {
  id:        int('id').autoincrement().primaryKey(),
  ssoId:     int('sso_id').unique(),
  email:     varchar('email', { length: 255 }).unique(),
  role:      varchar('role', { length: 20 }).$default(() => 'USER'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const favourites = mysqlTable('favourites', {
  noteId:    int('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  userId:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.noteId, table.userId] }),
])
