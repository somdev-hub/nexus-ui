"use client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInvoices } from "@/lib/services/procurement-extended-service";
import type { Invoice } from "@/types/procurement";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COLOR: Record<string,string> = { DRAFT:"bg-gray-100 text-gray-800", PENDING_APPROVAL:"bg-yellow-100 text-yellow-800", APPROVED:"bg-blue-100 text-blue-800", REJECTED:"bg-red-100 text-red-800", PAID:"bg-green-100 text-green-800", CANCELLED:"bg-gray-100 text-gray-600 line-through" };

export default function InvoicesPage(){
  const [data,setData]=useState<Invoice[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  useEffect(()=>{
    let a=true;
    (async()=>{
      try{ const r=await getInvoices({pageNo:0,pageOffset:20}); if(!a) return; setData(r.content); }catch(e){toast.error(e instanceof Error?e.message:"Failed");}
      finally{ if(a) setIsLoading(false); }
    })();
    return()=>{a=false;};
  },[]);
  if(isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full"/></div>;
  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-muted-foreground">Supplier invoices · FR-FIN-001 / FR-RET-005</p></div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Invoice #</TableHead><TableHead>PO</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Invoice Date</TableHead><TableHead>Due</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(i=>(
              <TableRow key={i.invoiceId}>
                <TableCell className="font-mono">{i.invoiceNumber}</TableCell>
                <TableCell>{i.poNumber || i.purchaseOrderId}</TableCell>
                <TableCell><Badge className={COLOR[i.status]}>{i.status}</Badge></TableCell>
                <TableCell className="text-right">{i.currency} {Number(i.totalAmount).toLocaleString()}</TableCell>
                <TableCell>{i.invoiceDate? new Date(i.invoiceDate).toLocaleDateString():"—"}</TableCell>
                <TableCell>{i.dueDate? new Date(i.dueDate).toLocaleDateString():"—"}</TableCell>
              </TableRow>
            ))}
            {data.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8">No invoices</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
