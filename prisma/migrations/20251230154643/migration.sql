-- DropForeignKey
ALTER TABLE "public"."CustomerReceiptCurrency" DROP CONSTRAINT "CustomerReceiptCurrency_receiptId_fkey";

-- AlterTable
ALTER TABLE "CustomerReceiptCurrency" ALTER COLUMN "amountFcy" DROP DEFAULT,
ALTER COLUMN "amountFcy" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "rateOffered" DROP DEFAULT,
ALTER COLUMN "rateOffered" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "amountIssuedLkr" DROP DEFAULT,
ALTER COLUMN "amountIssuedLkr" SET DATA TYPE DECIMAL(65,30);

-- AddForeignKey
ALTER TABLE "CustomerReceiptCurrency" ADD CONSTRAINT "CustomerReceiptCurrency_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "CustomerReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
