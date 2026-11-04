'use client';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { SupplierQualityCertificate } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getQualityCerts,
    createQualityCert,
    deleteQualityCert,
    getSupplierOrders,
} from '@/lib/services/supplier-orders-service';
import type { SupplierOrder } from '@/types/supplier';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { useTables } from '@/hooks/use-tables';
import { CatalogSelect } from '@/components/catalog-select';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';

export default function QualityCertsPage() {
    const { toast } = useToast();    const [data, setData] =
        useState<PaginatedResponse<SupplierQualityCertificate> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:cert', () => setOpen(true));
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        purchaseOrderId: '',
        catalogId: '',
        certificateType: 'COA',
        certificateNumber: '',
    });
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [certs, ords] = await Promise.all([
                getQualityCerts({ page: 0, size: 20 }),
                getSupplierOrders({ page: 0, size: 100 }).catch(() => null),
            ]);
            setData(certs);
            if (ords?.content) setOrders(ords.content);
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
            await createQualityCert({
                purchaseOrderId: form.purchaseOrderId
                    ? Number(form.purchaseOrderId)
                    : undefined,
                catalogId: form.catalogId ? Number(form.catalogId) : undefined,
                certificateType: form.certificateType,
                certificateNumber: form.certificateNumber || undefined,
            });
            toast({ title: 'Certificate created', variant: 'success' });
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
            await deleteQualityCert(id);
            toast({ title: 'Certificate deleted', variant: 'success' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const columns: ColumnDef<SupplierQualityCertificate>[] = [
        {
            id: 'po',
            accessorFn: (row) =>
                row.poNumber ??
                (row.purchaseOrderId !== undefined
                    ? String(row.purchaseOrderId)
                    : ''),
            header: 'PO',
            cell: ({ row }) =>
                row.original.poNumber || row.original.purchaseOrderId || '-',
        },
        {
            id: 'catalog',
            accessorFn: (row) =>
                row.catalogName ??
                (row.catalogId !== undefined ? String(row.catalogId) : ''),
            header: 'Catalog',
            cell: ({ row }) =>
                row.original.catalogName || row.original.catalogId || '-',
        },
        {
            accessorKey: 'certificateType',
            header: 'Type',
            cell: ({ row }) => (
                <Badge>{row.original.certificateType}</Badge>
            ),
        },
        {
            accessorKey: 'certificateNumber',
            header: 'Number',
            cell: ({ row }) => row.original.certificateNumber || '-',
        },
        {
            accessorKey: 'dmsDocumentId',
            header: 'DMS',
            cell: ({ row }) => (
                <div className="text-xs">{row.original.dmsDocumentId || '-'}</div>
            ),
        },
        {
            id: 'actions',
            header: 'Action',
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
                                handleDelete(row.original.certificateId)
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
    const table = useTables<SupplierQualityCertificate>({
        data: data?.content ?? [],
        columns,
        getRowId: (row, index) =>
            row.certificateId !== undefined
                ? String(row.certificateId)
                : String(index),
    });
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Quality Certificates (CoA / CoC / Test Reports)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Certificate
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Quality Certificate</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Purchase Order</Label>
                                <Select
                                    value={form.purchaseOrderId || 'none'}
                                    onValueChange={(v) =>
                                        setForm({
                                            ...form,
                                            purchaseOrderId:
                                                v === 'none' ? '' : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select order (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            None
                                        </SelectItem>
                                        {orders.map((o) => (
                                            <SelectItem
                                                key={o.purchaseOrderId}
                                                value={String(
                                                    o.purchaseOrderId
                                                )}
                                            >
                                                {o.poNumber} (
                                                {o.purchaseOrderId})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Catalog Item</Label>
                                <CatalogSelect
                                    value={form.catalogId}
                                    onChange={(v) =>
                                        setForm({ ...form, catalogId: v })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.certificateType}
                                    onValueChange={(v) =>
                                        setForm({ ...form, certificateType: v })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COA">COA</SelectItem>
                                        <SelectItem value="COC">COC</SelectItem>
                                        <SelectItem value="TEST_REPORT">
                                            TEST_REPORT
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Certificate #</Label>
                                <Input
                                    placeholder="e.g. COA-2024-001"
                                    value={form.certificateNumber}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            certificateNumber: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <Button onClick={handleCreate} disabled={saving}>
                                {saving && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {saving ? 'Creating…' : 'Create (DMS mocked)'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Certificates</CardTitle>
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
                            emptyMessage="No certificates"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
