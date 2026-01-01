import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma";
import { toDayDate } from "../../libs/day";

const CURRENCIES = ["USD", "GBP", "EUR", "CHF", "AUD", "NZD", "SGD", "INR", "CAD"];

async function getOpeningBalance(currencyType: string, date: Date): Promise<number> {
  const ob = await prisma.currencyOpeningBalance.findFirst({
    where: { currencyType, date: { lte: date } },
    orderBy: { date: "desc" },
  });
  return ob ? Number(ob.amount) : 0;
}

async function calculatePurchases(currencyType: string, from: Date, to: Date): Promise<number> {
  const result = await prisma.customerReceiptCurrency.aggregate({
    _sum: { amountFcy: true },
    where: { currencyType, receipt: { receiptDate: { gte: from, lte: to } } },
  });
  return Number(result._sum.amountFcy ?? 0);
}

async function calculateDeposits(currencyType: string, from: Date, to: Date): Promise<number> {
  const result = await prisma.depositRecord.aggregate({
    _sum: { amount: true },
    where: { currencyType, date: { gte: from, lte: to } },
  });
  return Number(result._sum.amount ?? 0);
}

async function calculateExchangeBuy(currencyType: string, from: Date, to: Date): Promise<number> {
  const result = await prisma.exchangeTransaction.aggregate({
    _sum: { toAmount: true },
    where: { toCurrency: currencyType, date: { gte: from, lte: to } },
  });
  return Number(result._sum.toAmount ?? 0);
}

async function calculateExchangeSell(currencyType: string, from: Date, to: Date): Promise<number> {
  const result = await prisma.exchangeTransaction.aggregate({
    _sum: { fromAmount: true },
    where: { fromCurrency: currencyType, date: { gte: from, lte: to } },
  });
  return Number(result._sum.fromAmount ?? 0);
}

async function calculateSales(currencyType: string, from: Date, to: Date): Promise<number> {
  const result = await prisma.saleTransaction.aggregate({
    _sum: { amount: true },
    where: { currencyType, date: { gte: from, lte: to } },
  });
  return Number(result._sum.amount ?? 0);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDateParam = searchParams.get("fromDate");
    const toDateParam = searchParams.get("toDate");

    const today = new Date();
    const fromDate = fromDateParam ? toDayDate(new Date(fromDateParam)) : toDayDate(today);
    const toDate = toDateParam ? toDayDate(new Date(toDateParam)) : toDayDate(today);

    const toEndOfDay = new Date(toDate);
    toEndOfDay.setHours(23, 59, 59, 999);

    const beforeFromDate = new Date(fromDate.getTime() - 86400000);
    beforeFromDate.setHours(23, 59, 59, 999);

    const results = await Promise.all(
      CURRENCIES.map(async (currency) => {
        const explicitOpening = await getOpeningBalance(currency, beforeFromDate);
        const purchasesBeforeFrom = await calculatePurchases(currency, new Date(0), beforeFromDate);
        const depositsBeforeFrom = await calculateDeposits(currency, new Date(0), beforeFromDate);
        const exchangeBuyBeforeFrom = await calculateExchangeBuy(currency, new Date(0), beforeFromDate);
        const exchangeSellBeforeFrom = await calculateExchangeSell(currency, new Date(0), beforeFromDate);
        const salesBeforeFrom = await calculateSales(currency, new Date(0), beforeFromDate);

        const openingBalance =
          explicitOpening +
          purchasesBeforeFrom +
          exchangeBuyBeforeFrom -
          exchangeSellBeforeFrom -
          salesBeforeFrom -
          depositsBeforeFrom;

        const purchases = await calculatePurchases(currency, fromDate, toEndOfDay);
        const deposits = await calculateDeposits(currency, fromDate, toEndOfDay);
        const exchangeBuy = await calculateExchangeBuy(currency, fromDate, toEndOfDay);
        const exchangeSell = await calculateExchangeSell(currency, fromDate, toEndOfDay);
        const sales = await calculateSales(currency, fromDate, toEndOfDay);

        const closingBalance = openingBalance + purchases + exchangeBuy - exchangeSell - sales - deposits;

        return {
          currencyType: currency,
          openingBalance: openingBalance.toFixed(2),
          purchases: purchases.toFixed(2),
          exchangeBuy: exchangeBuy.toFixed(2),
          exchangeSell: exchangeSell.toFixed(2),
          sales: sales.toFixed(2),
          deposits: deposits.toFixed(2),
          closingBalance: closingBalance.toFixed(2),
        };
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("balance-statement error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}