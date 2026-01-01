-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReceipt" (
    "id" BIGSERIAL NOT NULL,
    "permitNo" TEXT NOT NULL DEFAULT 'DEF/RD/6000',
    "serialNumber" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT,
    "nicPassport" TEXT,
    "sourceOfForeignCurrency" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" BIGINT,

    CONSTRAINT "CustomerReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReceiptCurrency" (
    "id" BIGSERIAL NOT NULL,
    "receiptId" BIGINT NOT NULL,
    "currencyType" TEXT NOT NULL,
    "amountFcy" DECIMAL(18,4) NOT NULL,
    "rateOffered" DECIMAL(18,4) NOT NULL,
    "amountIssuedLkr" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "CustomerReceiptCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptPDF" (
    "id" BIGSERIAL NOT NULL,
    "receiptId" BIGINT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptPDF_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositRecord" (
    "id" BIGSERIAL NOT NULL,
    "currencyType" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyOpeningBalance" (
    "id" BIGSERIAL NOT NULL,
    "currencyType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyOpeningBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeTransaction" (
    "id" BIGSERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "fromAmount" DECIMAL(18,4) NOT NULL,
    "toAmount" DECIMAL(18,4) NOT NULL,
    "rate" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleTransaction" (
    "id" BIGSERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currencyType" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReceipt_serialNumber_key" ON "CustomerReceipt"("serialNumber");

-- CreateIndex
CREATE INDEX "CustomerReceiptCurrency_currencyType_receiptId_idx" ON "CustomerReceiptCurrency"("currencyType", "receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptPDF_receiptId_key" ON "ReceiptPDF"("receiptId");

-- CreateIndex
CREATE INDEX "DepositRecord_currencyType_date_idx" ON "DepositRecord"("currencyType", "date");

-- CreateIndex
CREATE INDEX "CurrencyOpeningBalance_currencyType_date_idx" ON "CurrencyOpeningBalance"("currencyType", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyOpeningBalance_currencyType_date_key" ON "CurrencyOpeningBalance"("currencyType", "date");

-- CreateIndex
CREATE INDEX "ExchangeTransaction_fromCurrency_date_idx" ON "ExchangeTransaction"("fromCurrency", "date");

-- CreateIndex
CREATE INDEX "ExchangeTransaction_toCurrency_date_idx" ON "ExchangeTransaction"("toCurrency", "date");

-- CreateIndex
CREATE INDEX "SaleTransaction_currencyType_date_idx" ON "SaleTransaction"("currencyType", "date");

-- AddForeignKey
ALTER TABLE "CustomerReceipt" ADD CONSTRAINT "CustomerReceipt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReceiptCurrency" ADD CONSTRAINT "CustomerReceiptCurrency_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "CustomerReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptPDF" ADD CONSTRAINT "ReceiptPDF_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "CustomerReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
