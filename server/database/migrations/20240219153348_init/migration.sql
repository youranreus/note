-- AlterTable
ALTER TABLE `note` ADD COLUMN `authorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`ssoId`) ON DELETE SET NULL ON UPDATE CASCADE;
