"use client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupplierPerformances } from "@/lib/services/supplier-performance-service";
import type { SupplierPerformance } from "@/types/supplier-performance";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TIER_COLOR: Record<string,string> = { EXCELLENT:"bg-green-100 text-green-800", GOOD:"bg-blue-100 text-blue-800", AVERAGE:"bg-yellow-100 text-yellow-800", BELOW_AVERAGE:"bg-orange-100 text-orange-800", POOR:"bg-red-100 text-red-800" };

export default function PerformancePage(){
  const [data,setData]=useState<SupplierPerformance[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  useEffect(()=>{
    let a=true;
    (async()=>{
      try{ const r=await getSupplierPerformances({pageNo:0,pageOffset:20}); if(!a) return; setData(r.content); }catch(e){toast.error(e instanceof Error?e.message:"Failed");}
      finally{ if(a) setIsLoading(false); }
    })();
    return()=>{a=false;};
  },[]);
  if(isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full"/></div>;
  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div><h1 className="text-2xl font-bold">Supplier Performance</h1><p className="text-muted-foreground">OTIF · Quality · Lead Time · Responsiveness · FR-RET-022</p></div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Supplier</TableHead><TableHead className="text-right">OTIF</TableHead><TableHead className="text-right">Defect %</TableHead><TableHead className="text-right">Lead Days</TableHead><TableHead className="text-right">Responsiveness</TableHead><TableHead className="text-right">Overall</TableHead><TableHead>Tier</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(p=>(
              <TableRow key={p.performanceId}>
                <TableCell>{p.supplierName || p.supplierId}</TableCell>
                <TableCell className="text-right">{p.otifScore}%</TableCell>
                <TableCell className="text-right">{p.qualityDefectRate}%</TableCell>
                <TableCell className="text-right">{p.avgLeadTimeDays}</TableCell>
                <TableCell className="text-right">{p.responsivenessScore}%</TableCell>
                <TableCell className="text-right font-bold">{p.overallScore}%</TableCell>
                <TableCell><Badge className={TIER_COLOR[p.performanceTier]}>{p.performanceTier}</Badge></TableCell>
              </TableRow>
            ))}
            {data.length===0 && <TableRow><TableCell colSpan={7} className="text-center py-8">No performance records</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
