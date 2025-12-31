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

const currencies = [
    "USD",
    "GBP",
    "EUR",
    "CHF",
    "AUD",
    "NZD",
    "SGD",
    "INR",
    "CAD",
];

export function CurrencyEditModal({
    open,
    previewData,
    onClose,
    onSave,
}: CurrencyEditModalProps) {
    const [rows, setRows] = useState<CurrencyRow[]>([]);

    // Initialize rows when modal opens or previewData changes
    useEffect(() => {
        if (previewData) {
            setRows(previewData.rows);
        }
    }, [previewData]);

    if (!open || !previewData) return null;

    // Handle input change
    const handleChange = (idx: number, field: keyof CurrencyRow, value: string) => {
        const newRows = [...rows];
        newRows[idx][field] = value;
        setRows(newRows);
    };

    const handleSave = async () => {
        const row = rows[0];

        if (!row?.id) return;

        try {
            const res = await fetch(
                `/api/balance-statement/balance-edit?id=${row.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currencyType: row.currencyType,
                        amountFcy: Number(row.amountFcy),
                        rateOffered: Number(row.rate),
                        amountIssuedLkr:
                            Number(row.amountFcy) * Number(row.rate),
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Update failed");
            }

            onSave(rows);

            toast({
                title: "Success",
                description: data.message || "Record updated successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-2xl w-full shadow-xl mx-4">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    Edit Transaction
                </h3>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <p className="text-gray-700 text-sm">
                            <span className="font-semibold text-gray-900">Customer Name:</span>{" "}
                            {previewData.customerName}
                        </p>
                        <p className="text-gray-700 text-sm mt-2">
                            <span className="font-semibold text-gray-900">NIC/Passport:</span>{" "}
                            {previewData.nicPassport}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-700 text-sm">
                            <span className="font-semibold text-gray-900">Date:</span>{" "}
                            {new Date(previewData.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-700 text-sm mt-2">
                            <span className="font-semibold text-gray-900">Sources:</span>{" "}
                            {previewData.sources.join(", ")}
                        </p>
                    </div>
                </div>

                {/* Editable Currency Table */}
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">Currency Details</h4>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 border-b">Type</th>
                                    <th className="px-4 py-2 border-b">Received (FCY)</th>
                                    <th className="px-4 py-2 border-b">Rate</th>
                                    <th className="px-4 py-2 border-b">Issued (LKR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                                        {/* Currency Type as Dropdown */}
                                        <td className="px-4 py-2">
                                            <select
                                                className="border px-2 py-1 rounded w-full"
                                                value={row.currencyType}
                                                onChange={(e) =>
                                                    handleChange(idx, "currencyType", e.target.value)
                                                }
                                            >
                                                <option value="" disabled>
                                                    Select Currency
                                                </option>
                                                {currencies.map((currency) => (
                                                    <option key={currency} value={currency}>
                                                        {currency}
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
                                                value={
                                                    (parseFloat(row.amountFcy) || 0) * (parseFloat(row.rate) || 0)
                                                }

                                                readOnly
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose} className="px-6">
                        Cancel
                    </Button>
                    <Button
                        className="px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-sm"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
