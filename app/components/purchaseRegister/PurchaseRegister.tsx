"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Search } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { CurrencySummary } from "./CurrencySummary";
import { DateRangeFilter } from "../ui/DateRangeFilter";
import { CurrencyEditModal } from "../ui/edit-receipt"

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

export const PurchaseRegister = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseRecord[]>([]);
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PurchaseRecord | null>(null);

  // Fetch purchases function - made reusable with useCallback
  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase-register");
      if (!res.ok) {
        let errorMsg = `HTTP error ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg = errData?.error || errorMsg;
        } catch { }
        throw new Error(errorMsg);
      }

      const text = await res.text();
      const data: PurchaseRecord[] = text ? JSON.parse(text) : [];

      // Sort by serialNumber descending (latest first)
      data.sort((a, b) => parseInt(b.serialNumber) - parseInt(a.serialNumber));

      setPurchases(data);
      setFilteredPurchases(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load purchases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch purchases on mount
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Auto-apply search filter only (not date)
  useEffect(() => {
    const filtered = purchases.filter(
      (purchase) =>
        purchase.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.nicPassport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.serialNumber.includes(searchTerm)
    );

    // Sort by serialNumber descending
    filtered.sort((a, b) => parseInt(b.serialNumber) - parseInt(a.serialNumber));

    setFilteredPurchases(filtered);
  }, [searchTerm, purchases]);

  // Filter by date when clicking Filter button
  const handleFilter = () => {
    setLoading(true);

    let filtered = [...purchases];

    // Apply date range filter
    if (fromDate && toDate) {
      filtered = filtered.filter((purchase) => {
        const purchaseDate = new Date(purchase.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return purchaseDate >= from && purchaseDate <= to;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.nicPassport.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.serialNumber.includes(searchTerm)
      );
    }

    // Sort by serialNumber descending
    filtered.sort((a, b) => parseInt(b.serialNumber) - parseInt(a.serialNumber));

    setFilteredPurchases(filtered);
    setTimeout(() => setLoading(false), 300);
  };

  const totalAmountRs = filteredPurchases.reduce(
    (sum, purchase) =>
      sum +
      purchase.currencies.reduce(
        (s, c) => s + parseFloat(c.amountIssuedLkr || "0"),
        0
      ),
    0
  );

  const handleDeleteRecord = async (id: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete this record?`)) return;

    try {
      const res = await fetch(`/api/balance-statement/balance-edit?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: data.message || "Record deleted successfully",
        });

        // Refetch all data from server to ensure consistency
        await fetchPurchases();
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

  const handleEditRecord = (currencyId: string) => {
    const purchase = purchases.find(p =>
      p.currencies.some(c => c.id === currencyId)
    );
    if (purchase) {
      setSelectedRecord(purchase);
      setIsEditOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    setIsEditOpen(false);
    // Refetch data after edit
    await fetchPurchases();
  };

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
            <p className="text-2xl font-bold text-accent">{totalAmountRs.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
            <p className="text-sm text-muted-foreground">Today&apos;s Date</p>
            <p className="text-2xl font-bold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          loading={loading}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onFilter={handleFilter}
        />

        {/* Purchase Table */}
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
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) =>
                    purchase.currencies.map((currency, index) => (
                      <TableRow
                        key={`${purchase.id}-${currency.id}`}
                        className="hover:bg-muted/30"
                      >
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
                          {(Number(currency.amountFcy || 0) * Number(currency.rate || 0)).toFixed(2)}
                        </TableCell>
                        {index === 0 && (
                          <TableCell
                            rowSpan={purchase.currencies.length}
                            className="text-muted-foreground"
                          >
                            {purchase.remarks}
                          </TableCell>
                        )}
                        <TableCell className="text-muted-foreground flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRecord(currency.id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditRecord(currency.id)}
                            className="gap-2 bg-yellow-500 text-black hover:bg-yellow-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <CurrencySummary purchases={filteredPurchases} />
      </CardContent>

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
        onSave={handleSaveEdit}
      />
    </Card>
  );
};