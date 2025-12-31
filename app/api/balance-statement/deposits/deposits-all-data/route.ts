import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/libs/prisma";
import { toDayDate } from "@/app/libs/day";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fromDateParam = searchParams.get("fromDate"); // optional
        const toDateParam = searchParams.get("toDate");     // optional

        console.log("Deposits API called with:", { fromDateParam, toDateParam });

        let whereFilter: any = {};

        // filter by date range if provided
        if (fromDateParam || toDateParam) {
            const startDate = fromDateParam ? toDayDate(new Date(fromDateParam)) : new Date("1970-01-01");
            const endDate = toDateParam ? new Date(toDayDate(new Date(toDateParam))) : new Date();
            endDate.setHours(23, 59, 59, 999);

            whereFilter.date = {
                gte: startDate,
                lte: endDate,
            };

            console.log("Filtering by date range:", { startDate, endDate });
        }

        const deposits = await prisma.depositRecord.findMany({
            where: whereFilter,
            orderBy: { createdAt: "desc" },
        });

        const serializedDeposits = deposits.map((deposit) => ({
            id: deposit.id.toString(),
            currencyType: deposit.currencyType,
            amount: Number(deposit.amount),
            date: deposit.date.toISOString(),
            createdAt: deposit.createdAt.toISOString(),
        }));

        return NextResponse.json(serializedDeposits);
    } catch (error) {
        console.error("Fetch deposits error:", error);
        return NextResponse.json(
            { error: "Internal server error while fetching deposits" },
            { status: 500 }
        );
    }
}


