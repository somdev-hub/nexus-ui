"use client";
import { useEffect, useState } from "react";
import type { SupplierDigitalAsset } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDigitalAssets, createDigitalAsset } from "@/lib/services/supplier-catalog-service";
import { toast } from "sonner";

export default function DigitalAssetsPage(){
 const [data,setData]=useState<PaginatedResponse<SupplierDigitalAsset> | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({catalogId:"", assetType:"DATASHEET", fileName:""});
 const load=async()=>{ setLoading(true); try{ const res=await getDigitalAssets({page:0,size:20}); setData(res);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{load();},[]);
 const handleCreate=async()=>{ try{ await createDigitalAsset({ catalogId:Number(form.catalogId), assetType:form.assetType, fileName:form.fileName }); toast.success("Asset created"); setOpen(false); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); } };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Digital Assets (Datasheet / Certifications / 3D)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Add Asset</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Digital Asset</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Catalog ID</Label><Input value={form.catalogId} onChange={e=>setForm({...form,catalogId:e.target.value})} /></div>
       <div><Label>Type</Label><Select value={form.assetType} onValueChange={v=>setForm({...form,assetType:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="DATASHEET">DATASHEET</SelectItem><SelectItem value="CERTIFICATION">CERTIFICATION</SelectItem><SelectItem value="COMPLIANCE">COMPLIANCE</SelectItem><SelectItem value="MODEL_3D">MODEL_3D</SelectItem><SelectItem value="COA">COA</SelectItem><SelectItem value="COC">COC</SelectItem><SelectItem value="TEST_REPORT">TEST_REPORT</SelectItem></SelectContent></Select></div>
       <div><Label>File Name</Label><Input value={form.fileName} onChange={e=>setForm({...form,fileName:e.target.value})} /></div>
       <Button onClick={handleCreate}>Create (DMS mocked)</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Assets</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Catalog</TableHead><TableHead>Type</TableHead><TableHead>File</TableHead><TableHead>DMS</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((a: SupplierDigitalAsset)=>(<TableRow key={a.assetId}><TableCell>{a.catalogName||a.catalogId}</TableCell><TableCell><Badge>{a.assetType}</Badge></TableCell><TableCell>{a.fileName}</TableCell><TableCell className="text-xs">{a.dmsDocumentId||"-"}</TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No assets</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
