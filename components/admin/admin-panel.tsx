"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingPayments } from "./pending-payments"
import { QRScanner } from "./qr-scanner"

import { TableDashboard } from "./table-dashboard"

export function AdminPanel({ userId }: { userId: string }) {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-white/5">
        <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-white/10">
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="payments" className="text-white data-[state=active]:bg-white/10">
          Comprobantes
        </TabsTrigger>
        <TabsTrigger value="scanner" className="text-white data-[state=active]:bg-white/10">
          Escáner QR
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-6">
        <TableDashboard />
      </TabsContent>
      <TabsContent value="payments" className="mt-6">
        <PendingPayments />
      </TabsContent>
      <TabsContent value="scanner" className="mt-6">
        <QRScanner userId={userId} />
      </TabsContent>
    </Tabs>
  )
}


