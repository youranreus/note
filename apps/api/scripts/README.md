# Legacy DB Migration

## Purpose
- `migrate-legacy-memo.ts` migrates the legacy `memo` MySQL dump into the current Prisma schema.
- The script preserves legacy `users.id` and `notes.id`, remaps note authors from legacy `ssoId` to current `users.id`, and converts legacy `note.key` into the current `notes.key_hash`.
- Legacy `noteonusers` relations are imported into `note_favorites`.

## Recommended flow
1. Initialize the current schema:

```sh
pnpm db:init
```

2. Validate the dump before writing:

```sh
pnpm --filter @note/api db:migrate-legacy -- --input ../../db_memo_202604120230002h4b2.sql --validate-only
```

3. Run the import against an empty target database:

```sh
pnpm --filter @note/api db:migrate-legacy -- --input ../../db_memo_202604120230002h4b2.sql
```

If the target database already contains current-system data but is safe to rebuild, clear the
three business tables first during import:

```sh
pnpm --filter @note/api db:migrate-legacy -- --input ../../db_memo_202604120230002h4b2.sql --reset-target
```

## Notes
- The script aborts if `users`, `notes`, or `note_favorites` already contain data.
- `--reset-target` deletes data from `users`, `notes`, and `note_favorites` before importing.
- Use `--allow-non-empty` only if you intentionally want to bypass that guard.
- Imported `created_at` and `updated_at` values for legacy users and notes use the migration run timestamp because the old schema does not store them.
