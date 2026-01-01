import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/libs/prisma";
import { toDayDate } from "@/app/libs/day";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const currency = searchParams.get("currency");
        const date = searchParams.get("date");

        if (!currency || !date) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const startDate = toDayDate(new Date(date));
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        const deposits = await prisma.depositRecord.findMany({
            where: { currencyType: currency, date: { gte: startDate, lte: endDate } },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(
            deposits.map((d) => ({
                id: d.id.toString(),
                currencyType: d.currencyType,
                amount: Number(d.amount),
                date: d.date.toISOString(),
                createdAt: d.createdAt.toISOString(),
            }))
        );
    } catch (err) {
        console.error("Fetch deposits error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get("id");

    if (!depositId) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    try {
        const deposit = await prisma.depositRecord.findUnique({ where: { id: BigInt(depositId) } });
        if (!deposit) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.depositRecord.delete({ where: { id: BigInt(depositId) } });
        return NextResponse.json({ message: "Deleted", deletedAmount: Number(deposit.amount).toFixed(2) });
    } catch (error: any) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}