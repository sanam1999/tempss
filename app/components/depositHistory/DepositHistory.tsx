"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { toast } from "../../hooks/use-toast";
import { DateRangeFilter } from "../ui/DateRangeFilter";


interface DepositRecord {
    id: string;
    currencyType: string;
    amount: number;
    date: string;
    createdAt: string;
}

export const DepositHistory: React.FC = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [deposits, setDeposits] = useState<DepositRecord[]>([]);

    const fetchDepositHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/balance-statement/deposits/deposits-all-data?fromDate=${fromDate}&toDate=${toDate}`
            );

            if (!res.ok) throw new Error("Failed to fetch deposits");

            const data = await res.json();
            setDeposits(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching deposit history:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepositHistory()
    }, []);

    useEffect(() => {
        if (fromDate && toDate) {
            fetchDepositHistory();
        }
    }, [fromDate, toDate]);
    const handleDeleteRecord = async (id: string, date: string): Promise<void> => {

        try {

            if (!confirm(`Are you sure you want to ${id} delete ${new Date(date).toLocaleDateString()} record? `)) return;
            const res = await fetch(`/api/balance-statement/deposits?id=${id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                toast({
                    title: "Success",
                    description: data.message || "Record deleted successfully",
                });


                setDeposits(prev => prev.filter(d => d.id !== id));

            } else {
                toast({
                    title: "Error",
                    description: data.error || "Delete failed",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Network Error",
                description: "Something went wrong",
                variant: "destructive",
            });
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
                    onFilter={() => { }}
                />

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Currency</TableHead>
                                <TableHead >Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {deposits.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-muted-foreground py-6"
                                    >
                                        No deposit records found
                                    </TableCell>
                                </TableRow>
                            )}

                            {deposits.map((deposit) => (
                                <TableRow key={deposit.id} className="hover:bg-muted/30">
                                    <TableCell className="font-semibold">
                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                            {deposit.currencyType}
                                        </span>
                                    </TableCell>

                                    <TableCell className=" font-mono font-semibold">
                                        {Number(deposit.amount).toFixed(2)}
                                    </TableCell>

                                    <TableCell>
                                        {new Date(deposit.date).toLocaleDateString()}
                                    </TableCell>

                                    <TableCell className="text-muted-foreground">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => { handleDeleteRecord(deposit.id, deposit.date) }}
                                            className="gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default DepositHistory;
