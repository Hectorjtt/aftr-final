"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingPayments } from "./pending-payments"
import { QRScanner } from "./qr-scanner"
import { TableDashboard } from "./table-dashboard"
import { AdminTableMap } from "./admin-table-map"

export function AdminPanel({ userId }: { userId: string }) {
  return (
    <Tabs defaultValue="mapa" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-white/5">
        <TabsTrigger value="mapa" className="text-white data-[state=active]:bg-white/10">
          Mapa
        </TabsTrigger>
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
      <TabsContent value="mapa" className="mt-6">
        <AdminTableMap />
      </TabsContent>
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


