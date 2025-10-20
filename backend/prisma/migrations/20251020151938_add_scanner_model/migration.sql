-- CreateTable
CREATE TABLE "Scanner" (
    "id" SERIAL NOT NULL,
    "assetTicker" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Scanner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Scanner" ADD CONSTRAINT "Scanner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
