"use client";

import { toast } from "../../hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "./button";

interface CurrencyRow {
    id: string;
    currencyType: string;
    amountFcy: string;
    rate: string;
    amountIssuedLkr: string;
}

interface PreviewData {
    customerName: string;
    nicPassport: string;
    date: string;
    sources: string[];
    remarks?: string;
    rows: CurrencyRow[];
}

interface CurrencyEditModalProps {
    open: boolean;
    previewData: PreviewData | null;
    onClose: () => void;
    onSave: (updatedRows: CurrencyRow[]) => void;
}

const currencies = ["USD", "GBP", "EUR", "CHF", "AUD", "NZD", "SGD", "INR", "CAD"];

export function CurrencyEditModal({ open, previewData, onClose, onSave }: CurrencyEditModalProps) {
    const [rows, setRows] = useState<CurrencyRow[]>([]);

    useEffect(() => {
        if (previewData) {
            setRows(previewData.rows);
        }
    }, [previewData]);

    if (!open || !previewData) return null;

    const handleChange = (idx: number, field: keyof CurrencyRow, value: string) => {
        const newRows = [...rows];
        newRows[idx][field] = value;
        setRows(newRows);
    };
    console.log(rows[0])
    const handleSave = async () => {
        const row = rows[0];
        if (!row?.id) return;
        
        try {
            const res = await fetch(`/api/balance-statement/balance-edit?id=${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currencyType: row.currencyType,
                    amountFcy: Number(row.amountFcy),
                    rateOffered: Number(row.rate),
                    amountIssuedLkr: Number(row.amountFcy) * Number(row.rate),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Update failed");
            }

            onSave(rows);
            toast({ title: "Success", description: "Record updated" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-2xl w-full shadow-xl mx-4">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Edit Transaction</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <p className="text-sm">
                            <span className="font-semibold">Customer:</span> {previewData.customerName}
                        </p>
                        <p className="text-sm mt-2">
                            <span className="font-semibold">NIC/Passport:</span> {previewData.nicPassport}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm">
                            <span className="font-semibold">Date:</span> {new Date(previewData.date).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="font-semibold mb-2 text-sm">Currency Details</h4>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2">Type</th>
                                    <th className="px-4 py-2">Received (FCY)</th>
                                    <th className="px-4 py-2">Rate</th>
                                    <th className="px-4 py-2">Issued (LKR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <select
                                                className="border px-2 py-1 rounded w-full"
                                                value={row.currencyType}
                                                onChange={(e) => handleChange(idx, "currencyType", e.target.value)}
                                            >
                                                <option value="">Select</option>
                                                {currencies.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className="border px-2 py-1 rounded w-full"
                                                value={row.amountFcy}
                                                onChange={(e) => handleChange(idx, "amountFcy", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className="border px-2 py-1 rounded w-full"
                                                value={row.rate}
                                                onChange={(e) => handleChange(idx, "rate", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className="border px-2 py-1 rounded w-full bg-gray-100"
                                                value={(parseFloat(row.amountFcy) || 0) * (parseFloat(row.rate) || 0)}
                                                readOnly
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}