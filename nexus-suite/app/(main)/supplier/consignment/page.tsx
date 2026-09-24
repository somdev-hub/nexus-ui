"use client";
import { useEffect, useState } from "react";
import type { ConsignmentStock } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getConsignments, createConsignment } from "@/lib/services/supplier-inventory-service";
import { toast } from "sonner";

export default function ConsignmentPage(){
 const [data,setData]=useState<PaginatedResponse<ConsignmentStock> | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({retailerOrgId:"", warehouseId:"", materialId:"", quantityOnHand:""});
 const load=async()=>{ setLoading(true); try{ const res=await getConsignments({page:0,size:20}); setData(res);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[]);
 const handleCreate=async()=>{ try{ await createConsignment({ retailerOrgId: Number(form.retailerOrgId), warehouseId: form.warehouseId?Number(form.warehouseId):undefined, materialId: Number(form.materialId), quantityOnHand: Number(form.quantityOnHand) }); toast.success("Consignment created"); setOpen(false); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Consignment Stock (Retailer Location)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Add Consignment</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Consignment</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Retailer Org ID</Label><Input value={form.retailerOrgId} onChange={e=>setForm({...form,retailerOrgId:e.target.value})} /></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Warehouse ID</Label><Input value={form.warehouseId} onChange={e=>setForm({...form,warehouseId:e.target.value})} /></div><div><Label>Material ID</Label><Input value={form.materialId} onChange={e=>setForm({...form,materialId:e.target.value})} /></div></div>
       <div><Label>Qty On Hand</Label><Input type="number" value={form.quantityOnHand} onChange={e=>setForm({...form,quantityOnHand:e.target.value})} /></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Consignment Inventory</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Consignment #</TableHead><TableHead>Retailer</TableHead><TableHead>Warehouse</TableHead><TableHead>Material</TableHead><TableHead>Available</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((c: ConsignmentStock)=>(<TableRow key={c.consignmentId}><TableCell className="font-medium">{c.consignmentNumber}</TableCell><TableCell>{c.retailerOrgName||c.retailerOrgId}</TableCell><TableCell>{c.warehouseCode||c.warehouseId||"-"}</TableCell><TableCell>{c.materialName||c.materialId}</TableCell><TableCell>{c.quantityAvailable}</TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No consignment stock</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
