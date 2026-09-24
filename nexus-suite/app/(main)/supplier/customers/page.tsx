"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCustomerOrders, getCustomerSummary } from "@/lib/services/supplier-commercial-service";
import type { SupplierOrder, CustomerSummary } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { toast } from "sonner";

export default function CustomersPage(){
 const [orders,setOrders]=useState<PaginatedResponse<SupplierOrder> | null>(null); const [summary,setSummary]=useState<CustomerSummary | null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{ (async()=>{ try{ const [o,s]=await Promise.all([getCustomerOrders(undefined,{page:0,size:20}), getCustomerSummary().catch(()=>null)]); setOrders(o); setSummary(s);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : "Failed to load");}finally{ setLoading(false);} })(); },[]);
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <h1 className="text-2xl font-semibold">Customer Portal (Orders / Invoices / Shipments / Returns)</h1>
   <div className="grid gap-4 md:grid-cols-3">
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Total Orders</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{summary?.totalOrders ?? orders?.totalElements ?? 0}</div></CardContent></Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Total Value</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{summary?.totalOrderValue? `$${Math.round(summary.totalOrderValue)}` : "-"}</div></CardContent></Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Open Orders</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{summary?.openOrders ?? 0}</div></CardContent></Card>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Retailer Orders</CardTitle><CardDescription>Supplier view of retailer-facing orders</CardDescription></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>PO</TableHead><TableHead>Buyer</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
      <TableBody>{orders?.content?.map((o: SupplierOrder)=>(<TableRow key={o.purchaseOrderId||o.poNumber}><TableCell className="font-medium">{o.poNumber}</TableCell><TableCell>{o.buyerOrg?.name||o.buyerOrgId||"-"}</TableCell><TableCell><Badge>{o.status}</Badge></TableCell><TableCell>{o.totalAmount?`$${o.totalAmount}`:"-"}</TableCell></TableRow>))}
      {!orders?.content?.length && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No customer orders</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
