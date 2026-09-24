"use client";
import { useEffect, useState } from "react";
import type { SupplierCatalog } from "@/types/supplier";
import type { PaginatedResponse } from "@/types/paginated-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSupplierCatalogs, createSupplierCatalog, transitionCatalogStatus } from "@/lib/services/supplier-catalog-service";
import { toast } from "sonner";

export default function SupplierCatalogPage() {
 const [data, setData] = useState<PaginatedResponse<SupplierCatalog> | null>(null);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [status, setStatus] = useState("all");
 const [open, setOpen] = useState(false);
 const [form, setForm] = useState({ name: "", code: "", category: "", family: "", sku: "", basePrice: "", description: "" });

 const load = async () => {
  setLoading(true);
  try {
   const res = await getSupplierCatalogs({ page: 0, size: 20, search: search || undefined, status: status === "all" ? undefined : status });
   setData(res);
  } catch(e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setLoading(false); }
 };
 useEffect(() => { load(); }, [status]);
 useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

 const handleCreate = async () => {
  try {
   await createSupplierCatalog({ name: form.name, code: form.code, category: form.category, family: form.family, sku: form.sku, basePrice: form.basePrice ? Number(form.basePrice) : undefined, description: form.description, currency: "USD" });
   toast.success("Catalog created"); setOpen(false); setForm({ name: "", code: "", category: "", family: "", sku: "", basePrice: "", description: "" }); load();
  } catch(e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); }
 };
 const publish = async (id: number) => {
  try { await transitionCatalogStatus(id, "PUBLISHED"); toast.success("Published"); load(); } catch(e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); }
 };

 return (
  <div className="p-4 lg:p-6 space-y-4">
   <div className="flex items-center justify-between">
    <h1 className="text-2xl font-semibold">Catalog (Category → Family → SKU)</h1>
    <Dialog open={open} onOpenChange={setOpen}>
     <DialogTrigger asChild><Button>Create Product</Button></DialogTrigger>
     <DialogContent>
      <DialogHeader><DialogTitle>New Catalog Product</DialogTitle></DialogHeader>
      <div className="grid gap-3">
       <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Code</Label><Input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} /></div><div><Label>SKU</Label><Input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} /></div></div>
       <div className="grid grid-cols-2 gap-3"><div><Label>Category</Label><Input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Electronics" /></div><div><Label>Family</Label><Input value={form.family} onChange={e=>setForm({...form,family:e.target.value})} placeholder="Smartphones" /></div></div>
       <div><Label>Base Price</Label><Input type="number" value={form.basePrice} onChange={e=>setForm({...form,basePrice:e.target.value})} /></div>
       <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
       <Button onClick={handleCreate}>Create</Button>
      </div>
     </DialogContent>
    </Dialog>
   </div>
   <Card className="p-4 gap-2">
    <CardHeader className="p-0"><CardTitle className="flex gap-2"><Input placeholder="Search name/code/sku" value={search} onChange={e=>setSearch(e.target.value)} className="max-w-sm" />
     <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="DRAFT">DRAFT</SelectItem><SelectItem value="PUBLISHED">PUBLISHED</SelectItem><SelectItem value="ARCHIVED">ARCHIVED</SelectItem></SelectContent></Select>
    </CardTitle></CardHeader>
    <CardContent className="p-0">
     {loading ? <div className="text-sm text-muted-foreground">Loading...</div> : (
      <Table>
       <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Hierarchy</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Access</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
       <TableBody>
        {data?.content?.map((c: SupplierCatalog)=>(
         <TableRow key={c.catalogId}>
          <TableCell><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.code} • {c.sku}</div></TableCell>
          <TableCell className="text-xs">{c.category} → {c.family} → {c.sku}</TableCell>
          <TableCell>{c.basePrice ? `$${c.basePrice}` : "-"}</TableCell>
          <TableCell><Badge variant={c.status==="PUBLISHED"?"default":"secondary"}>{c.status}</Badge></TableCell>
          <TableCell><Badge variant="outline">{c.accessLevel}</Badge></TableCell>
          <TableCell>{c.status==="DRAFT" && <Button size="sm" variant="outline" onClick={()=>publish(c.catalogId)}>Publish</Button>}</TableCell>
         </TableRow>
        ))}
        {!data?.content?.length && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No catalog items</TableCell></TableRow>}
       </TableBody>
      </Table>
     )}
    </CardContent>
   </Card>
  </div>
 );
}
