-- CreateTable
CREATE TABLE "TripRate" (
    "id" TEXT NOT NULL,
    "ratePerKm" DOUBLE PRECISION NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "departure" TEXT NOT NULL DEFAULT 'Domicile',
    "destination" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "roundTrip" BOOLEAN NOT NULL DEFAULT false,
    "purpose" TEXT NOT NULL,
    "ratePerKm" DOUBLE PRECISION NOT NULL,
    "indemnity" DOUBLE PRECISION NOT NULL,
    "transactionId" TEXT,
    "tripRateId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripRate_userId_validFrom_idx" ON "TripRate"("userId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_transactionId_key" ON "Trip"("transactionId");

-- CreateIndex
CREATE INDEX "Trip_userId_fiscalYear_idx" ON "Trip"("userId", "fiscalYear");

-- AddForeignKey
ALTER TABLE "TripRate" ADD CONSTRAINT "TripRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_tripRateId_fkey" FOREIGN KEY ("tripRateId") REFERENCES "TripRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
