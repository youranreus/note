-- Ensure the foreign key can stop depending on idx_user_created
-- before Prisma recreates that composite pagination index.
SET @table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'note_favorites'
);

SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'note_favorites'
    AND index_name = 'idx_user'
);

SET @sql := IF(
  @table_exists = 1 AND @index_exists = 0,
  'CREATE INDEX `idx_user` ON `note_favorites`(`user_id`)',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
