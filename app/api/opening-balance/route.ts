import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../libs/prisma";
import { toDayDate } from "../../libs/day";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const currency = searchParams.get("currency");
        const date = searchParams.get("date");

        let where: any = {};
        if (currency) where.currencyType = currency;
        if (date) where.date = toDayDate(new Date(date));

        const balances = await prisma.currencyOpeningBalance.findMany({
            where,
            orderBy: [{ currencyType: "asc" }, { date: "desc" }],
        });

        return NextResponse.json(
            balances.map((b) => ({
                id: b.id.toString(),
                currencyType: b.currencyType,
                date: b.date.toISOString().split("T")[0],
                amount: Number(b.amount),
            }))
        );
    } catch (err) {
        console.error("GET error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { currencyType, date, amount } = await req.json();

        if (!currencyType || !date || amount === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const dateObj = toDayDate(new Date(date));

        const balance = await prisma.currencyOpeningBalance.upsert({
            where: { currencyType_date: { currencyType, date: dateObj } },
            update: { amount: Number(amount), updatedAt: new Date() },
            create: { currencyType, date: dateObj, amount: Number(amount) },
        });

        return NextResponse.json({
            success: true,
            message: "Opening balance set",
            data: {
                id: balance.id.toString(),
                currencyType: balance.currencyType,
                date: balance.date.toISOString().split("T")[0],
                amount: Number(balance.amount),
            },
        });
    } catch (err) {
        console.error("POST error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        await prisma.currencyOpeningBalance.delete({ where: { id: BigInt(id) } });
        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (err: any) {
        console.error("DELETE error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}