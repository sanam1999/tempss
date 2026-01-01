import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/libs/prisma";

export async function PATCH(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const currencyId = searchParams.get("id");

    if (!currencyId) {
        return NextResponse.json({ error: "Missing currency id" }, { status: 400 });
    }

    try {
        const body = await req.json();
        await prisma.customerReceiptCurrency.update({
            where: { id: BigInt(currencyId) },
            data: {
                currencyType: body.currencyType,
                amountFcy: body.amountFcy,
                rateOffered: body.rateOffered,
                amountIssuedLkr: body.amountIssuedLkr,
            },
        });
        return NextResponse.json({ message: "Currency updated successfully" });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const currencyId = searchParams.get("id");

    if (!currencyId) {
        return NextResponse.json({ error: "Missing currency id" }, { status: 400 });
    }

    try {
        const currency = await prisma.customerReceiptCurrency.findUnique({
            where: { id: BigInt(currencyId) },
        });

        if (!currency) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const count = await prisma.customerReceiptCurrency.count({
            where: { receiptId: currency.receiptId },
        });

        if (count > 1) {
            await prisma.customerReceiptCurrency.delete({ where: { id: BigInt(currencyId) } });
        } else {
            await prisma.customerReceiptCurrency.delete({ where: { id: BigInt(currencyId) } });
            await prisma.customerReceipt.delete({ where: { id: currency.receiptId } });
        }

        return NextResponse.json({ message: count > 1 ? "Deleted" : "Receipt removed" });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}