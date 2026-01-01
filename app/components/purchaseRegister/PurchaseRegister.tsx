"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Search } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { DateRangeFilter } from "../ui/DateRangeFilter";
import { CurrencyEditModal } from "../ui/edit-receipt";
import { CurrencySummary } from "./CurrencySummary";

interface CurrencyDetail {
  currencyType: string;
  amountFcy: string;
  rate: string;
  amountIssuedLkr: string;
  id: string;
}

interface PurchaseRecord {
  id: string;
  date: string;
  serialNumber: string;
  customerName: string;
  nicPassport: string;
  sourceOfForeignCurrency: string[];
  remarks: string;
  currencies: CurrencyDetail[];
}

const fetchSriLankaTime = async () => {
  const res = await fetch("/api/date");
  if (!res.ok) throw new Error("Error fetching date");
  return res.json();
};

// Helper to get Sri Lanka date string YYYY-MM-DD
export const getSriLankaDateString = async (): Promise<string | null> => {
  try {
    const data = await fetchSriLankaTime();
    return data.date;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const PurchaseRegister = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseRecord[]>([]);
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PurchaseRecord | null>(null);
  const [today, settodaydate] = useState<string>("")


  useEffect(() => {
    const fetchDate = async () => {
      const date = await getSriLankaDateString();
      if (date) {
        setFromDate(date);
        setToDate(date);
        settodaydate(date);
      }
    };
    fetchDate();
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase-register");
      if (!res.ok) throw new Error("Failed to fetch");

      const data: PurchaseRecord[] = await res.json();
      data.sort((a, b) => parseInt(b.serialNumber) - parseInt(a.serialNumber));

      setPurchases(data);
      setFilteredPurchases(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load purchases", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    const filtered = purchases.filter(
      (p) =>
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nicPassport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serialNumber.includes(searchTerm)
    );
    setFilteredPurchases(filtered);
  }, [searchTerm, purchases]);

  const handleDeleteRecord = async (id: string): Promise<void> => {
    if (!confirm("Delete this record?")) return;

    try {
      const res = await fetch(`/api/balance-statement/balance-edit?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Success", description: "Record deleted" });
        await fetchPurchases();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  const handleEditRecord = (record: PurchaseRecord, currency: CurrencyDetail) => {
    if (record && currency) {
      // Create a modified record with only the selected currency
      const modifiedRecord = {
        ...record,
        currencies: [currency] // Pass only the clicked currency
      };
      setSelectedRecord(modifiedRecord);
      setIsEditOpen(true);
    }
  };

  const totalAmount = filteredPurchases.reduce(
    (sum, p) => sum + p.currencies.reduce((s, c) => s + parseFloat(c.amountIssuedLkr || "0"), 0),
    0
  );

  return (
    <Card className="shadow-[var(--shadow-medium)]">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <CardTitle className="text-2xl">Purchase Register</CardTitle>
        <p className="text-sm opacity-90">Complete Transaction History</p>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Search Bar */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Transactions</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, NIC/Passport, or serial number..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold text-primary">{filteredPurchases.length}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground">Total Amount (LKR)</p>
            <p className="text-2xl font-bold text-accent">{totalAmount.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
            <p className="text-sm text-muted-foreground">Today&apos;s Date</p>
            <p className="text-2xl font-bold">{today}</p>
          </div>
        </div>


        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          loading={loading}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onFilter={fetchPurchases}
        />

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Ser. No.</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>NIC/PP No.</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount (FCY)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount (Rs.)</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>

                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) =>
                    purchase.currencies.map((currency, index) => (
                      <TableRow key={`${purchase.id}-${currency.id}`}>
                        {index === 0 && (
                          <>
                            <TableCell rowSpan={purchase.currencies.length}>
                              {new Date(purchase.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell rowSpan={purchase.currencies.length}>
                              {purchase.serialNumber}
                            </TableCell>
                            <TableCell rowSpan={purchase.currencies.length}>
                              {purchase.customerName}
                            </TableCell>
                            <TableCell rowSpan={purchase.currencies.length}>
                              {purchase.nicPassport}
                            </TableCell>
                            <TableCell rowSpan={purchase.currencies.length}>
                              {purchase.sourceOfForeignCurrency
                                .map((src) => {
                                  if (src.toLowerCase() === "other" && purchase.remarks) {
                                    return `Other (${purchase.remarks})`;
                                  }
                                  return src;
                                })
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .join(", ")}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-semibold">
                            {currency.currencyType}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(currency.amountFcy).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(currency.rate).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {parseFloat(currency.amountIssuedLkr).toFixed(2)}
                        </TableCell>
                        {index === 0 && (
                          <TableCell
                            rowSpan={purchase.currencies.length}
                            className="text-muted-foreground"
                          >
                            {purchase.remarks}
                          </TableCell>
                        )}
                        <TableCell className="flex gap-1 text-center">
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(currency.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditRecord(purchase, currency)}
                            className="bg-yellow-500 hover:bg-yellow-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CurrencySummary purchases={filteredPurchases} />
      <CurrencyEditModal
        open={isEditOpen}
        previewData={
          selectedRecord
            ? {
              customerName: selectedRecord.customerName,
              nicPassport: selectedRecord.nicPassport,
              date: selectedRecord.date,
              sources: selectedRecord.sourceOfForeignCurrency,
              remarks: selectedRecord.remarks,
              rows: selectedRecord.currencies,
            }
            : null
        }
        onClose={() => setIsEditOpen(false)}
        onSave={async () => {
          setIsEditOpen(false);
          await fetchPurchases();
        }}
      />
    </Card>
  );
};