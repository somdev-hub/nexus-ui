"use client";
import { useEffect, useState } from "react";
import type { SupplierCatalog } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import type { SupplierDashboard, OrderSummary, QuotationSummary } from "@/types/supplier";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getSupplierDashboard } from "@/lib/services/supplier-analytics-service";
import { getSupplierCatalogs } from "@/lib/services/supplier-catalog-service";
import { getSupplierOrders, getOrderSummary } from "@/lib/services/supplier-orders-service";
import { getQuotations, getQuotationSummary } from "@/lib/services/supplier-commercial-service";
import Link from "next/link";
import { toast } from "sonner";
import { IconPackage, IconShoppingCart, IconFileWord, IconChartBar, IconDatabase, IconTruck } from "@tabler/icons-react";

export default function SupplierDashboard() {
 const [dashboard, setDashboard] = useState<SupplierDashboard | null>(null);
 const [catalog, setCatalog] = useState<PaginatedResponse<SupplierCatalog> | null>(null);
 const [orders, setOrders] = useState<OrderSummary | null>(null);
 const [quotations, setQuotations] = useState<QuotationSummary | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  let active = true;
  const load = async () => {
   try {
    const [d, c, o, q] = await Promise.all([
     getSupplierDashboard().catch(() => null),
     getSupplierCatalogs({ page: 0, size: 5 }).catch(() => null),
     getOrderSummary().catch(() => null),
     getQuotationSummary().catch(() => null),
    ]);
    if (!active) return;
    setDashboard(d);
    setCatalog(c);
    setOrders(o);
    setQuotations(q);
   } catch(e: unknown) {
    toast.error(e instanceof Error ? e.message : String(e) || "Failed to load dashboard");
   } finally {
    if (active) setLoading(false);
   }
  };
  load();
  return () => { active = false; };
 }, []);

 if (loading) {
  return (
   <div className="flex flex-1 flex-col gap-4 p-4">
    <div className="grid gap-4 md:grid-cols-4">
     {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
    </div>
    <Skeleton className="h-64" />
   </div>
  );
 }

 const stats = [
  { title: "Catalog Products", value: dashboard?.totalCatalogProducts ?? catalog?.totalElements ?? 0, desc: `${dashboard?.publishedCatalog ?? 0} published`, icon: IconPackage, href: "/supplier/catalog" },
  { title: "Pending Orders", value: dashboard?.pendingAcknowledgement ?? orders?.pendingAck ?? 0, desc: `${dashboard?.totalOrders ?? 0} total orders`, icon: IconShoppingCart, href: "/supplier/orders" },
  { title: "Quotations", value: dashboard?.totalQuotations ?? quotations?.total ?? 0, desc: `${quotations?.sent ?? 0} sent`, icon: IconFileWord, href: "/supplier/quotations" },
  { title: "Capacity", value: dashboard?.totalCapacity ? `${Math.round(dashboard.totalCapacity)}` : "-", desc: `${dashboard?.remainingCapacity ? Math.round(dashboard.remainingCapacity) + " remaining" : ""}`, icon: IconDatabase, href: "/supplier/capacity" },
 ];

 return (
  <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-semibold">Supplier Dashboard</h1>
     <p className="text-sm text-muted-foreground">Manage catalog, orders, capacity and customers</p>
    </div>
    <div className="flex gap-2">
     <Button asChild variant="outline" size="sm"><Link href="/supplier/catalog">Catalog</Link></Button>
     <Button asChild size="sm"><Link href="/supplier/orders">Orders</Link></Button>
    </div>
   </div>

   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {stats.map((s) => (
     <Card className="p-4 gap-2" key={s.title}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
       <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
       <s.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
       <div className="text-2xl font-bold">{s.value}</div>
       <p className="text-xs text-muted-foreground">{s.desc}</p>
       <Button asChild variant="link" className="px-0 text-xs"><Link href={s.href}>View details</Link></Button>
      </CardContent>
     </Card>
    ))}
   </div>

   <div className="grid gap-4 md:grid-cols-2">
    <Card className="p-4 gap-2">
     <CardHeader className="p-0"><CardTitle>Order Fulfillment</CardTitle><CardDescription>Acknowledgement & partial shipments</CardDescription></CardHeader>
     <CardContent className="space-y-2 p-0">
      <div className="flex justify-between"><span className="text-sm">Pending Ack</span><Badge variant="secondary">{dashboard?.pendingAcknowledgement ?? 0}</Badge></div>
      <div className="flex justify-between"><span className="text-sm">Acknowledged</span><Badge>{dashboard?.acknowledgedOrders ?? 0}</Badge></div>
      <div className="flex justify-between"><span className="text-sm">Total Quotations</span><span className="text-sm font-medium">{dashboard?.totalQuotations ?? 0}</span></div>
      <Button asChild variant="outline" size="sm" className="w-full mt-2"><Link href="/supplier/orders">Go to Orders</Link></Button>
     </CardContent>
    </Card>
    <Card className="p-4 gap-2">
     <CardHeader className="p-0"><CardTitle>Capacity</CardTitle><CardDescription>Available vs allocated</CardDescription></CardHeader>
     <CardContent className="space-y-2 p-0">
      <div className="flex justify-between"><span className="text-sm">Total Capacity</span><span className="text-sm font-medium">{dashboard?.totalCapacity ?? 0}</span></div>
      <div className="flex justify-between"><span className="text-sm">Allocated</span><span className="text-sm font-medium">{dashboard?.allocatedCapacity ?? 0}</span></div>
      <div className="flex justify-between"><span className="text-sm">Remaining</span><Badge variant="outline">{dashboard?.remainingCapacity ?? 0}</Badge></div>
      <Button asChild variant="outline" size="sm" className="w-full mt-2"><Link href="/supplier/capacity">Manage Capacity</Link></Button>
     </CardContent>
    </Card>
   </div>

   {catalog?.content?.length ? (
    <Card className="p-4 gap-2">
     <CardHeader className="p-0"><CardTitle>Recent Catalog Items</CardTitle></CardHeader>
     <CardContent className="p-0">
      <div className="space-y-2">
       {catalog.content.slice(0,5).map((c: SupplierCatalog) => (
        <div key={c.catalogId} className="flex items-center justify-between border-b py-2 last:border-0">
         <div><div className="text-sm font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.category} → {c.family} • {c.sku}</div></div>
         <Badge variant={c.isPublished ? "default" : "secondary"}>{c.status}</Badge>
        </div>
       ))}
      </div>
     </CardContent>
    </Card>
   ) : null}
  </div>
 );
}
