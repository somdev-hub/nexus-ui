"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRetailerDashboard, getSpendAnalytics, getSupplyChainVisibility } from "@/lib/services/retailer-analytics-service";
import type { DashboardData, SpendAnalytics } from "@/types/retailer-analytics";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export default function AnalyticsPage(){
  const [dashboard,setDashboard]=useState<DashboardData|null>(null);
  const [spend,setSpend]=useState<SpendAnalytics|null>(null);
  const [poId,setPoId]=useState("");
  const [visibility,setVisibility]=useState<any>(null);
  const [isLoading,setIsLoading]=useState(true);

  useEffect(()=>{
    let a=true;
    (async()=>{
      try{
        const [d,s]=await Promise.all([getRetailerDashboard().catch(()=>null), getSpendAnalytics().catch(()=>null)]);
        if(!a) return;
        setDashboard(d); setSpend(s);
      }catch(e){ toast.error(e instanceof Error?e.message:"Failed"); }
      finally{ if(a) setIsLoading(false); }
    })();
    return()=>{a=false;};
  },[]);

  const handleVisibility=async()=>{
    if(!poId) return toast.error("Enter PO ID");
    try{
      const v=await getSupplyChainVisibility(Number(poId));
      setVisibility(v);
    }catch(e){ toast.error(e instanceof Error?e.message:"Failed to load visibility"); }
  };

  if(isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-20 w-full"/><Skeleton className="h-[300px] w-full"/></div>;

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div><h1 className="text-2xl font-bold">Retailer Analytics</h1><p className="text-muted-foreground">Executive dashboard · FR-AN-001 / Spend · FR-AN-002 / Visibility · FR-AN-003</p></div>

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Spend</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${Number(dashboard.totalSpend).toLocaleString()}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Open POs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{dashboard.openPoCount}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Inbound Shipments</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{dashboard.inboundShipmentCount}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">OTIF</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{dashboard.otifPercentage}%</p><p className="text-xs text-muted-foreground">Avg Perf {dashboard.avgSupplierPerformance}%</p></CardContent></Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Inventory Value</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${Number(dashboard.inventoryValue).toLocaleString()}</p><p className="text-xs text-muted-foreground">{dashboard.activePartnerships} active partnerships · {dashboard.totalSuppliers} suppliers</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Bottlenecks</CardTitle></CardHeader><CardContent>
              {dashboard.bottleneckAlerts.length===0 ? <p className="text-sm text-muted-foreground">No bottlenecks</p> : dashboard.bottleneckAlerts.map((b,i)=>(<div key={i} className="flex justify-between py-1 text-sm"><span>{b.type}</span><Badge variant={b.severity==="HIGH"?"destructive":"outline"}>{b.count} · {b.severity}</Badge></div>))}
            </CardContent></Card>
          </div>
          <ChartAreaInteractive />
        </>
      )}

      {spend && (
        <Card>
          <CardHeader><CardTitle>Spend Analytics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div><p className="text-muted-foreground">By Supplier</p>{Object.entries(spend.spendBySupplier).slice(0,5).map(([k,v])=>(<div key={k} className="flex justify-between"><span>{k}</span><span>${Number(v).toLocaleString()}</span></div>))}</div>
              <div><p className="text-muted-foreground">By Category</p>{Object.entries(spend.spendByCategory).slice(0,5).map(([k,v])=>(<div key={k} className="flex justify-between"><span>{k}</span><span>${Number(v).toLocaleString()}</span></div>))}</div>
              <div><p className="text-muted-foreground">By Month</p>{Object.entries(spend.spendByMonth).slice(0,5).map(([k,v])=>(<div key={k} className="flex justify-between"><span>{k}</span><span>${Number(v).toLocaleString()}</span></div>))}</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Total: ${Number(spend.totalSpend).toLocaleString()} · Avg Order ${Number(spend.avgOrderValue).toLocaleString()} · Orders {spend.totalOrders}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Supply Chain Visibility</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input placeholder="Purchase Order ID" value={poId} onChange={e=>setPoId(e.target.value)} className="max-w-xs"/>
            <Button onClick={handleVisibility}>Trace</Button>
          </div>
          {visibility && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div>PO: <span className="font-mono">{visibility.purchaseOrderNumber}</span> <Badge>{visibility.poStatus}</Badge></div>
                <div>Shipment: {visibility.shipmentNumber || "—"} <Badge variant="outline">{visibility.shipmentStatus || "—"}</Badge></div>
                <div>Lead Time: {visibility.totalLeadTimeDays} days</div>
              </div>
              <div>
                <p className="font-medium text-sm mb-2">Milestones</p>
                <Table>
                  <TableHeader className="bg-muted"><TableRow><TableHead>Stage</TableHead><TableHead>Timestamp</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {visibility.milestones?.map((m:any,i:number)=>(<TableRow key={i}><TableCell>{m.stage}</TableCell><TableCell>{m.timestamp ? new Date(m.timestamp).toLocaleString() : "—"}</TableCell><TableCell>{m.status || "—"}</TableCell></TableRow>))}
                  </TableBody>
                </Table>
              </div>
              {visibility.bottlenecks?.length>0 && <div><p className="font-medium text-sm">Bottlenecks</p>{visibility.bottlenecks.map((b:any,i:number)=>(<Badge key={i} variant="destructive" className="mr-2">{b.stage}: {b.delay}</Badge>))}</div>}
              {visibility.trackingTimeline?.length>0 && <div><p className="font-medium text-sm">Tracking</p>{visibility.trackingTimeline.slice(0,5).map((t:any,i:number)=>(<div key={i} className="text-sm py-1 border-b flex justify-between"><span>{t.eventType} · {t.location || ""}</span><span className="text-muted-foreground">{t.timestamp? new Date(t.timestamp).toLocaleString():""}</span></div>))}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
