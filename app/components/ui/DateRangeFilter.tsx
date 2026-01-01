"use client";

import { Input } from "./input";
import { Button } from "./button";
import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  loading: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onFilter: () => void;
}

export function DateRangeFilter({
  fromDate,
  toDate,
  loading,
  onFromChange,
  onToChange,
  onFilter,
}: DateRangeFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          From Date
        </label>
        <Input type="date" value={fromDate} onChange={(e) => onFromChange(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          To Date
        </label>
        <Input type="date" value={toDate} onChange={(e) => onToChange(e.target.value)} />
      </div>

      <div className="flex items-end">
        <Button onClick={onFilter} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
          {loading ? "Loading..." : "Filter"}
        </Button>
      </div>
    </div>
  );
}