"use client";
import { useEffect, useState } from "react";
import type { SupplierDashboard, CapacitySummary, OrderSummary } from "@/types/supplier";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupplierDashboard } from "@/lib/services/supplier-analytics-service";
import { getCapacitySummary, getCapacities } from "@/lib/services/supplier-capacity-service";
import { getOrderSummary } from "@/lib/services/supplier-orders-service";
import { getQuotationSummary } from "@/lib/services/supplier-commercial-service";
import { toast } from "sonner";

export default function SupplierAnalyticsPage(){
 const [dashboard,setDashboard]=useState<SupplierDashboard | null>(null); const [capacity,setCapacity]=useState<CapacitySummary | null>(null); const [orders,setOrders]=useState<OrderSummary | null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{ (async()=>{ try{ const [d,c,o,q]=await Promise.all([getSupplierDashboard().catch(()=>null), getCapacitySummary().catch(()=>null), getOrderSummary().catch(()=>null), getQuotationSummary().catch(()=>null)]); setDashboard(d); setCapacity(c); setOrders(o); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} })(); },[]);
 if(loading) return <div className="p-6"><Skeleton className="h-64" /></div>;
 return (
  <div className="p-4 lg:p-6 space-y-6">
   <h1 className="text-2xl font-semibold">Supplier Analytics</h1>
   <div className="grid gap-4 md:grid-cols-3">
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Catalog</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{dashboard?.totalCatalogProducts ?? 0}</div><p className="text-xs text-muted-foreground">{dashboard?.publishedCatalog ?? 0} published</p></CardContent></Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Orders</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{dashboard?.totalOrders ?? orders?.total ?? 0}</div><p className="text-xs text-muted-foreground">Pending ack {dashboard?.pendingAcknowledgement ?? 0}</p></CardContent></Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Capacity</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{capacity?.totalRemaining ?? dashboard?.remainingCapacity ?? 0}</div><p className="text-xs text-muted-foreground">Total {dashboard?.totalCapacity ?? 0}</p></CardContent></Card>
   </div>
   <div className="grid gap-4 md:grid-cols-2">
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Order Breakdown</CardTitle><CardDescription>By status</CardDescription></CardHeader><CardContent className="space-y-2 p-0">
     {orders && Object.entries(orders).map(([k,v])=> typeof v==="number" ? <div key={k} className="flex justify-between text-sm"><span>{k}</span><Badge variant="secondary">{String(v)}</Badge></div> : null)}
     {!orders && <div className="text-sm text-muted-foreground">No order data</div>}
    </CardContent></Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Capacity Summary</CardTitle></CardHeader><CardContent className="space-y-2 p-0">
     {capacity && <>
      <div className="flex justify-between text-sm"><span>Available</span><span>{capacity.totalAvailable}</span></div>
      <div className="flex justify-between text-sm"><span>Allocated</span><span>{capacity.totalAllocated}</span></div>
      <div className="flex justify-between text-sm font-medium"><span>Remaining</span><Badge>{capacity.totalRemaining}</Badge></div>
      <div className="text-xs text-muted-foreground">{capacity.periodCount} periods</div>
     </>}
     {!capacity && <div className="text-sm text-muted-foreground">No capacity data</div>}
    </CardContent></Card>
   </div>
  </div>
 );
}
