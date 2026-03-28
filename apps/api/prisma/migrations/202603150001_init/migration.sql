CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sso_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `users_sso_id_key`(`sso_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sid` VARCHAR(64) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `key_hash` VARCHAR(255) NULL,
  `author_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  UNIQUE INDEX `notes_sid_key`(`sid`),
  INDEX `idx_author_updated`(`author_id`, `updated_at` DESC),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `note_favorites` (
  `note_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` BIGINT UNSIGNED NULL,
  INDEX `idx_user_created`(`user_id`, `created_at` DESC),
  INDEX `idx_note`(`note_id`),
  PRIMARY KEY (`note_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `notes`
ADD CONSTRAINT `notes_author_id_fkey`
FOREIGN KEY (`author_id`) REFERENCES `users`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `note_favorites`
ADD CONSTRAINT `note_favorites_note_id_fkey`
FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `note_favorites`
ADD CONSTRAINT `note_favorites_user_id_fkey`
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
