"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAbcAnalysis } from "@/lib/services/stock-service";
import type { AbcAnalysis } from "@/types/stock";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function AbcPage() {
  const [data, setData] = useState<AbcAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string>("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAbcAnalysis(category || undefined);
      setData(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load ABC analysis");
    } finally { setIsLoading(false); }
  }, [category]);

  useEffect(()=>{ load(); },[load]);

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-20 w-full"/><Skeleton className="h-[400px] w-full"/></div>;
  if (!data) return <div className="p-6 text-muted-foreground">No data</div>;

  const catColor: Record<string,string> = { A:"bg-green-100 text-green-800", B:"bg-yellow-100 text-yellow-800", C:"bg-red-100 text-red-800" };

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">ABC Analysis</h1><p className="text-muted-foreground">Value/velocity prioritization · FR-RET-012</p></div>
        <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="">All</SelectItem><SelectItem value="A">Category A</SelectItem><SelectItem value="B">Category B</SelectItem><SelectItem value="C">Category C</SelectItem></SelectContent></Select>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Total Value</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold">${(data.summary.totalInventoryValue ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">A (≤80%)</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold">{data.summary.categoryACount ?? 0} items</p><p className="text-xs text-muted-foreground">${(data.summary.categoryAValue ?? 0).toLocaleString()} · {data.summary.categoryAPercentage ?? 0}%</p></CardContent></Card>
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">B (≤95%)</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold">{data.summary.categoryBCount ?? 0} items</p><p className="text-xs text-muted-foreground">${(data.summary.categoryBValue ?? 0).toLocaleString()} · {data.summary.categoryBPercentage ?? 0}%</p></CardContent></Card>
        <Card className="p-4 gap-2"><CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">C (Rest)</CardTitle></CardHeader><CardContent className="p-0"><p className="text-2xl font-bold">{data.summary.categoryCCount ?? 0} items</p><p className="text-xs text-muted-foreground">${(data.summary.categoryCValue ?? 0).toLocaleString()} · {data.summary.categoryCPercentage ?? 0}%</p></CardContent></Card>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Qty On Hand</TableHead><TableHead className="text-right">Unit Cost</TableHead><TableHead className="text-right">Annual Value</TableHead><TableHead className="text-right">Cumulative %</TableHead><TableHead>Category</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.items.map(it=>(
              <TableRow key={it.stockId}>
                <TableCell><div className="font-medium">{it.materialName ?? "—"}</div><div className="text-xs text-muted-foreground">{it.materialCode ?? "—"} · WH {it.warehouseId ?? "—"}</div></TableCell>
                <TableCell className="text-right">{(it.quantityOnHand ?? 0).toString()}</TableCell>
                <TableCell className="text-right">${Number(it.unitCost ?? 0).toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">${(it.annualValue ?? 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">{it.cumulativePercentage ?? 0}%</TableCell>
                <TableCell><Badge className={catColor[it.abcCategory as string] ?? "bg-gray-100"}>{it.abcCategory ?? "—"}</Badge></TableCell>
              </TableRow>
            ))}
            {data.items.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8">No items</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
