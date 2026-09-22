"use client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStockMovements } from "@/lib/services/stock-service";
import type { StockMovement } from "@/types/stock";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function MovementsPage() {
  const [data, setData] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const res = await getStockMovements({ pageNo:0, pageOffset:20 });
        if(!active) return;
        setData(res.content);
      }catch(e){ toast.error(e instanceof Error?e.message:"Failed to load movements"); } finally{ if(active) setIsLoading(false); }
    })();
    return()=>{ active=false; };
  },[]);

  if(isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full"/></div>;

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div><h1 className="text-2xl font-bold">Stock Movements</h1><p className="text-muted-foreground">Audit trail · FR-RET-013 (batch/expiry tracked)</p></div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Type</TableHead><TableHead>Qty</TableHead><TableHead>Before → After</TableHead><TableHead>Reference</TableHead><TableHead>Batch</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(m=>(
              <TableRow key={m.movementId}>
                <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                <TableCell>{m.quantity}</TableCell>
                <TableCell>{m.quantityBefore} → {m.quantityAfter}</TableCell>
                <TableCell>{m.referenceType} #{m.referenceId}</TableCell>
                <TableCell>{m.batchNumber || "—"}</TableCell>
                <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {data.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8">No movements</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
