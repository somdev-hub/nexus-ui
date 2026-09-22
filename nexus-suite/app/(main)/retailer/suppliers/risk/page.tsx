"use client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupplierRisks } from "@/lib/services/supplier-risk-service";
import type { SupplierRisk } from "@/types/supplier-risk";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LEVEL_COLOR: Record<string,string> = { LOW:"bg-green-100 text-green-800", MEDIUM:"bg-yellow-100 text-yellow-800", HIGH:"bg-orange-100 text-orange-800", CRITICAL:"bg-red-100 text-red-800" };
const STATUS_COLOR: Record<string,string> = { OPEN:"bg-blue-100 text-blue-800", IN_PROGRESS:"bg-yellow-100 text-yellow-800", MITIGATED:"bg-green-100 text-green-800", CLOSED:"bg-gray-100 text-gray-600", ESCALATED:"bg-red-100 text-red-800" };

export default function RiskPage(){
  const [data,setData]=useState<SupplierRisk[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  useEffect(()=>{
    let a=true;
    (async()=>{
      try{ const r=await getSupplierRisks({pageNo:0,pageOffset:20}); if(!a) return; setData(r.content); }catch(e){toast.error(e instanceof Error?e.message:"Failed");}
      finally{ if(a) setIsLoading(false); }
    })();
    return()=>{a=false;};
  },[]);
  if(isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full"/></div>;
  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div><h1 className="text-2xl font-bold">Supplier Risk Monitoring</h1><p className="text-muted-foreground">Risk categories & mitigation · FR-RET-024</p></div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Supplier</TableHead><TableHead>Category</TableHead><TableHead>Level</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Score</TableHead><TableHead>Next Review</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(r=>(
              <TableRow key={r.riskId}>
                <TableCell>{r.supplierName || r.supplierId}</TableCell>
                <TableCell><Badge variant="outline">{r.riskCategory}</Badge></TableCell>
                <TableCell><Badge className={LEVEL_COLOR[r.riskLevel]}>{r.riskLevel}</Badge></TableCell>
                <TableCell><Badge className={STATUS_COLOR[r.riskStatus]}>{r.riskStatus}</Badge></TableCell>
                <TableCell className="text-right">{r.riskScore}</TableCell>
                <TableCell>{r.nextReviewDate? new Date(r.nextReviewDate).toLocaleDateString():"—"}</TableCell>
              </TableRow>
            ))}
            {data.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8">No risks</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
