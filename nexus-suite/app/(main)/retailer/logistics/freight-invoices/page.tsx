"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFreightInvoices, handoffToPms } from "@/lib/services/freight-invoice-service";
import type { FreightInvoice } from "@/types/freight-invoice";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COLOR: Record<string,string> = { DRAFT:"bg-gray-100 text-gray-800", PENDING_APPROVAL:"bg-yellow-100 text-yellow-800", APPROVED:"bg-blue-100 text-blue-800", SENT_TO_PMS:"bg-purple-100 text-purple-800", PAID:"bg-green-100 text-green-800", DISPUTED:"bg-orange-100 text-orange-800", CANCELLED:"bg-red-100 text-red-800" };

export default function FreightInvoicesPage(){
  const [data,setData]=useState<FreightInvoice[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  const load=async()=>{
    setIsLoading(true);
    try{ const r=await getFreightInvoices({pageNo:0,pageOffset:20}); setData(r.content); }catch(e){toast.error(e instanceof Error?e.message:"Failed");}
    finally{ setIsLoading(false); }
  };
  useEffect(()=>{ load(); },[]);
  const handleHandoff=async(id:number)=>{
    try{ await handoffToPms(id); toast.success("Handed off to PMS"); load(); }catch(e){ toast.error(e instanceof Error?e.message:"Failed"); }
  };
  if(isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full"/></div>;
  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Freight Invoices</h1><p className="text-muted-foreground">PMS settlement handoff · RET-P07 · FR-FIN-005/006</p></div><Button variant="outline" onClick={load}>Refresh</Button></div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Invoice #</TableHead><TableHead>Shipment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead>PMS</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(inv=>(
              <TableRow key={inv.freightInvoiceId}>
                <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.shipmentNumber || inv.shipmentId}</TableCell>
                <TableCell><Badge className={COLOR[inv.status]}>{inv.status}</Badge></TableCell>
                <TableCell className="text-right">{inv.currency} {Number(inv.totalAmount).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{inv.pmsStatus || "NOT_SENT"}</Badge></TableCell>
                <TableCell>
                  {inv.status==="APPROVED" && <Button size="sm" onClick={()=>handleHandoff(inv.freightInvoiceId)}>Handoff to PMS</Button>}
                  {inv.status==="DISPUTED" && <Badge className="bg-orange-100 text-orange-800">Disputed</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {data.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8">No freight invoices</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
