"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStocks, getReorderSuggestions, getInventoryValuation } from "@/lib/services/stock-service";
import type { Stock } from "@/types/stock";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [filter, setFilter] = useState<{ belowReorderPoint?: boolean; warehouseId?: number }>({});
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stockRes, valuation] = await Promise.all([
        getStocks({ pageNo: 0, pageOffset: 20, ...filter }),
        getInventoryValuation().catch(() => null),
      ]);
      setStocks(stockRes.content ?? []);
      if (valuation && valuation.totalValue != null) setTotalValue(Number(valuation.totalValue));
      else if (valuation && (valuation as any).totalValue == null) setTotalValue(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load stock");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = stocks.filter(s => !search || (s.materialName ?? "").toLowerCase().includes(search.toLowerCase()) || (s.materialCode ?? "").toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-[400px] w-full" /></div>;

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Stock Inventory</h1><p className="text-muted-foreground">Multi-warehouse inventory · FR-RET-010/011/014</p></div>
        <div className="flex gap-2"><Badge variant="outline">Total Value: ${(totalValue ?? 0).toLocaleString()}</Badge><Button variant="outline" onClick={load}>Refresh</Button></div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Total SKUs</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold">{stocks.length}</p></CardContent></Card>
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Below Reorder</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold text-orange-600">{stocks.filter(s=>s.belowReorderPoint).length}</p></CardContent></Card>
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Below Min</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold text-red-600">{stocks.filter(s=>s.atOrBelowMinLevel).length}</p></CardContent></Card>
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Valuation</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold">${(totalValue ?? 0).toLocaleString()}</p></CardContent></Card>
      </div>
      <div className="flex gap-4">
        <Input placeholder="Search material..." value={search} onChange={e=>setSearch(e.target.value)} className="max-w-sm" />
        <Select onValueChange={v=>setFilter(f=>({...f, belowReorderPoint: v==="below" ? true : undefined}))}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="below">Below Reorder</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Material</TableHead><TableHead>Warehouse</TableHead><TableHead className="text-right">On Hand</TableHead><TableHead className="text-right">Available</TableHead><TableHead className="text-right">Reserved</TableHead><TableHead>Valuation</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map(s=>(
              <TableRow key={s.stockId}>
                <TableCell><div className="font-medium">{s.materialName ?? "—"}</div><div className="text-xs text-muted-foreground">{s.materialCode ?? "—"}</div></TableCell>
                <TableCell>{s.warehouseCode ?? "—"}<div className="text-xs text-muted-foreground">{s.warehouseLocation ?? ""}</div></TableCell>
                <TableCell className="text-right">{(s.quantityOnHand ?? 0).toString()}</TableCell>
                <TableCell className="text-right font-medium">{(s.quantityAvailable ?? 0).toString()}</TableCell>
                <TableCell className="text-right">{(s.quantityReserved ?? 0).toString()}</TableCell>
                <TableCell>${(s.totalValue ?? 0).toLocaleString()}<div className="text-xs">{s.valuationMethod ?? "—"}</div></TableCell>
                <TableCell>
                  {s.belowReorderPoint && <Badge className="bg-orange-100 text-orange-800 mr-1">Reorder</Badge>}
                  {s.atOrBelowMinLevel && <Badge className="bg-red-100 text-red-800">Low</Badge>}
                  {!s.belowReorderPoint && !s.atOrBelowMinLevel && <Badge variant="outline">OK</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No stock found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
