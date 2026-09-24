"use client";
import { useEffect, useState } from "react";
import type { ProductVariant } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getVariants, createVariant } from "@/lib/services/supplier-catalog-service";
import { toast } from "sonner";

export default function VariantsPage(){
 const [data,setData]=useState<PaginatedResponse<ProductVariant> | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({catalogId:"", variantType:"SIZE", variantValue:"", skuSuffix:"", priceAdjustment:"" });
 const load=async()=>{ setLoading(true); try{ const res=await getVariants({page:0,size:20}); setData(res);}catch(e: unknown){toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[]);
 const handleCreate=async()=>{
  try{ await createVariant({ catalogId:Number(form.catalogId), variantType:form.variantType, variantValue:form.variantValue, skuSuffix:form.skuSuffix||undefined, priceAdjustment:form.priceAdjustment?Number(form.priceAdjustment):0 }); toast.success("Variant created"); setOpen(false); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); }
 };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Product Variants (Size / Color / Configuration)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Create Variant</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Variant</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Catalog ID</Label><Input value={form.catalogId} onChange={e=>setForm({...form,catalogId:e.target.value})} /></div>
       <div><Label>Type</Label><Select value={form.variantType} onValueChange={v=>setForm({...form,variantType:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SIZE">SIZE</SelectItem><SelectItem value="COLOR">COLOR</SelectItem><SelectItem value="CONFIGURATION">CONFIGURATION</SelectItem></SelectContent></Select></div>
       <div><Label>Value</Label><Input value={form.variantValue} onChange={e=>setForm({...form,variantValue:e.target.value})} placeholder="Red / L / Config A" /></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>SKU Suffix</Label><Input value={form.skuSuffix} onChange={e=>setForm({...form,skuSuffix:e.target.value})} /></div><div><Label>Price Adj.</Label><Input value={form.priceAdjustment} onChange={e=>setForm({...form,priceAdjustment:e.target.value})} /></div></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Variants</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Catalog</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>SKU Suffix</TableHead><TableHead>Price Adj.</TableHead><TableHead>BOM</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((v: ProductVariant)=>(<TableRow key={v.variantId}><TableCell>{v.catalogName||v.catalogId}</TableCell><TableCell><Badge>{v.variantType}</Badge></TableCell><TableCell>{v.variantValue}</TableCell><TableCell>{v.skuSuffix||"-"}</TableCell><TableCell>{v.priceAdjustment}</TableCell><TableCell className="text-xs">{v.bomMaterialName||"-"}</TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No variants</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
