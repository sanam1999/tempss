"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { DateRangeFilter } from "../ui/DateRangeFilter";
import { toast } from "@/app/hooks/use-toast";

interface Deposit {
    id: string;
    currencyType: string;
    amount: number;
    date: string;
    createdAt: string;
}

export default function DepositHistory() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const fetchDeposits = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/deposit-history?fromDate=${fromDate}&toDate=${toDate}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDeposits(data);
        } catch (err) {
            toast({ title: "Error", description: "Failed to load deposits", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const today = new Date();
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - 30);
        setFromDate(fromDate.toISOString().split("T")[0]);
        setToDate(today.toISOString().split("T")[0]);
    }, []);


    useEffect(() => {
        if (fromDate && toDate) {
            fetchDeposits();
        }
    }, [fromDate, toDate]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this deposit?")) return;

        try {
            const res = await fetch(`/api/balance-statement/deposits?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Success", description: "Deposit deleted" });
                fetchDeposits();
            }
        } catch {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    return (
        <Card className="shadow-[var(--shadow-medium)]">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
                <CardTitle className="text-2xl">Deposit History</CardTitle>
                <p className="text-sm opacity-90">All deposit transactions</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    loading={loading}
                    onFromChange={setFromDate}
                    onToChange={setToDate}
                    onFilter={fetchDeposits}
                />

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Currency</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deposits.length > 0 ? (
                                deposits.map((deposit) => (
                                    <TableRow key={deposit.id}>
                                        <TableCell>
                                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-semibold">
                                                {deposit.currencyType}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{deposit.amount.toFixed(2)}</TableCell>
                                        <TableCell>{new Date(deposit.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(deposit.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        No deposits found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}