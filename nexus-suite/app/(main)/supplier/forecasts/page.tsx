'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { IconDotsVertical, IconEdit, IconSend, IconTrash } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CollaborativeForecast } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables } from '@/hooks/use-tables';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CatalogSelect } from '@/components/catalog-select';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { getSupplierPartnerships } from '@/lib/services/org-partnerships-service';
import { Textarea } from '@/components/ui/textarea';
import {
    getForecasts,
    createForecast,
    updateForecast,
    deleteForecast,
    transitionForecast,
} from '@/lib/services/supplier-commercial-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';
import { DatePicker } from '@/components/ui/date-picker';
import { formatYmd, parseYmd } from '@/lib/date-utils';

const emptyForm = {
    retailerOrgId: '',
    catalogId: '',
    periodStart: '',
    periodEnd: '',
    forecastQuantity: '',
    confidencePct: '',
    notes: '',
};

const buildForecastColumns = (
    onShare: (f: CollaborativeForecast) => void,
    onEdit: (f: CollaborativeForecast) => void,
    onDelete: (f: CollaborativeForecast) => void
): ColumnDef<CollaborativeForecast>[] => [
    {
        accessorKey: 'retailerOrgName',
        header: 'Retailer',
        cell: ({ row }) =>
            row.original.retailerOrgName || row.original.retailerOrgId || '-',
    },
    {
        accessorKey: 'catalogName',
        header: 'Catalog',
        cell: ({ row }) =>
            row.original.catalogName || row.original.catalogId || '-',
    },
    {
        accessorKey: 'periodStart',
        header: 'Period',
        cell: ({ row }) => (
            <div className="text-xs">
                {row.original.periodStart} → {row.original.periodEnd}
            </div>
        ),
    },
    {
        id: 'qty',
        accessorFn: (row) => row.forecastQuantity,
        header: () => <div className="w-full text-right">Qty</div>,
        cell: ({ row }) => (
            <div className="text-right">{row.original.forecastQuantity}</div>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
        accessorKey: 'actions',
        header: 'Action',
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
                    {row.original.status === 'DRAFT' && (
                        <DropdownMenuItem onClick={() => onShare(row.original)}>
                            <IconSend className="mr-2 h-4 w-4" />
                            Share
                        </DropdownMenuItem>
                    )}
                    {row.original.status === 'DRAFT' && (
                        <DropdownMenuItem onClick={() => onEdit(row.original)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(row.original)}
                    >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];

export default function ForecastsPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<CollaborativeForecast> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:forecast', () => setOpen(true));
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState<CollaborativeForecast | null>(null);
    const [editForm, setEditForm] = useState(emptyForm);
    const [deleting, setDeleting] = useState<CollaborativeForecast | null>(
        null
    );
    const [saving, setSaving] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [retailers, setRetailers] = useState<
        { orgId: number; label: string }[]
    >([]);
    const { orgId } = useUserMetadata();
    const load = async () => {
        setLoading(true);
        try {
            const res = await getForecasts({ page: 0, size: 100 });
            setData(res);
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        let active = true;
        const loadRetailers = async () => {
            try {
                const res = await getSupplierPartnerships();
                if (!active) return;
                const own = Number(orgId);
                const seen = new Map<number, string>();
                for (const p of res.content ?? []) {
                    if (p.status === 'TERMINATED') continue;
                    const isPrimary =
                        Number.isFinite(own) &&
                        p.primaryOrgId !== undefined &&
                        Number(p.primaryOrgId) === own;
                    const counterId = isPrimary
                        ? p.secondaryOrgId
                        : p.primaryOrgId;
                    if (counterId === undefined) continue;
                    const id = Number(counterId);
                    if (!Number.isFinite(id) || seen.has(id)) continue;
                    const name = isPrimary
                        ? p.secondaryOrgName
                        : p.primaryOrgName;
                    seen.set(id, name ? `${name} (#${id})` : `Org #${id}`);
                }
                setRetailers(
                    [...seen.entries()].map(([orgId, label]) => ({
                        orgId,
                        label,
                    }))
                );
            } catch {
                // leave dropdown empty; global 500 toast already fired
            }
        };
        loadRetailers();
        return () => {
            active = false;
        };
    }, [orgId]);
    const toPayload = (f: typeof emptyForm) => ({
        retailerOrgId: f.retailerOrgId ? Number(f.retailerOrgId) : undefined,
        catalogId: f.catalogId ? Number(f.catalogId) : undefined,
        periodStart: f.periodStart,
        periodEnd: f.periodEnd,
        forecastQuantity: Number(f.forecastQuantity),
        confidencePct: f.confidencePct ? Number(f.confidencePct) : undefined,
        notes: f.notes || undefined,
    });
    const handleCreate = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createForecast(toPayload(form));
            toast({ title: 'Forecast created', variant: 'success' });
            setOpen(false);
            setForm(emptyForm);
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
    const openEdit = (f: CollaborativeForecast) => {
        setEditing(f);
        setEditForm({
            retailerOrgId: f.retailerOrgId ? String(f.retailerOrgId) : '',
            catalogId: f.catalogId ? String(f.catalogId) : '',
            periodStart: f.periodStart ?? '',
            periodEnd: f.periodEnd ?? '',
            forecastQuantity: String(f.forecastQuantity ?? ''),
            confidencePct:
                f.confidencePct !== undefined && f.confidencePct !== null
                    ? String(f.confidencePct)
                    : '',
            notes: f.notes ?? '',
        });
    };
    const handleEdit = async () => {
        if (!editing || saving) return;
        setSaving(true);
        try {
            await updateForecast(editing.forecastId, toPayload(editForm));
            toast({ title: 'Forecast updated', variant: 'success' });
            setEditing(null);
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
    const handleDelete = async () => {
        if (!deleting || deleteBusy) return;
        setDeleteBusy(true);
        try {
            await deleteForecast(deleting.forecastId);
            toast({ title: 'Forecast deleted', variant: 'success' });
            setDeleting(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setDeleteBusy(false);
        }
    };
    const share = async (id: number) => {
        try {
            await transitionForecast(id, 'SHARED');
            toast({ title: 'Shared', variant: 'success' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const renderFields = (
        value: typeof emptyForm,
        setValue: (v: typeof emptyForm) => void
    ) => (
        <>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Retailer</Label>
                    {retailers.length === 0 ? (
                        <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                            There is no established partnership with any
                            retailer yet. Accept a retailer invitation first to
                            share a forecast.
                        </p>
                    ) : (
                        <Select
                            value={
                                value.retailerOrgId
                                    ? String(value.retailerOrgId)
                                    : ''
                            }
                            onValueChange={(v) =>
                                setValue({ ...value, retailerOrgId: v })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select retailer" />
                            </SelectTrigger>
                            <SelectContent>
                                {retailers.map((r) => (
                                    <SelectItem
                                        key={r.orgId}
                                        value={String(r.orgId)}
                                    >
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label>Catalog Item</Label>
                    <CatalogSelect
                        value={value.catalogId}
                        onChange={(v) => setValue({ ...value, catalogId: v })}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Period Start</Label>
                    <DatePicker
                        date={parseYmd(value.periodStart)}
                        onDateChange={(d) =>
                            setValue({
                                ...value,
                                periodStart: formatYmd(d),
                            })
                        }
                        placeholder="Pick start date"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Period End</Label>
                    <DatePicker
                        date={parseYmd(value.periodEnd)}
                        onDateChange={(d) =>
                            setValue({ ...value, periodEnd: formatYmd(d) })
                        }
                        placeholder="Pick end date"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Qty</Label>
                    <Input
                        type="number"
                        placeholder="e.g. 1000"
                        value={value.forecastQuantity}
                        onChange={(e) =>
                            setValue({
                                ...value,
                                forecastQuantity: e.target.value,
                            })
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Confidence %</Label>
                    <Input
                        type="number"
                        placeholder="e.g. 85"
                        value={value.confidencePct}
                        onChange={(e) =>
                            setValue({
                                ...value,
                                confidencePct: e.target.value,
                            })
                        }
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                    placeholder="e.g. Seasonal uplift expected"
                    value={value.notes}
                    onChange={(e) =>
                        setValue({ ...value, notes: e.target.value })
                    }
                />
            </div>
        </>
    );
    const columns = buildForecastColumns(
        (f) => {
            void share(f.forecastId);
        },
        openEdit,
        (f) => setDeleting(f)
    );
    const forecasts = data?.content ?? [];
    const table = useTables<CollaborativeForecast>({
        data: forecasts,
        columns,
        getRowId: (row, index) =>
            row.forecastId !== undefined ? String(row.forecastId) : String(index),
    });
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Collaborative Forecasting (Supplier ↔ Retailer)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Share Forecast
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Forecast</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            {renderFields(form, setForm)}
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
            <Dialog
                open={editing !== null}
                onOpenChange={(v) => !v && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Forecast</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6">
                        {renderFields(editForm, setEditForm)}
                        <Button onClick={handleEdit} disabled={saving}>
                            {saving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={deleting !== null}
                onOpenChange={(v) => !v && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete forecast?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete forecast #
                            {deleting?.forecastId}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteBusy}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteBusy}
                        >
                            {deleteBusy && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {deleteBusy ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Forecasts</CardTitle>
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
                            emptyMessage="No forecasts"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
