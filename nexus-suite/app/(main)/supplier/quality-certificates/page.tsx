"use client";
import { useEffect, useState } from "react";
import type { SupplierQualityCertificate } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQualityCerts, createQualityCert } from "@/lib/services/supplier-orders-service";
import { toast } from "sonner";

export default function QualityCertsPage(){
 const [data,setData]=useState<PaginatedResponse<SupplierQualityCertificate> | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({purchaseOrderId:"", catalogId:"", certificateType:"COA", certificateNumber:""});
 const load=async()=>{ setLoading(true); try{ const res=await getQualityCerts({page:0,size:20}); setData(res);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[]);
 const handleCreate=async()=>{ try{ await createQualityCert({ purchaseOrderId: form.purchaseOrderId?Number(form.purchaseOrderId):undefined, catalogId: form.catalogId?Number(form.catalogId):undefined, certificateType: form.certificateType, certificateNumber: form.certificateNumber||undefined, dmsDocumentId: "DMS-"+Date.now() }); toast.success("Certificate created"); setOpen(false); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Quality Certificates (CoA / CoC / Test Reports)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Add Certificate</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Quality Certificate</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>PO ID</Label><Input value={form.purchaseOrderId} onChange={e=>setForm({...form,purchaseOrderId:e.target.value})} /></div>
       <div><Label>Catalog ID</Label><Input value={form.catalogId} onChange={e=>setForm({...form,catalogId:e.target.value})} /></div>
       <div><Label>Type</Label><Select value={form.certificateType} onValueChange={v=>setForm({...form,certificateType:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="COA">COA</SelectItem><SelectItem value="COC">COC</SelectItem><SelectItem value="TEST_REPORT">TEST_REPORT</SelectItem></SelectContent></Select></div>
       <div><Label>Certificate #</Label><Input value={form.certificateNumber} onChange={e=>setForm({...form,certificateNumber:e.target.value})} /></div>
       <Button onClick={handleCreate}>Create (DMS mocked)</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Certificates</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>PO</TableHead><TableHead>Catalog</TableHead><TableHead>Type</TableHead><TableHead>Number</TableHead><TableHead>DMS</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((c: SupplierQualityCertificate)=>(<TableRow key={c.certificateId}><TableCell>{c.poNumber||c.purchaseOrderId||"-"}</TableCell><TableCell>{c.catalogName||c.catalogId||"-"}</TableCell><TableCell><Badge>{c.certificateType}</Badge></TableCell><TableCell>{c.certificateNumber||"-"}</TableCell><TableCell className="text-xs">{c.dmsDocumentId||"-"}</TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No certificates</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
