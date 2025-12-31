import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/libs/prisma";
import { toDayDate } from "@/app/libs/day";
export async function PATCH(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const currencyId = searchParams.get("id");

    if (!currencyId) {
        return NextResponse.json({ error: "Missing currency id" }, { status: 400 });
    }

    const body = await req.json();

    try {
        // Get the existing currency record to find the receipt date
        const existingCurrency = await prisma.customerReceiptCurrency.findUnique({
            where: { id: BigInt(currencyId) },
            include: { receipt: true },
        });

        if (!existingCurrency) {
            return NextResponse.json(
                { error: "Currency record not found" },
                { status: 404 }
            );
        }

        const oldAmount = Number(existingCurrency.amountFcy);
        const newAmount = Number(body.amountFcy);
        const currencyType = body.currencyType;
        const receiptDate = existingCurrency.receipt.receiptDate;

        // Update the currency record
        await prisma.customerReceiptCurrency.update({
            where: { id: BigInt(currencyId) },
            data: {
                currencyType: body.currencyType,
                amountFcy: body.amountFcy,
                rateOffered: body.rateOffered,
                amountIssuedLkr: body.amountIssuedLkr,
            },
        });

        // Recalculate daily balance for the receipt date
        const dayDate = toDayDate(receiptDate);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);

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

        // Recalculate total purchases for this day
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

        // Get existing daily record
        const existingDaily = await prisma.dailyCurrencyBalance.findUnique({
            where: { currencyType_date: { currencyType, date: dayDate } },
        });

        if (existingDaily) {
            const exchangeBuy = Number(existingDaily.exchangeBuy ?? 0);
            const exchangeSell = Number(existingDaily.exchangeSell ?? 0);
            const sales = Number(existingDaily.sales ?? 0);
            const deposits = Number(existingDaily.deposits ?? 0);

            const newClosingBalance =
                openingBalance +
                purchases +
                exchangeBuy -
                exchangeSell -
                sales -
                deposits;

            // Update daily balance
            await prisma.dailyCurrencyBalance.update({
                where: { id: existingDaily.id },
                data: {
                    purchases,
                    closingBalance: newClosingBalance,
                },
            });

            // Forward propagation
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
        }

        return NextResponse.json({
            message: "Currency updated and balances recalculated successfully",
        });
    } catch (error) {
        console.error("Update currency error:", error);
        return NextResponse.json(
            { error: "Failed to update currency" },
            { status: 500 }
        );
    }
}


export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const currencyId = searchParams.get("id");

    if (!currencyId) {
        return NextResponse.json({ error: "Missing currency id" }, { status: 400 });
    }

    try {
        // Get currency details before deletion
        const currency = await prisma.customerReceiptCurrency.findUnique({
            where: { id: BigInt(currencyId) },
            include: { receipt: true },
        });

        if (!currency) {
            return NextResponse.json({ error: "Currency not found" }, { status: 404 });
        }

        const currencyType = currency.currencyType;
        const receiptDate = currency.receipt.receiptDate;

        // Count how many currencies for this receipt
        const count = await prisma.customerReceiptCurrency.count({
            where: { receiptId: currency.receiptId },
        });

        if (count > 1) {
            // Delete only this currency
            await prisma.customerReceiptCurrency.delete({
                where: { id: BigInt(currencyId) },
            });
        } else {
            // Delete the last currency first
            await prisma.customerReceiptCurrency.delete({
                where: { id: BigInt(currencyId) },
            });

            // Then delete the receipt
            await prisma.customerReceipt.delete({
                where: { id: currency.receiptId },
            });
        }

        // Recalculate daily balance for the receipt date
        const dayDate = toDayDate(receiptDate);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);

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

        // Recalculate total purchases for this day (after deletion)
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

        // Get existing daily record
        const existingDaily = await prisma.dailyCurrencyBalance.findUnique({
            where: { currencyType_date: { currencyType, date: dayDate } },
        });

        if (existingDaily) {
            const exchangeBuy = Number(existingDaily.exchangeBuy ?? 0);
            const exchangeSell = Number(existingDaily.exchangeSell ?? 0);
            const sales = Number(existingDaily.sales ?? 0);
            const deposits = Number(existingDaily.deposits ?? 0);

            const newClosingBalance =
                openingBalance +
                purchases +
                exchangeBuy -
                exchangeSell -
                sales -
                deposits;

            // Update daily balance
            await prisma.dailyCurrencyBalance.update({
                where: { id: existingDaily.id },
                data: {
                    purchases,
                    closingBalance: newClosingBalance,
                },
            });

            // Forward propagation
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
        }

        return NextResponse.json({
            message: count > 1 ? "Currency record deleted" : "Last currency deleted, receipt removed",
        });
    } catch (error) {
        console.error("Delete currency error:", error);
        return NextResponse.json(
            { error: "Failed to delete currency" },
            { status: 500 }
        );
    }
}
