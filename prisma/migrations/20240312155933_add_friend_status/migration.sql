/*
  Warnings:

  - Added the required column `status` to the `Friends` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Friends" ADD COLUMN     "status" TEXT NOT NULL;
