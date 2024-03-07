-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_userId1_fkey";

-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_userId2_fkey";

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
