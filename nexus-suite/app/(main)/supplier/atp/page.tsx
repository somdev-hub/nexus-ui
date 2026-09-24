"use client";
import { useState } from "react";
import type { AtpCatalogResponse, AtpProductLineResponse } from "@/types/supplier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getAtpForCatalog, getAtpForProductLine } from "@/lib/services/supplier-capacity-service";
import { toast } from "sonner";

export default function AtpPage(){
 const [catalogId,setCatalogId]=useState(""); const [qty,setQty]=useState(""); const [result,setResult]=useState<AtpCatalogResponse | null>(null);
 const [productLine,setProductLine]=useState(""); const [plResult,setPlResult]=useState<AtpProductLineResponse | null>(null);

 const fetchAtp=async()=>{
  try{ const r=await getAtpForCatalog(Number(catalogId), qty?Number(qty):undefined); setResult(r); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); }
 };
 const fetchPl=async()=>{
  try{ const r=await getAtpForProductLine(productLine||undefined); setPlResult(r); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); }
 };

 return (
  <div className="p-4 lg:p-6 space-y-6">
   <h1 className="text-2xl font-semibold">Available-to-Promise (Inventory + Capacity)</h1>
   <div className="grid gap-6 md:grid-cols-2">
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>ATP by Catalog</CardTitle></CardHeader>
     <CardContent className="space-y-3 p-0">
      <div><Label>Catalog ID</Label><Input value={catalogId} onChange={e=>setCatalogId(e.target.value)} /></div>
      <div><Label>Requested Qty</Label><Input value={qty} onChange={e=>setQty(e.target.value)} type="number" /></div>
      <Button onClick={fetchAtp}>Check ATP</Button>
      {result && (
       <div className="space-y-2 pt-2 text-sm">
        <div className="flex justify-between"><span>Inventory</span><Badge variant="outline">{result.inventoryAvailable}</Badge></div>
        <div className="flex justify-between"><span>Capacity</span><Badge variant="outline">{result.capacityAvailable}</Badge></div>
        <div className="flex justify-between font-medium"><span>ATP Total</span><span>{result.atpQuantity}</span></div>
        <div className="flex justify-between"><span>Can Fulfill</span><Badge variant={result.canFulfill?"default":"destructive"}>{String(result.canFulfill)}</Badge></div>
        {result.shortage>0 && <div className="text-xs text-destructive">Shortage: {result.shortage}</div>}
       </div>
      )}
     </CardContent>
    </Card>
    <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>ATP by Product Line</CardTitle></CardHeader>
     <CardContent className="space-y-3 p-0">
      <div><Label>Product Line</Label><Input value={productLine} onChange={e=>setProductLine(e.target.value)} placeholder="Electronics" /></div>
      <Button onClick={fetchPl}>Check</Button>
      {plResult && (
       <div className="space-y-2 pt-2 text-sm">
        <div className="flex justify-between"><span>Capacity ATP</span><span>{plResult.capacityAtp}</span></div>
        <div className="flex justify-between"><span>Inventory</span><span>{plResult.inventoryAvailable}</span></div>
        <div className="flex justify-between font-medium"><span>Total ATP</span><span>{plResult.totalAtp}</span></div>
       </div>
      )}
     </CardContent>
    </Card>
   </div>
  </div>
 );
}
