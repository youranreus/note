-- DropIndex
DROP INDEX `Note_sid_key` ON `note`;

-- AlterTable
ALTER TABLE `note` MODIFY `key` TEXT NOT NULL,
    MODIFY `sid` TEXT NOT NULL;
