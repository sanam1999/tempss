import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");

        let where: any = {};

        if (fromDate && toDate) {
            where.date = {
                gte: new Date(fromDate),
                lte: new Date(toDate),
            };
        }

        const deposits = await prisma.depositRecord.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(
            deposits.map((d) => ({
                id: d.id.toString(),
                currencyType: d.currencyType,
                amount: Number(d.amount),
                date: d.date.toISOString().split("T")[0],
                createdAt: d.createdAt.toISOString(),
            }))
        );
    } catch (err) {
        console.error("Deposit history error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}