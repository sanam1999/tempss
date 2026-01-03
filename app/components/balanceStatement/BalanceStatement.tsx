// ============================================
// FILE: app/components/balanceStatement/BalanceStatement.tsx
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { DateRangeFilter } from "../ui/DateRangeFilter";
import { generateBalanceStatementPDF } from "./pdfGenerator";
import { toast } from "@/app/hooks/use-toast";
import { Calendar } from "lucide-react";

interface CurrencyBalance {
  currencyType: string;
  openingBalance: string;
  purchases: string;
  exchangeBuy: string;
  exchangeSell: string;
  sales: string;
  deposits: string;
  closingBalance: string;
}

const fetchSriLankaTime = async () => {
  const res = await fetch("/api/date");
  if (!res.ok) throw new Error("Error fetching date");
  return res.json();
};

export const getSriLankaDateString = async (): Promise<string | null> => {
  try {
    const data = await fetchSriLankaTime();
    return data.date;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export default function BalanceStatement() {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [depositInputs, setDepositInputs] = useState<Record<string, string>>({});
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [depositDate, setDepositDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchBalanceData = useCallback(async () => {
    if (!fromDate || !toDate) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/balance-statement?fromDate=${fromDate}&toDate=${toDate}&_t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const response = await res.json();
      const data: CurrencyBalance[] = Array.isArray(response) ? response : [];
      setBalances(data);
    } catch (err) {
      console.error("Error:", err);
      toast({ title: "Error", description: "Failed to fetch balances", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const visibleBalances = balances.filter((b) => {
    const hasTransactions = ["purchases", "exchangeBuy", "exchangeSell", "sales", "deposits"].some(
      (field) => parseFloat(b[field as keyof CurrencyBalance] || "0") !== 0
    );
    const hasOpening = parseFloat(b.openingBalance || "0") !== 0;
    return hasOpening || hasTransactions;
  });

  useEffect(() => {
    const fetchDate = async () => {
      const date = await getSriLankaDateString();
      if (date) {
        setFromDate(date);
        setToDate(date);
      }
    };
    fetchDate();
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchBalanceData();
    }
  }, [fromDate, toDate, refreshKey, fetchBalanceData]);

  const handleSaveDeposit = async () => {
    if (!selectedCurrency) return;

    const amount = parseFloat(depositInputs[selectedCurrency] || "");
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter valid deposit amount", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/balance-statement/update-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currencyType: selectedCurrency, date: depositDate, amount }),
      });
     
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Deposit added" });
      setDepositInputs((prev) => ({ ...prev, [selectedCurrency]: "" }));
      setSelectedCurrency("");
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Balance Statement</CardTitle>
            <p className="text-sm opacity-90">Multi-Currency Inventory Dashboard</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((p) => p + 1)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          loading={loading}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onFilter={fetchBalanceData}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Currency</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Choose currency</option>
                    {visibleBalances.map((b) => (
                      <option key={b.currencyType} value={b.currencyType}>
                        {b.currencyType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Deposit Amount</label>
                  <Input
                    type="number"
                    value={selectedCurrency ? depositInputs[selectedCurrency] || "" : ""}
                    onChange={(e) =>
                      setDepositInputs((prev) => ({ ...prev, [selectedCurrency]: e.target.value }))
                    }
                    className="text-right font-mono"
                    placeholder="0.00"
                    disabled={!selectedCurrency}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    From Date
                  </label>
                  <Input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
                </div>
              </div>
              <Button variant="default" onClick={handleSaveDeposit} disabled={!selectedCurrency}>
                Add Deposit
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Currency</TableHead>
                  <TableHead className="text-right">Opening (a)</TableHead>
                  <TableHead className="text-right">Purchases (b)</TableHead>
                  <TableHead className="text-right">Ex-Buy (c)</TableHead>
                  <TableHead className="text-right">Ex-Sell (d)</TableHead>
                  <TableHead className="text-right">Sales (e)</TableHead>
                  <TableHead className="text-right">Deposits (f)</TableHead>
                  <TableHead className="text-right font-semibold">Closing</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleBalances.length > 0 ? (
                  visibleBalances.map((balance) => (
                    <TableRow key={balance.currencyType} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                          {balance.currencyType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{balance.openingBalance}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{balance.purchases}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{balance.exchangeBuy}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">{balance.exchangeSell}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">{balance.sales}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{balance.deposits}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {balance.closingBalance}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {loading ? "Loading..." : "No data available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => generateBalanceStatementPDF({ fromDate, toDate, balances: visibleBalances })}
            disabled={visibleBalances.length === 0 || loading}
          >
            Download Report
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Formula:</span> (a) + (b) + (c) - (d) - (e) - (f) = Closing Balance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}