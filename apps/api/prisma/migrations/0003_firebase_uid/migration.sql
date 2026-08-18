-- AlterTable
ALTER TABLE "identity"."Patron" ADD COLUMN "firebaseUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patron_firebaseUid_key" ON "identity"."Patron"("firebaseUid");
