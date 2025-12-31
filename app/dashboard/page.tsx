"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BookOpen, PieChart, Receipt, Wallet } from "lucide-react";

import { CustomerReceipt } from "../components/customerReceipt/CustomerReceipt";
import { PurchaseRegister } from "../components/purchaseRegister/PurchaseRegister";
import BalanceStatement from "../components/balanceStatement/BalanceStatement";
import { DepositHistory } from "../components/depositHistory/DepositHistory"; // example

export default function Home() {
  const [activeTab, setActiveTab] = useState("receipt");

  return (
    <main className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

        <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto h-auto p-1 bg-muted/50">

          <TabsTrigger value="receipt" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Customer Receipt</span>
            <span className="sm:hidden">Receipt</span>
          </TabsTrigger>

          <TabsTrigger value="register" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Purchase Register</span>
            <span className="sm:hidden">Register</span>
          </TabsTrigger>

          <TabsTrigger value="balance" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Balance Statement</span>
            <span className="sm:hidden">Balance</span>
          </TabsTrigger>

          <TabsTrigger value="deposit" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Deposit History</span>
            <span className="sm:hidden">Deposit</span>
          </TabsTrigger>

        </TabsList>

        <TabsContent value="receipt" className="mt-6">
          <CustomerReceipt />
        </TabsContent>

        <TabsContent value="register" className="mt-6">
          <PurchaseRegister />
        </TabsContent>

        <TabsContent value="balance" className="mt-6">
          <BalanceStatement />
        </TabsContent>

        <TabsContent value="deposit" className="mt-6">
          <DepositHistory />
        </TabsContent>

      </Tabs>
    </main>
  );
}
