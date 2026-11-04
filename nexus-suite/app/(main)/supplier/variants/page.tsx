'use client';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { ProductVariant } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CatalogSelect } from '@/components/catalog-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getVariants,
    createVariant,
    deleteVariant,
} from '@/lib/services/supplier-catalog-service';
import { useToast } from '@/hooks/use-toast';
import { useTables } from '@/hooks/use-tables';
import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuickCreateIntent } from '@/lib/quick-create';

export default function VariantsPage() {
    const { toast } = useToast();
    const [data, setData] = useState<PaginatedResponse<ProductVariant> | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:variant', () => setOpen(true));
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        catalogId: '',
        variantType: 'SIZE',
        variantValue: '',
        skuSuffix: '',
        priceAdjustment: '',
    });
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const v = await getVariants({ page: 0, size: 100 });
            setData(v);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    useEffect(() => {
        load();
    }, [load]);
    const handleCreate = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createVariant({
                catalogId: Number(form.catalogId),
                variantType: form.variantType,
                variantValue: form.variantValue,
                skuSuffix: form.skuSuffix || undefined,
                priceAdjustment: form.priceAdjustment
                    ? Number(form.priceAdjustment)
                    : 0,
            });
            toast({ title: 'Variant created', variant: 'success' });
            setOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id: number) => {
        try {
            await deleteVariant(id);
            toast({ title: 'Variant deleted', variant: 'success' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const rows = data?.content ?? [];
    const columns: ColumnDef<ProductVariant>[] = [
        {
            id: 'catalog',
            accessorFn: (row) => row.catalogName || String(row.catalogId),
            header: 'Catalog',
        },
        {
            accessorKey: 'variantType',
            header: 'Type',
            cell: ({ row }) => <Badge>{row.original.variantType}</Badge>,
        },
        {
            accessorKey: 'variantValue',
            header: 'Value',
        },
        {
            accessorKey: 'skuSuffix',
            header: 'SKU Suffix',
            cell: ({ row }) => row.original.skuSuffix || '-',
        },
        {
            id: 'priceAdjustment',
            accessorFn: (row) => row.priceAdjustment ?? 0,
            header: 'Price Adj.',
            cell: ({ row }) => row.original.priceAdjustment ?? 0,
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        >
                            <IconDotsVertical />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                                handleDelete(row.original.variantId)
                            }
                        >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
    const table = useTables<ProductVariant>({
        data: rows,
        columns,
        getRowId: (row) => row.variantId.toString(),
    });
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Product Variants (Size / Color / Configuration)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Variant
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Variant</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Catalog Item</Label>
                                <CatalogSelect
                                    value={form.catalogId}
                                    onChange={(v) =>
                                        setForm({
                                            ...form,
                                            catalogId: v,
                                        })
                                    }
                                    placeholder="Select catalog item"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.variantType}
                                    onValueChange={(v) =>
                                        setForm({ ...form, variantType: v })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SIZE">
                                            SIZE
                                        </SelectItem>
                                        <SelectItem value="COLOR">
                                            COLOR
                                        </SelectItem>
                                        <SelectItem value="CONFIGURATION">
                                            CONFIGURATION
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Value</Label>
                                <Input
                                    value={form.variantValue}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            variantValue: e.target.value,
                                        })
                                    }
                                    placeholder="Red / L / Config A"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>SKU Suffix</Label>
                                    <Input
                                        placeholder="e.g. -RED-XL"
                                        value={form.skuSuffix}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                skuSuffix: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Price Adj.</Label>
                                    <Input
                                        placeholder="e.g. 10.00"
                                        value={form.priceAdjustment}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                priceAdjustment: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <Button onClick={handleCreate} disabled={saving}>
                                {saving && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {saving ? 'Creating…' : 'Create'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Variants</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <CentralizedDataTable
                            table={table}
                            emptyMessage="No variants"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
