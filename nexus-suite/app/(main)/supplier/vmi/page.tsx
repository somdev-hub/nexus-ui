'use client';
import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { VmiConfig, VmiSuggestion } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { getSupplierPartnerships } from '@/lib/services/org-partnerships-service';
import { getSupplierCatalogs, getVariants, getPriceTiers } from '@/lib/services/supplier-catalog-service';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    getVmis,
    createVmi,
    updateVmi,
    deleteVmi,
    getVmiSuggestions,
    triggerVmiReplenish,
} from '@/lib/services/supplier-inventory-service';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

const emptyForm = {
    retailerOrgId: '',
    catalogId: '',
    variantId: '',
    priceTierId: '',
    minLevel: '',
    maxLevel: '',
    reorderPoint: '',
    reorderQuantity: '',
    autoReplenish: true,
};

export default function VmiPage() {
    const { toast } = useToast();
    const [data, setData] = useState<PaginatedResponse<VmiConfig> | null>(null);
    const [suggestions, setSuggestions] = useState<VmiSuggestion[] | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState<VmiConfig | null>(null);
    const [editForm, setEditForm] = useState(emptyForm);
    const [deleting, setDeleting] = useState<VmiConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [contractError, setContractError] = useState('');
    const [retailers, setRetailers] = useState<
        { orgId: number; label: string }[]
    >([]);
    const [catalogs, setCatalogs] = useState<any[]>([]);
    const [variants, setVariants] = useState<any[]>([]);
    const [priceTiers, setPriceTiers] = useState<any[]>([]);
    const { orgId } = useUserMetadata();
    const load = async () => {
        setLoading(true);
        try {
            const [v, s] = await Promise.all([
                getVmis({ page: 0, size: 20 }),
                getVmiSuggestions().catch(() => null),
            ]);
            setData(v);
            setSuggestions(s);
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
                    if (String((p as { partnershipType?: unknown }).partnershipType ?? '').toUpperCase() === 'LOGISTICS') continue;
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
    useEffect(() => {
        let active = true;
        const loadCatalogs = async () => {
            try {
                const res = await getSupplierCatalogs({ page: 0, size: 100 } as any);
                if (!active) return;
                setCatalogs(Array.isArray(res) ? res : (res.content ?? []));
            } catch {
                // leave dropdown empty
            }
        };
        loadCatalogs();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const activeCatalog = form.catalogId || editForm.catalogId;
        if (!activeCatalog) {
            setVariants([]);
            setPriceTiers([]);
            return;
        }
        let active = true;
        (async () => {
            try {
                const [vs, pts] = await Promise.all([
                    getVariants({ catalogId: Number(activeCatalog) }),
                    getPriceTiers({ catalogId: Number(activeCatalog) }),
                ]);
                if (!active) return;
                setVariants(Array.isArray(vs) ? vs : (vs.content ?? []));
                setPriceTiers(Array.isArray(pts) ? pts : (pts.content ?? []));
            } catch {
                if (active) {
                    setVariants([]);
                    setPriceTiers([]);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, [form.catalogId, editForm.catalogId]);
    useEffect(() => {
        if (!form.retailerOrgId) {
            setContractError('');
            return;
        }
        let active = true;
        (async () => {
            try {
                const res = await apiClient.get<any>(
                    `/iam/core/retailer/supplier-contracts/check?retailerOrgId=${form.retailerOrgId}&contractType=VMI`
                );
                if (!active) return;
                if (!res.data?.hasActiveContract) {
                    setContractError('No active VMI contract with this retailer.');
                } else {
                    setContractError('');
                }
            } catch {
                if (active) setContractError('Could not verify contract.');
            }
        })();
        return () => {
            active = false;
        };
    }, [form.retailerOrgId]);

    const toPayload = (f: typeof emptyForm) => ({
        retailerOrgId: Number(f.retailerOrgId),
        catalogId: f.catalogId ? Number(f.catalogId) : undefined,
        variantId: f.variantId ? Number(f.variantId) : undefined,
        priceTierId: f.priceTierId ? Number(f.priceTierId) : undefined,
        minLevel: f.minLevel ? Number(f.minLevel) : undefined,
        maxLevel: f.maxLevel ? Number(f.maxLevel) : undefined,
        reorderPoint: f.reorderPoint ? Number(f.reorderPoint) : undefined,
        reorderQuantity: f.reorderQuantity
            ? Number(f.reorderQuantity)
            : undefined,
        autoReplenish: f.autoReplenish,
    });
    const handleCreate = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createVmi(toPayload(form));
            toast({ title: 'VMI created', variant: 'success' });
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
    const openEdit = (v: VmiConfig) => {
        setEditing(v);
        setEditForm({
            retailerOrgId: v.retailerOrgId ? String(v.retailerOrgId) : '',
            catalogId: v.catalogId ? String(v.catalogId) : '',
            variantId: v.variantId ? String(v.variantId) : '',
            priceTierId: v.priceTierId ? String(v.priceTierId) : '',
            minLevel:
                v.minLevel !== undefined && v.minLevel !== null
                    ? String(v.minLevel)
                    : '',
            maxLevel:
                v.maxLevel !== undefined && v.maxLevel !== null
                    ? String(v.maxLevel)
                    : '',
            reorderPoint:
                v.reorderPoint !== undefined && v.reorderPoint !== null
                    ? String(v.reorderPoint)
                    : '',
            reorderQuantity:
                v.reorderQuantity !== undefined && v.reorderQuantity !== null
                    ? String(v.reorderQuantity)
                    : '',
            autoReplenish: v.autoReplenish ?? false,
        });
    };
    const handleEdit = async () => {
        if (!editing || saving) return;
        setSaving(true);
        try {
            await updateVmi(editing.vmiId, toPayload(editForm));
            toast({ title: 'VMI updated', variant: 'success' });
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
            await deleteVmi(deleting.vmiId);
            toast({ title: 'VMI deleted', variant: 'success' });
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
    const replenish = async (id: number) => {
        try {
            await triggerVmiReplenish(id);
            toast({ title: 'Replenishment triggered', variant: 'success' });
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
            <div className="grid gap-2">
                <Label>Retailer</Label>
                {retailers.length === 0 ? (
                    <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                        There is no established partnership with any retailer
                        yet. Accept a retailer invitation first to configure
                        VMI.
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
                <Select
                    value={value.catalogId ? String(value.catalogId) : ''}
                    onValueChange={(v) => setValue({ ...value, catalogId: v })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select catalog item" />
                    </SelectTrigger>
                    <SelectContent>
                        {catalogs.map((c) => (
                            <SelectItem key={c.catalogId} value={String(c.catalogId)}>
                                {c.name} ({c.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>Variant</Label>
                <Select
                    value={value.variantId ? String(value.variantId) : ''}
                    onValueChange={(v) => setValue({ ...value, variantId: v })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select variant (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {variants.map((v, i) => (
                            <SelectItem key={v.variantId ?? i} value={String(v.variantId)}>
                                {v.variantValue} ({v.variantType})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>Price Tier</Label>
                <Select
                    value={value.priceTierId ? String(value.priceTierId) : ''}
                    onValueChange={(v) => setValue({ ...value, priceTierId: v })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select price tier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {priceTiers.map((t, i) => (
                            <SelectItem key={t.tierId ?? i} value={String(t.tierId)}>
                                {t.tierName ?? `Tier ${t.tierId}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Min Level</Label>
                    <Input
                        placeholder="e.g. 100"
                        value={value.minLevel}
                        onChange={(e) =>
                            setValue({ ...value, minLevel: e.target.value })
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Max Level</Label>
                    <Input
                        placeholder="e.g. 2000"
                        value={value.maxLevel}
                        onChange={(e) =>
                            setValue({ ...value, maxLevel: e.target.value })
                        }
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Reorder Point</Label>
                    <Input
                        placeholder="e.g. 500"
                        value={value.reorderPoint}
                        onChange={(e) =>
                            setValue({ ...value, reorderPoint: e.target.value })
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Reorder Qty</Label>
                    <Input
                        placeholder="e.g. 1000"
                        value={value.reorderQuantity}
                        onChange={(e) =>
                            setValue({
                                ...value,
                                reorderQuantity: e.target.value,
                            })
                        }
                    />
                </div>
            </div>
            <div className="flex items-center justify-between gap-3">
                <Label>Auto Replenish</Label>
                <Switch
                    checked={value.autoReplenish}
                    onCheckedChange={(v) =>
                        setValue({ ...value, autoReplenish: v })
                    }
                />
            </div>
        </>
    );
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Vendor Managed Inventory (VMI)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create VMI
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New VMI Config</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            {renderFields(form, setForm)}
                            {contractError && <p className="text-sm text-red-600">{contractError}</p>}
                            <Button onClick={handleCreate} disabled={saving || !!contractError}>
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
                        <DialogTitle>Edit VMI Config</DialogTitle>
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
                        <AlertDialogTitle>Delete VMI config?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete VMI #{deleting?.vmiId}.
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
            {suggestions?.length ? (
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Replenishment Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-2">
                            {suggestions.map((s: VmiSuggestion) => (
                                <div
                                    key={s.vmiId}
                                    className="flex items-center justify-between border-b py-2"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            VMI #{s.vmiId} - {s.catalogName || s.materialName || `Material ${s.materialId}`} (Available {s.available} / Reorder {s.reorderPoint})
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Available {s.available} / Reorder{' '}
                                            {s.reorderPoint} • Suggested{' '}
                                            {s.suggestedQuantity}
                                        </div>
                                    </div>
                                    <Badge variant="destructive">
                                        Needs Replenish
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : null}
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>VMI Configs</CardTitle>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Retailer</TableHead>
                                    <TableHead>Material</TableHead>
                                    <TableHead>Catalog</TableHead>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>Price Tier</TableHead>
                                    <TableHead>Min / Max</TableHead>
                                    <TableHead>Reorder Point</TableHead>
                                    <TableHead>Reorder Qty</TableHead>
                                    <TableHead>Auto</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map((v: VmiConfig) => (
                                    <TableRow key={v.vmiId}>
                                        <TableCell>
                                            {v.retailerOrgName ||
                                                v.retailerOrgId}
                                        </TableCell>
                                        <TableCell>
                                            {v.materialName || v.materialId || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {v.catalogName || v.catalogId || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {v.variantValue || v.variantId || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {v.priceTierName || v.priceTierId || '—'}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {v.minLevel ?? '-'} /{' '}
                                            {v.maxLevel ?? '-'}
                                        </TableCell>
                                        <TableCell>{v.reorderPoint ?? '—'}</TableCell>
                                        <TableCell>{v.reorderQuantity ?? '—'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    v.autoReplenish
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {String(v.autoReplenish)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => replenish(v.vmiId)}>
                                                        Replenish
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEdit(v)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDeleting(v)}>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No VMI
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
