import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";
import { toDayDate } from "../../../libs/day";

async function calculateAvailableBalance(currencyType: string, date: Date): Promise<number> {
  const dayDate = toDayDate(date);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(23, 59, 59, 999);

  const beforeDate = new Date(dayDate.getTime() - 86400000);
  beforeDate.setHours(23, 59, 59, 999);

  const openingBalanceRecord = await prisma.currencyOpeningBalance.findFirst({
    where: { currencyType, date: { lte: beforeDate } },
    orderBy: { date: "desc" },
  });

  let balance = Number(openingBalanceRecord?.amount ?? 0);

  const purchases = await prisma.customerReceiptCurrency.aggregate({
    _sum: { amountFcy: true },
    where: { currencyType, receipt: { receiptDate: { lte: dayEnd } } },
  });
  balance += Number(purchases._sum.amountFcy ?? 0);

  const exchangeBuy = await prisma.exchangeTransaction.aggregate({
    _sum: { toAmount: true },
    where: { toCurrency: currencyType, date: { lte: dayEnd } },
  });
  balance += Number(exchangeBuy._sum.toAmount ?? 0);

  const exchangeSell = await prisma.exchangeTransaction.aggregate({
    _sum: { fromAmount: true },
    where: { fromCurrency: currencyType, date: { lte: dayEnd } },
  });
  balance -= Number(exchangeSell._sum.fromAmount ?? 0);

  const sales = await prisma.saleTransaction.aggregate({
    _sum: { amount: true },
    where: { currencyType, date: { lte: dayEnd } },
  });
  balance -= Number(sales._sum.amount ?? 0);

  const deposits = await prisma.depositRecord.aggregate({
    _sum: { amount: true },
    where: { currencyType, date: { lte: dayEnd } },
  });
  balance -= Number(deposits._sum.amount ?? 0);

  return balance;
}

export async function POST(req: NextRequest) {
  try {
    const { currencyType, date, amount } = await req.json();

    if (!currencyType || !date || amount === undefined) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const day = toDayDate(new Date(date));
    const availableBalance = await calculateAvailableBalance(currencyType, day);

    if (depositAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: ${availableBalance.toFixed(2)}, Requested: ${depositAmount.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    await prisma.depositRecord.create({
      data: { currencyType, amount: depositAmount, date: day },
    });

    return NextResponse.json({
      success: true,
      message: "Deposit added successfully",
      depositAmount: depositAmount.toFixed(2),
      newBalance: (availableBalance - depositAmount).toFixed(2),
    });
  } catch (err) {
    console.error("Deposit error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}