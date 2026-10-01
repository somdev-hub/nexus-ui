'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    adjustStock,
    getStocks,
    getReorderSuggestions,
    getInventoryValuation,
} from '@/lib/services/stock-service';
import type { Stock } from '@/types/stock';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function StockPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [suggestions, setSuggestions] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalValue, setTotalValue] = useState<number>(0);
    const [adjustOpen, setAdjustOpen] = useState<number | null>(null);
    const [adjusting, setAdjusting] = useState(false);
    const [adjustForm, setAdjustForm] = useState({
        quantity: '',
        reason: '',
        referenceType: 'MANUAL',
        referenceId: '0',
    });
    const [filter, setFilter] = useState<{
        belowReorderPoint?: boolean;
        warehouseId?: number;
    }>({});
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [stockRes, valuation, reorder] = await Promise.all([
                getStocks({ pageNo: 0, pageOffset: 20, ...filter }),
                getInventoryValuation().catch(() => null),
                getReorderSuggestions().catch(() => []),
            ]);
            setStocks(stockRes.content ?? []);
            setSuggestions(reorder ?? []);
            if (valuation && valuation.totalValue != null)
                setTotalValue(Number(valuation.totalValue));
            else if (valuation && (valuation as any).totalValue == null)
                setTotalValue(0);
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : 'Failed to load stock'
            );
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    const handleAdjust = async (stockId: number) => {
        if (!adjustForm.quantity || !adjustForm.reason) {
            toast.error('Quantity and reason are required');
            return;
        }
        setAdjusting(true);
        try {
            await adjustStock(stockId, {
                quantity: Number(adjustForm.quantity),
                reason: adjustForm.reason,
                referenceType: adjustForm.referenceType || 'MANUAL',
                referenceId: Number(adjustForm.referenceId) || 0,
            });
            toast.success('Stock adjusted');
            setAdjustOpen(null);
            setAdjustForm({
                quantity: '',
                reason: '',
                referenceType: 'MANUAL',
                referenceId: '0',
            });
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to adjust');
        } finally {
            setAdjusting(false);
        }
    };

    const setAdjust =
        (k: keyof typeof adjustForm) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setAdjustForm((f) => ({ ...f, [k]: e.target.value }));

    useEffect(() => {
        load();
    }, [load]);

    const filtered = stocks.filter(
        (s) =>
            !search ||
            (s.materialName ?? '')
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            (s.materialCode ?? '').toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading)
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );

    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Stock Inventory</h1>
                    <p className="text-muted-foreground">
                        Multi-warehouse inventory · FR-RET-010/011/014
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline">
                        Total Value: ${(totalValue ?? 0).toLocaleString()}
                    </Badge>
                    <Button variant="outline" onClick={load}>
                        Refresh
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm text-muted-foreground">
                            Total SKUs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-2xl font-bold">{stocks.length}</p>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm text-muted-foreground">
                            Below Reorder
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-2xl font-bold text-orange-600">
                            {stocks.filter((s) => s.belowReorderPoint).length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm text-muted-foreground">
                            Below Min
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-2xl font-bold text-red-600">
                            {stocks.filter((s) => s.atOrBelowMinLevel).length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="text-sm text-muted-foreground">
                            Valuation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-2xl font-bold">
                            ${(totalValue ?? 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="flex gap-4">
                <Input
                    placeholder="Search material..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    onValueChange={(v) =>
                        setFilter((f) => ({
                            ...f,
                            belowReorderPoint: v === 'below' ? true : undefined,
                        }))
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="below">Below Reorder</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead className="text-right">
                                On Hand
                            </TableHead>
                            <TableHead className="text-right">
                                Available
                            </TableHead>
                            <TableHead className="text-right">
                                Reserved
                            </TableHead>
                            <TableHead>Valuation</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((s) => (
                            <TableRow key={s.stockId}>
                                <TableCell>
                                    <div className="font-medium">
                                        {s.materialName ?? '—'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {s.materialCode ?? '—'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {s.warehouseCode ?? '—'}
                                    <div className="text-xs text-muted-foreground">
                                        {s.warehouseLocation ?? ''}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {(s.quantityOnHand ?? 0).toString()}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {(s.quantityAvailable ?? 0).toString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {(s.quantityReserved ?? 0).toString()}
                                </TableCell>
                                <TableCell>
                                    ${(s.totalValue ?? 0).toLocaleString()}
                                    <div className="text-xs">
                                        {s.valuationMethod ?? '—'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {s.belowReorderPoint && (
                                        <Badge className="bg-orange-100 text-orange-800 mr-1">
                                            Reorder
                                        </Badge>
                                    )}
                                    {s.atOrBelowMinLevel && (
                                        <Badge className="bg-red-100 text-red-800">
                                            Low
                                        </Badge>
                                    )}
                                    {!s.belowReorderPoint &&
                                        !s.atOrBelowMinLevel && (
                                            <Badge variant="outline">OK</Badge>
                                        )}
                                </TableCell>
                                <TableCell>
                                    <Dialog
                                        open={adjustOpen === s.stockId}
                                        onOpenChange={(v) =>
                                            setAdjustOpen(v ? s.stockId : null)
                                        }
                                    >
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                Adjust
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Adjust Stock —{' '}
                                                    {s.materialCode}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-6">
                                                <div className="grid gap-2">
                                                    <Label>Quantity</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 10 (positive) or -5"
                                                        value={
                                                            adjustForm.quantity
                                                        }
                                                        onChange={setAdjust(
                                                            'quantity'
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Reason</Label>
                                                    <Textarea
                                                        placeholder="e.g. Cycle count correction"
                                                        value={
                                                            adjustForm.reason
                                                        }
                                                        onChange={setAdjust(
                                                            'reason'
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="grid gap-2">
                                                        <Label>
                                                            Reference Type
                                                        </Label>
                                                        <Input
                                                            placeholder="e.g. MANUAL"
                                                            value={
                                                                adjustForm.referenceType
                                                            }
                                                            onChange={setAdjust(
                                                                'referenceType'
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>
                                                            Reference ID
                                                        </Label>
                                                        <Input
                                                            placeholder="e.g. 0"
                                                            value={
                                                                adjustForm.referenceId
                                                            }
                                                            onChange={setAdjust(
                                                                'referenceId'
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() =>
                                                        handleAdjust(s.stockId)
                                                    }
                                                    disabled={adjusting}
                                                >
                                                    {adjusting
                                                        ? 'Adjusting...'
                                                        : 'Apply Adjustment'}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No stock found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0 flex flex-row items-center justify-between">
                    <CardTitle>
                        Reorder Suggestions ({suggestions.length})
                    </CardTitle>
                    <Link href="/retailer/purchase-orders/add">
                        <Button size="sm">Create PO</Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    {suggestions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No items below reorder point.
                        </p>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Warehouse</TableHead>
                                        <TableHead className="text-right">
                                            Available
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Reorder Qty
                                        </TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suggestions.map((s) => (
                                        <TableRow key={s.stockId}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {s.materialName ?? '—'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {s.materialCode ?? '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {s.warehouseCode ??
                                                    s.warehouseId}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(
                                                    s.quantityAvailable ?? 0
                                                ).toString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(
                                                    s.reorderQuantity ?? 0
                                                ).toString()}
                                            </TableCell>
                                            <TableCell>
                                                <Link href="/retailer/purchase-orders/add">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Create PO
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
