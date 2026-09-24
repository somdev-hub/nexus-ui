"use client";
import { useEffect, useState } from "react";
import type { SupplierOrder } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupplierOrders, acknowledgeOrder, createPartialShipment } from "@/lib/services/supplier-orders-service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function SupplierOrdersPage(){
 const [data,setData]=useState<PaginatedResponse<SupplierOrder> | null>(null); const [loading,setLoading]=useState(true);
 const [status,setStatus]=useState("all"); const [search,setSearch]=useState("");
 const [partialOpen,setPartialOpen]=useState<number|null>(null);
 const [shippedQty,setShippedQty]=useState("");
 const load=async()=>{ setLoading(true); try{ const res=await getSupplierOrders({page:0,size:20, status: status==="all"? undefined: status, poNumber: search||undefined}); setData(res);}catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));}finally{ setLoading(false);} };
 useEffect(()=>{ load(); },[status]);
 useEffect(()=>{ const t=setTimeout(load,400); return()=>clearTimeout(t); },[search]);
 const ack=async(id:number)=>{ try{ await acknowledgeOrder(id, undefined, "Acknowledged via portal"); toast.success("Acknowledged"); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e));} };
 const createPartial=async(id:number)=>{
  try{ await createPartialShipment(id, { shippedQuantity: Number(shippedQty), trackingNumber: "TRK-"+Date.now() }); toast.success("Partial shipment created"); setPartialOpen(null); setShippedQty(""); load(); }catch(e: unknown){ toast.error(e instanceof Error ? e.message : String(e)); }
 };
 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Order Ingestion & Partial Shipments</h1>
    <div className="flex gap-2"><Input placeholder="PO number" value={search} onChange={e=>setSearch(e.target.value)} className="w-40" />
     <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="SENT_TO_SUPPLIER">SENT_TO_SUPPLIER</SelectItem><SelectItem value="ACKNOWLEDGED">ACKNOWLEDGED</SelectItem><SelectItem value="PARTIALLY_RECEIVED">PARTIAL</SelectItem><SelectItem value="RECEIVED">RECEIVED</SelectItem></SelectContent></Select>
    </div>
   </div>
   <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle>Purchase Orders (Supplier View)</CardTitle></CardHeader><CardContent className="p-0">
    {loading? <div className="text-sm text-muted-foreground">Loading...</div> : (
     <Table><TableHeader><TableRow><TableHead>PO Number</TableHead><TableHead>Buyer</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>{data?.content?.map((o: SupplierOrder)=>(<TableRow key={o.purchaseOrderId}><TableCell className="font-medium">{o.poNumber}</TableCell><TableCell>{o.buyerOrg?.name||o.buyerOrgId||"-"}</TableCell><TableCell><Badge>{o.status}</Badge></TableCell><TableCell>{o.totalAmount?`$${o.totalAmount}`:"-"}</TableCell>
       <TableCell className="flex gap-2">
        {o.status==="SENT_TO_SUPPLIER" && <Button size="sm" onClick={()=>ack(o.purchaseOrderId)}>Acknowledge</Button>}
        {(o.status==="ACKNOWLEDGED"||o.status==="PARTIALLY_RECEIVED") && (
         <Dialog open={partialOpen===o.purchaseOrderId} onOpenChange={v=> setPartialOpen(v?o.purchaseOrderId:null)}>
          <DialogTrigger asChild><Button size="sm" variant="outline">Partial Ship</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Partial Shipment for {o.poNumber}</DialogTitle></DialogHeader>
           <div className="space-y-3"><div><Label>Shipped Qty</Label><Input value={shippedQty} onChange={e=>setShippedQty(e.target.value)} type="number" /></div><Button onClick={()=>createPartial(o.purchaseOrderId)}>Create Shipment & Track Backorder</Button></div>
          </DialogContent>
         </Dialog>
        )}
       </TableCell>
      </TableRow>))}
      {!data?.content?.length && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No orders</TableCell></TableRow>}
      </TableBody>
     </Table>
    )}
   </CardContent></Card>
  </div>
 );
}
