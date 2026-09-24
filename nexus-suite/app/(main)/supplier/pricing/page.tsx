"use client";
import { useEffect, useState } from "react";
import type { SupplierPriceTier } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getPriceTiers, createPriceTier } from "@/lib/services/supplier-catalog-service";
import { toast } from "sonner";

export default function SupplierPricingPage() {
 const [data, setData] = useState<PaginatedResponse<SupplierPriceTier> | null>(null);
 const [loading, setLoading] = useState(true);
 const [open, setOpen] = useState(false);
 const [form, setForm] = useState({ catalogId: "", minQuantity: "", maxQuantity: "", unitPrice: "", customerSegment: "", tierName: "" });

 const load = async () => {
  setLoading(true);
  try { const res = await getPriceTiers({ page:0, size:20 }); setData(res); } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); } finally{ setLoading(false); }
 };
 useEffect(()=>{ load(); },[]);

 const handleCreate = async ()=>{
  try {
   await createPriceTier({ catalogId: Number(form.catalogId), minQuantity: form.minQuantity?Number(form.minQuantity):undefined, maxQuantity: form.maxQuantity?Number(form.maxQuantity):undefined, unitPrice: Number(form.unitPrice), customerSegment: form.customerSegment||undefined, tierName: form.tierName||undefined, currency:"USD" });
   toast.success("Price tier created"); setOpen(false); load();
  } catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); }
 };

 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Dynamic Pricing (Volume / Segment / Contract / Validity)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Create Tier</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Price Tier</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Catalog ID</Label><Input value={form.catalogId} onChange={e=>setForm({...form,catalogId:e.target.value})} /></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Min Qty</Label><Input value={form.minQuantity} onChange={e=>setForm({...form,minQuantity:e.target.value})} /></div><div><Label>Max Qty</Label><Input value={form.maxQuantity} onChange={e=>setForm({...form,maxQuantity:e.target.value})} /></div></div>
       <div><Label>Unit Price</Label><Input value={form.unitPrice} onChange={e=>setForm({...form,unitPrice:e.target.value})} /></div>
       <div><Label>Customer Segment</Label><Input value={form.customerSegment} onChange={e=>setForm({...form,customerSegment:e.target.value})} placeholder="ENTERPRISE / SMB" /></div>
       <div><Label>Tier Name</Label><Input value={form.tierName} onChange={e=>setForm({...form,tierName:e.target.value})} /></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Pricing Tiers</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Catalog</TableHead><TableHead>Qty Range</TableHead><TableHead>Unit Price</TableHead><TableHead>Segment</TableHead><TableHead>Validity</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((t: SupplierPriceTier)=>(<TableRow key={t.tierId}><TableCell>{t.catalogName||t.catalogId}</TableCell><TableCell>{t.minQuantity??0} - {t.maxQuantity??"∞"}</TableCell><TableCell>${t.unitPrice}</TableCell><TableCell><Badge variant="outline">{t.customerSegment||"ALL"}</Badge></TableCell><TableCell className="text-xs">{t.validFrom||"-"} → {t.validTo||"-"}</TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No tiers</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
