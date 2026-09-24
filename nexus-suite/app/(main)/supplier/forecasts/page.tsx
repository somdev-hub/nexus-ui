"use client";
import { useEffect, useState } from "react";
import type { CollaborativeForecast } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getForecasts, createForecast, transitionForecast } from "@/lib/services/supplier-commercial-service";
import { toast } from "sonner";

export default function ForecastsPage(){
 const [data,setData]=useState<PaginatedResponse<CollaborativeForecast> | null>(null); const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState(false); const [form,setForm]=useState({retailerOrgId:"", catalogId:"", periodStart:"", periodEnd:"", forecastQuantity:"", confidencePct:""});
 const load=async()=>{ setLoading(true); try{ const res=await getForecasts({page:0,size:20}); setData(res);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[]);
 const handleCreate=async()=>{ try{ await createForecast({ retailerOrgId: form.retailerOrgId?Number(form.retailerOrgId):undefined, catalogId: form.catalogId?Number(form.catalogId):undefined, periodStart: form.periodStart, periodEnd: form.periodEnd, forecastQuantity: Number(form.forecastQuantity), confidencePct: form.confidencePct?Number(form.confidencePct):undefined }); toast.success("Forecast created"); setOpen(false); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 const share=async(id:number)=>{ try{ await transitionForecast(id,"SHARED"); toast.success("Shared"); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Collaborative Forecasting (Supplier ↔ Retailer)</h1>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Share Forecast</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>New Forecast</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div className="grid grid-cols-2 gap-3"><div><Label>Retailer Org ID</Label><Input value={form.retailerOrgId} onChange={e=>setForm({...form,retailerOrgId:e.target.value})} /></div><div><Label>Catalog ID</Label><Input value={form.catalogId} onChange={e=>setForm({...form,catalogId:e.target.value})} /></div></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Period Start</Label><Input type="date" value={form.periodStart} onChange={e=>setForm({...form,periodStart:e.target.value})} /></div><div><Label>Period End</Label><Input type="date" value={form.periodEnd} onChange={e=>setForm({...form,periodEnd:e.target.value})} /></div></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Qty</Label><Input type="number" value={form.forecastQuantity} onChange={e=>setForm({...form,forecastQuantity:e.target.value})} /></div><div><Label>Confidence %</Label><Input type="number" value={form.confidencePct} onChange={e=>setForm({...form,confidencePct:e.target.value})} /></div></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Forecasts</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>Retailer</TableHead><TableHead>Catalog</TableHead><TableHead>Period</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((f: CollaborativeForecast)=>(<TableRow key={f.forecastId}><TableCell>{f.retailerOrgName||f.retailerOrgId||"-"}</TableCell><TableCell>{f.catalogName||f.catalogId||"-"}</TableCell><TableCell className="text-xs">{f.periodStart} → {f.periodEnd}</TableCell><TableCell>{f.forecastQuantity}</TableCell><TableCell><Badge>{f.status}</Badge></TableCell><TableCell>{f.status==="DRAFT" && <Button size="sm" variant="outline" onClick={()=>share(f.forecastId)}>Share</Button>}</TableCell></TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No forecasts</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
