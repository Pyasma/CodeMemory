/*
  Warnings:

  - You are about to drop the column `diffs` on the `Commit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Commit" DROP COLUMN "diffs";

-- CreateTable
CREATE TABLE "CommitFile" (
    "id" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "additions" INTEGER NOT NULL,
    "deletions" INTEGER NOT NULL,
    "changes" INTEGER NOT NULL,
    "patch" TEXT,

    CONSTRAINT "CommitFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommitFile" ADD CONSTRAINT "CommitFile_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "Commit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
