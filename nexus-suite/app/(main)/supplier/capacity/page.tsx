"use client";
import { useEffect, useState } from "react";
import type { ProductionCapacity } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getCapacities, createCapacity } from "@/lib/services/supplier-capacity-service";
import { toast } from "sonner";

export default function CapacityPage(){
 const [data,setData]=useState<PaginatedResponse<ProductionCapacity> | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({productLine:"", periodStart:"", periodEnd:"", shift:"", availableCapacity:"", unit:"UNITS"});
 const load=async()=>{ setLoading(true); try{ const res=await getCapacities({page:0,size:20}); setData(res);}catch(e: unknown){toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[]);
 const handleCreate=async()=>{
  try{ await createCapacity({ productLine:form.productLine||undefined, periodStart:form.periodStart, periodEnd:form.periodEnd, shift:form.shift||undefined, availableCapacity: form.availableCapacity?Number(form.availableCapacity):0, unit:form.unit }); toast.success("Capacity created"); setOpen(false); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); }
 };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Capacity Calendar (Period / Product Line / Shift)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Add Capacity</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Capacity</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Product Line</Label><Input value={form.productLine} onChange={e=>setForm({...form,productLine:e.target.value})} /></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Period Start</Label><Input type="date" value={form.periodStart} onChange={e=>setForm({...form,periodStart:e.target.value})} /></div><div><Label>Period End</Label><Input type="date" value={form.periodEnd} onChange={e=>setForm({...form,periodEnd:e.target.value})} /></div></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Shift</Label><Input value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} placeholder="MORNING" /></div><div><Label>Available</Label><Input type="number" value={form.availableCapacity} onChange={e=>setForm({...form,availableCapacity:e.target.value})} /></div></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Capacity Periods</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Product Line</TableHead><TableHead>Period</TableHead><TableHead>Shift</TableHead><TableHead>Available</TableHead><TableHead>Allocated</TableHead><TableHead>Remaining</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((c: ProductionCapacity)=>(<TableRow key={c.capacityId}><TableCell>{c.productLine||"-"}</TableCell><TableCell className="text-xs">{c.periodStart} → {c.periodEnd}</TableCell><TableCell><Badge variant="outline">{c.shift||"-"}</Badge></TableCell><TableCell>{c.availableCapacity}</TableCell><TableCell>{c.allocatedCapacity}</TableCell><TableCell className="font-medium">{c.remainingCapacity ?? ((c.availableCapacity ?? 0) - (c.allocatedCapacity ?? 0))}</TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No capacity</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
