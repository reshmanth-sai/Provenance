-- CreateTable
CREATE TABLE "IssuerLookup" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "rawNameHash" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuerLookup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssuerLookup_connectorId_code_idx" ON "IssuerLookup"("connectorId", "code");

-- CreateIndex
CREATE INDEX "IssuerLookup_documentId_idx" ON "IssuerLookup"("documentId");

-- AddForeignKey
ALTER TABLE "IssuerLookup" ADD CONSTRAINT "IssuerLookup_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
