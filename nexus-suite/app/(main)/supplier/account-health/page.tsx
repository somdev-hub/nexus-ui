"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllAccountHealth, getHealthSummary } from "@/lib/services/supplier-commercial-service";
import type { AccountHealth, AccountHealthSummary } from "@/types/supplier";
import { toast } from "sonner";

export default function AccountHealthPage(){
 const [data,setData]=useState<AccountHealth[] | null>(null); const [summary,setSummary]=useState<AccountHealthSummary | null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{ (async()=>{ try{ const [d,s]=await Promise.all([getAllAccountHealth().catch(()=>[] as AccountHealth[]), getHealthSummary().catch(()=>null)]); setData(Array.isArray(d)? d : []); setSummary(s);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : "Failed to load"); }finally{ setLoading(false);} })(); },[]);
 const list = data ?? [];
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <h1 className="text-2xl font-semibold">Account Health (Payment Behavior / Order Patterns / Credit)</h1>
   <div className="grid gap-4 md:grid-cols-3">
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Total Customers</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{summary?.totalCustomers ?? list.length}</div></CardContent></Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Avg Payment Score</CardTitle></CardHeader><CardContent className="p-0"><div className="text-2xl font-bold">{summary?.avgPaymentScore? Math.round(summary.avgPaymentScore)+ "%":"-"}</div></CardContent></Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm">Authorized View</CardTitle></CardHeader><CardContent className="p-0"><div className="text-xs text-muted-foreground">Only data supplier is authorized to access is displayed (FR-SUP-032)</div></CardContent></Card>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Retailer Accounts</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Buyer</TableHead><TableHead>Orders</TableHead><TableHead>Value</TableHead><TableHead>Payment Score</TableHead><TableHead>Credit</TableHead></TableRow></TableHeader>
      <TableBody>{list.map((h, idx:number)=>(<TableRow key={idx}><TableCell>{h.buyerOrgId||idx+1}</TableCell><TableCell>{h.totalOrders}</TableCell><TableCell>{h.totalOrderValue?`$${Math.round(h.totalOrderValue)}`:"-"}</TableCell><TableCell><Badge variant={h.paymentBehaviorScore>80?"default": h.paymentBehaviorScore>50?"secondary":"destructive"}>{h.paymentBehaviorScore? Math.round(h.paymentBehaviorScore)+"%":"-"}</Badge></TableCell><TableCell><Badge variant="outline">{h.creditUtilization||"-"}</Badge></TableCell></TableRow>))}
      {!list.length && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No account health data</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
