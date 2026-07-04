/*
  Warnings:

  - Added the required column `diffs` to the `Commit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Commit" ADD COLUMN     "diffs" TEXT NOT NULL;
