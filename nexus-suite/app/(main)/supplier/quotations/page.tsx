"use client";
import { useEffect, useState } from "react";
import type { SupplierQuotation } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getQuotations, createQuotation, transitionQuotation, convertQuotation } from "@/lib/services/supplier-commercial-service";
import { toast } from "sonner";

export default function QuotationsPage(){
 const [data,setData]=useState<PaginatedResponse<SupplierQuotation> | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({buyerOrgId:"", validFrom:"", validTo:"", terms:"", catalogId:"", quantity:"", unitPrice:""});
 const load=async()=>{ setLoading(true); try{ const res=await getQuotations({page:0,size:20}); setData(res);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[]);
 const handleCreate=async()=>{
  try{
   await createQuotation({ buyerOrgId: form.buyerOrgId?Number(form.buyerOrgId):undefined, validFrom: form.validFrom||undefined, validTo: form.validTo||undefined, terms: form.terms||undefined, currency:"USD", lineItems: form.catalogId? [{ catalogId:Number(form.catalogId), quantity:Number(form.quantity||1), unitPrice: Number(form.unitPrice||0) }]: [] });
   toast.success("Quotation created"); setOpen(false); load();
  }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); }
 };
 const transition=async(id:number, status:string)=>{ try{ await transitionQuotation(id,status); toast.success(`Moved to ${status}`); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 const convert=async(id:number)=>{ try{ const r=await convertQuotation(id); toast.success(`Converted to PO ${r.poNumber}`); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Quotations (Versioned, Validity, Terms, Convert to Order)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Create Quotation</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Buyer Org ID</Label><Input value={form.buyerOrgId} onChange={e=>setForm({...form,buyerOrgId:e.target.value})} /></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Valid From</Label><Input type="date" value={form.validFrom} onChange={e=>setForm({...form,validFrom:e.target.value})} /></div><div><Label>Valid To</Label><Input type="date" value={form.validTo} onChange={e=>setForm({...form,validTo:e.target.value})} /></div></div>
       <div><Label>Terms</Label><Textarea value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} /></div>
       <div className="grid grid-cols-3 gap-3"><div><Label>Catalog ID</Label><Input value={form.catalogId} onChange={e=>setForm({...form,catalogId:e.target.value})} /></div><div><Label>Qty</Label><Input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} /></div><div><Label>Unit Price</Label><Input value={form.unitPrice} onChange={e=>setForm({...form,unitPrice:e.target.value})} /></div></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Quotations</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Buyer</TableHead><TableHead>Status</TableHead><TableHead>Validity</TableHead><TableHead>Total</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((q: SupplierQuotation)=>(<TableRow key={q.quotationId}><TableCell className="font-medium">{q.quotationNumber}</TableCell><TableCell>{q.buyerOrgName||q.buyerOrgId||"-"}</TableCell><TableCell><Badge>{q.status}</Badge></TableCell><TableCell className="text-xs">{q.validFrom||"-"} → {q.validTo||"-"}</TableCell><TableCell>{q.totalAmount?`$${q.totalAmount}`:"-"}</TableCell>
       <TableCell className="flex flex-wrap gap-1">
        {q.status==="DRAFT" && <Button size="sm" variant="outline" onClick={()=>transition(q.quotationId,"SENT")}>Send</Button>}
        {q.status==="SENT" && <Button size="sm" onClick={()=>transition(q.quotationId,"ACCEPTED")}>Accept</Button>}
        {q.status==="ACCEPTED" && <Button size="sm" onClick={()=>convert(q.quotationId)}>Convert to Order</Button>}
       </TableCell>
      </TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No quotations</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
