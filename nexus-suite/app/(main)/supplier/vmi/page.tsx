"use client";
import { useEffect, useState } from "react";
import type { VmiConfig, VmiSuggestion } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getVmis, createVmi, getVmiSuggestions, triggerVmiReplenish } from "@/lib/services/supplier-inventory-service";
import { toast } from "sonner";

export default function VmiPage(){
 const [data,setData]=useState<PaginatedResponse<VmiConfig> | null>(null); const [suggestions,setSuggestions]=useState<VmiSuggestion[] | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({retailerOrgId:"", materialId:"", warehouseId:"", reorderPoint:"", reorderQuantity:""});
 const load=async()=>{ setLoading(true); try{ const [v,s]=await Promise.all([getVmis({page:0,size:20}), getVmiSuggestions().catch(()=>null)]); setData(v); setSuggestions(s);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[]);
 const handleCreate=async()=>{ try{ await createVmi({ retailerOrgId:Number(form.retailerOrgId), materialId:Number(form.materialId), warehouseId: form.warehouseId?Number(form.warehouseId):undefined, reorderPoint: form.reorderPoint?Number(form.reorderPoint):undefined, reorderQuantity: form.reorderQuantity?Number(form.reorderQuantity):undefined, autoReplenish:true }); toast.success("VMI created"); setOpen(false); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 const replenish=async(id:number)=>{ try{ await triggerVmiReplenish(id); toast.success("Replenishment triggered"); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Vendor Managed Inventory (VMI)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Create VMI</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New VMI Config</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Retailer Org ID</Label><Input value={form.retailerOrgId} onChange={e=>setForm({...form,retailerOrgId:e.target.value})} /></div>
       <div><Label>Material ID</Label><Input value={form.materialId} onChange={e=>setForm({...form,materialId:e.target.value})} /></div>
       <div><Label>Warehouse ID</Label><Input value={form.warehouseId} onChange={e=>setForm({...form,warehouseId:e.target.value})} /></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Reorder Point</Label><Input value={form.reorderPoint} onChange={e=>setForm({...form,reorderPoint:e.target.value})} /></div><div><Label>Reorder Qty</Label><Input value={form.reorderQuantity} onChange={e=>setForm({...form,reorderQuantity:e.target.value})} /></div></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   {suggestions?.length? <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Replenishment Suggestions</CardTitle></CardHeader><CardContent className="p-0">
    <div className="space-y-2">{suggestions.map((s: VmiSuggestion)=>(<div key={s.vmiId} className="flex items-center justify-between border-b py-2"><div><div className="text-sm font-medium">VMI #{s.vmiId} • Material {s.materialId}</div><div className="text-xs text-muted-foreground">Available {s.available} / Reorder {s.reorderPoint} • Suggested {s.suggestedQuantity}</div></div><Badge variant="destructive">Needs Replenish</Badge></div>))}</div>
   </CardContent></Card> : null}
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>VMI Configs</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Retailer</TableHead><TableHead>Material</TableHead><TableHead>Warehouse</TableHead><TableHead>Reorder Point</TableHead><TableHead>Auto</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((v: VmiConfig)=>(<TableRow key={v.vmiId}><TableCell>{v.retailerOrgName||v.retailerOrgId}</TableCell><TableCell>{v.materialName||v.materialId}</TableCell><TableCell>{v.warehouseCode||v.warehouseId||"-"}</TableCell><TableCell>{v.reorderPoint}</TableCell><TableCell><Badge variant={v.autoReplenish?"default":"secondary"}>{String(v.autoReplenish)}</Badge></TableCell><TableCell><Button size="sm" variant="outline" onClick={()=>replenish(v.vmiId)}>Replenish</Button></TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No VMI</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
