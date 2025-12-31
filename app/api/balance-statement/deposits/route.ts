import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/libs/prisma";
import { toDayDate } from "@/app/libs/day";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get("currency");
    const date = searchParams.get("date");

    console.log("Deposits API called with:", { currency, date });

    if (!currency || !date) {
      return NextResponse.json(
        { error: "Missing parameters: currency and date are required" },
        { status: 400 }
      );
    }

    const startDate = toDayDate(new Date(date));
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    console.log("Searching deposits for date range:", { startDate, endDate });

    const deposits = await prisma.depositRecord.findMany({
      where: {
        currencyType: currency,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${deposits.length} deposits for ${currency}`);

    const serializedDeposits = deposits.map((deposit) => ({
      id: deposit.id.toString(),
      currencyType: deposit.currencyType,
      amount: Number(deposit.amount),
      date: deposit.date.toISOString(),
      createdAt: deposit.createdAt.toISOString(),
    }));

    return NextResponse.json(serializedDeposits);
  } catch (err) {
    console.error("Fetch deposits error:", err);
    return NextResponse.json(
      { error: "Internal server error while fetching deposits" },
      { status: 500 }
    );
  }
}



export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const depositId = searchParams.get("id");

  if (!depositId) {
    return NextResponse.json(
      { error: "Missing deposit id" },
      { status: 400 }
    );
  }

  try {
    // First, get the deposit details before deleting
    const deposit = await prisma.depositRecord.findUnique({
      where: { id: BigInt(depositId) },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      );
    }

    const { currencyType, amount, date } = deposit;
    const depositAmount = Number(amount);

    // Delete the deposit record
    await prisma.depositRecord.delete({
      where: { id: BigInt(depositId) },
    });

    // Recalculate deposits for this day
    const dayDate = toDayDate(date);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Get updated total deposits for this day
    const remainingDepositsAgg = await prisma.depositRecord.aggregate({
      _sum: { amount: true },
      where: { currencyType, date: dayDate },
    });

    const newTotalDeposits = Number(remainingDepositsAgg._sum.amount ?? 0);

    // Get opening balance
    const prevDay = new Date(dayDate.getTime() - 86400000);
    const prevDayDate = toDayDate(prevDay);

    const prevBalance = await prisma.dailyCurrencyBalance.findFirst({
      where: {
        currencyType,
        date: { lte: prevDayDate },
      },
      orderBy: { date: "desc" },
      select: { closingBalance: true },
    });

    const openingBalance = Number(prevBalance?.closingBalance ?? 0);

    // Get purchases for this day
    const purchasesAgg = await prisma.customerReceiptCurrency.aggregate({
      _sum: { amountFcy: true },
      where: {
        currencyType,
        receipt: {
          receiptDate: {
            gte: dayDate,
            lte: dayEnd,
          },
        },
      },
    });

    const purchases = Number(purchasesAgg._sum.amountFcy ?? 0);

    // Get or create daily balance record
    const existingDaily = await prisma.dailyCurrencyBalance.findUnique({
      where: { currencyType_date: { currencyType, date: dayDate } },
    });

    const exchangeBuy = Number(existingDaily?.exchangeBuy ?? 0);
    const exchangeSell = Number(existingDaily?.exchangeSell ?? 0);
    const sales = Number(existingDaily?.sales ?? 0);

    // Calculate new closing balance
    const newClosingBalance =
      openingBalance +
      purchases +
      exchangeBuy -
      exchangeSell -
      sales -
      newTotalDeposits;

    // Update daily balance
    if (existingDaily) {
      await prisma.dailyCurrencyBalance.update({
        where: { id: existingDaily.id },
        data: {
          deposits: newTotalDeposits,
          closingBalance: newClosingBalance,
        },
      });
    }

    // Forward propagation - update all future days
    let currentDay = dayDate;
    let currentClosing = newClosingBalance;

    while (true) {
      const nextDay = new Date(currentDay.getTime() + 86400000);
      const nextDayDate = toDayDate(nextDay);

      const nextDayBalance = await prisma.dailyCurrencyBalance.findUnique({
        where: { currencyType_date: { currencyType, date: nextDayDate } },
      });

      if (!nextDayBalance) break;

      const nextOpening = currentClosing;

      const nextClosing =
        nextOpening +
        Number(nextDayBalance.purchases ?? 0) +
        Number(nextDayBalance.exchangeBuy ?? 0) -
        Number(nextDayBalance.exchangeSell ?? 0) -
        Number(nextDayBalance.sales ?? 0) -
        Number(nextDayBalance.deposits ?? 0);

      await prisma.dailyCurrencyBalance.update({
        where: { id: nextDayBalance.id },
        data: {
          openingBalance: nextOpening,
          closingBalance: nextClosing,
        },
      });

      currentDay = nextDayDate;
      currentClosing = nextClosing;
    }

    return NextResponse.json({
      message: "Deposit deleted and balances recalculated",
      deletedAmount: depositAmount.toFixed(2),
    });
  } catch (error: any) {
    console.error("Delete deposit error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error while deleting deposit" },
      { status: 500 }
    );
  }
}