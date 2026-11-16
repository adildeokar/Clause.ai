-- CreateTable
CREATE TABLE "clause_debates" (
    "id" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transcript" JSONB NOT NULL,
    "verdict" JSONB NOT NULL,
    "challengerScore" DOUBLE PRECISION NOT NULL,
    "defenderScore" DOUBLE PRECISION NOT NULL,
    "resilienceScore" DOUBLE PRECISION NOT NULL,
    "winner" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clause_debates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clause_debates_clauseId_createdAt_idx" ON "clause_debates"("clauseId", "createdAt");

-- AddForeignKey
ALTER TABLE "clause_debates" ADD CONSTRAINT "clause_debates_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clause_debates" ADD CONSTRAINT "clause_debates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

