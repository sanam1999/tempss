
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BookOpen, PieChart, Receipt, Wallet } from "lucide-react";

import { CustomerReceipt } from "../components/customerReceipt/CustomerReceipt";
import { PurchaseRegister } from "../components/purchaseRegister/PurchaseRegister";
import BalanceStatement from "../components/balanceStatement/BalanceStatement";
import DepositHistory from "../components/depositHistory/DepositHistory";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Tabs defaultValue="receipt" className="space-y-6">

        <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto h-auto p-1 bg-muted/50 rounded-lg">

          <TabsTrigger value="receipt" className="relative z-10 flex items-center gap-2 py-3 rounded-full transition-colors duration-300 data-[state=active]:text-primary-foreground data-[state=active]:bg-primary">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Customer Receipt</span>
            <span className="sm:hidden">Receipt</span>
          </TabsTrigger>

          <TabsTrigger value="register" className="relative z-10 flex items-center gap-2 py-3 rounded-full transition-colors duration-300 data-[state=active]:text-primary-foreground data-[state=active]:bg-primary">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Purchase Register</span>
            <span className="sm:hidden">Register</span>
          </TabsTrigger>

          <TabsTrigger value="balance" className="relative z-10 flex items-center gap-2 py-3 rounded-full transition-colors duration-300 data-[state=active]:text-primary-foreground data-[state=active]:bg-primary">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Balance Statement</span>
            <span className="sm:hidden">Balance</span>
          </TabsTrigger>

          <TabsTrigger value="deposit" className="relative z-10 flex items-center gap-2 py-3 rounded-full transition-colors duration-300 data-[state=active]:text-primary-foreground data-[state=active]:bg-primary">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Deposit History</span>
            <span className="sm:hidden">Deposit</span>
          </TabsTrigger>

        </TabsList>

        <TabsContent value="receipt" className="mt-6 data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300">
          <CustomerReceipt />
        </TabsContent>

        <TabsContent value="register" className="mt-6 data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300">
          <PurchaseRegister />
        </TabsContent>

        <TabsContent value="balance" className="mt-6 data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300">
          <BalanceStatement />
        </TabsContent>

        <TabsContent value="deposit" className="mt-6 data-[state=inactive]:hidden data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300">
          <DepositHistory />
        </TabsContent>

      </Tabs>
    </main>
  );
}
