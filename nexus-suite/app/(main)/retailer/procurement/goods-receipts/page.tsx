"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getGoodsReceipts } from "@/lib/services/procurement-extended-service";
import type { GoodsReceipt } from "@/types/procurement";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_COLOR: Record<string,string> = { DRAFT:"bg-gray-100 text-gray-800", RECEIVED:"bg-green-100 text-green-800", RETURNED:"bg-orange-100 text-orange-800", CANCELLED:"bg-red-100 text-red-800" };

export default function GoodsReceiptsPage(){
  const [data,setData]=useState<GoodsReceipt[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  useEffect(()=>{
    let a=true;
    (async()=>{
      try{ const r=await getGoodsReceipts({pageNo:0,pageOffset:20}); if(!a) return; setData(r.content); }catch(e){toast.error(e instanceof Error?e.message:"Failed");}
      finally{ if(a) setIsLoading(false); }
    })();
    return()=>{a=false;};
  },[]);
  if(isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full"/></div>;
  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Goods Receipts</h1><p className="text-muted-foreground">FR-RET-005 · Three-Way Matching</p></div><Button variant="outline" onClick={()=>location.reload()}>Refresh</Button></div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>GR Number</TableHead><TableHead>PO</TableHead><TableHead>Status</TableHead><TableHead>Received</TableHead><TableHead>Delivery Note</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(r=>(
              <TableRow key={r.goodsReceiptId}>
                <TableCell className="font-mono">{r.grNumber}</TableCell>
                <TableCell>{r.poNumber || r.purchaseOrderId}</TableCell>
                <TableCell><Badge className={STATUS_COLOR[r.status]}>{r.status}</Badge></TableCell>
                <TableCell>{r.receivedDate? new Date(r.receivedDate).toLocaleDateString():"—"}</TableCell>
                <TableCell>{r.deliveryNoteNumber||"—"}</TableCell>
              </TableRow>
            ))}
            {data.length===0 && <TableRow><TableCell colSpan={5} className="text-center py-8">No goods receipts</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
