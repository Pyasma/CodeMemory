/*
  Warnings:

  - A unique constraint covering the columns `[userId,githubRepoId]` on the table `Repo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Commit" ADD COLUMN     "authorImage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Repo_userId_githubRepoId_key" ON "Repo"("userId", "githubRepoId");
