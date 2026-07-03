/*
  Warnings:

  - You are about to drop the column `totalChunks` on the `Repo` table. All the data in the column will be lost.
  - You are about to drop the `CodeChunk` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CodeChunk" DROP CONSTRAINT "CodeChunk_repoId_fkey";

-- AlterTable
ALTER TABLE "Repo" DROP COLUMN "totalChunks",
ADD COLUMN     "totalCommits" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "CodeChunk";
