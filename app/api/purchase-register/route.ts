import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma";

export async function GET(req: NextRequest) {
  try {
    const receipts = await prisma.customerReceipt.findMany({
      include: { currencies: true },
      orderBy: { serialNumber: "desc" },
      take: 100,
    });

    const formatted = receipts.map((receipt) => ({
      id: receipt.id.toString(),
      date: receipt.receiptDate.toISOString(),
      serialNumber: receipt.serialNumber,
      customerName: receipt.customerName || "",
      nicPassport: receipt.nicPassport || "",
      sourceOfForeignCurrency: receipt.sourceOfForeignCurrency?.split(", ") || [],
      remarks: receipt.remarks || "",
      currencies: receipt.currencies.map((c) => ({
        id: c.id.toString(),
        currencyType: c.currencyType,
        amountFcy: Number(c.amountFcy).toFixed(2),
        rate: Number(c.rateOffered).toFixed(2),
        amountIssuedLkr: Number(c.amountIssuedLkr).toFixed(2),
      })),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Purchase register error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}