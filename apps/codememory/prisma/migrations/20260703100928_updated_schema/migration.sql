/*
  Warnings:

  - You are about to drop the column `userId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the `RepositoryIndex` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Made the column `repoId` on table `Chat` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `githubUrl` to the `Repo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Repo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RepoStatus" AS ENUM ('PENDING', 'INDEXING', 'READY', 'FAILED');

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_repoId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "RepositoryIndex" DROP CONSTRAINT "RepositoryIndex_repoId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "userId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "repoId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "githubUrl" TEXT NOT NULL,
ADD COLUMN     "totalChunks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalFiles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "RepositoryIndex";

-- CreateTable
CREATE TABLE "Commit" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authorName" TEXT,
    "committedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commit_sha_key" ON "Commit"("sha");

-- CreateIndex
CREATE INDEX "Commit_repoId_idx" ON "Commit"("repoId");

-- CreateIndex
CREATE INDEX "Commit_sha_idx" ON "Commit"("sha");

-- CreateIndex
CREATE INDEX "Chat_repoId_idx" ON "Chat"("repoId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
