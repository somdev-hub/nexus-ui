'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { IconDotsVertical, IconEdit, IconTrash, IconTruck } from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ConsignmentStock } from '@/types/supplier';
import type { SupplierCatalog, ProductVariant, SupplierPriceTier } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { getSupplierPartnerships } from '@/lib/services/org-partnerships-service';
import { getSupplierCatalogs, getVariants, getPriceTiers } from '@/lib/services/supplier-catalog-service';
import { getOrgAddresses, formatOrgAddress, orgAddressOptionLabel, type OrgAddress } from '@/lib/services/org-profile-service';
import apiClient from '@/lib/api-client';
import {
    getConsignments,
    createConsignment,
    updateConsignment,
    fillConsignment,
    deleteConsignment,
} from '@/lib/services/supplier-inventory-service';
import { useToast } from '@/hooks/use-toast';

const buildConsignmentColumns = (
    onEdit: (c: ConsignmentStock) => void,
    onFill: (c: ConsignmentStock) => void,
    onDelete: (c: ConsignmentStock) => void
): ColumnDef<ConsignmentStock>[] => [
    {
        accessorKey: 'consignmentNumber',
        header: 'Consignment #',
        cell: ({ row }) => (
            <div className="font-medium">
                {row.original.consignmentNumber}
            </div>
        ),
    },
    {
        accessorKey: 'retailerOrgName',
        header: 'Retailer',
        cell: ({ row }) =>
            row.original.retailerOrgName || row.original.retailerOrgId,
    },
    {
        accessorKey: 'materialName',
        header: 'Material',
        cell: ({ row }) =>
            row.original.materialName || row.original.materialId || '—',
    },
    {
        accessorKey: 'catalogName',
        header: 'Catalog',
        cell: ({ row }) =>
            row.original.catalogName || row.original.catalogId || '—',
    },
    {
        accessorKey: 'variantValue',
        header: 'Variant',
        cell: ({ row }) =>
            row.original.variantValue || row.original.variantId || '—',
    },
    {
        accessorKey: 'priceTierName',
        header: 'Price Tier',
        cell: ({ row }) =>
            row.original.priceTierName ?? row.original.priceTierId ?? '—',
    },
    {
        id: 'quantityOnHand',
        accessorFn: (row) => row.quantityOnHand ?? 0,
        header: () => <div className="w-full text-right">On Hand</div>,
        cell: ({ row }) => (
            <div className="text-right">
                {row.original.quantityOnHand}
            </div>
        ),
    },
    {
        id: 'quantityAvailable',
        accessorFn: (row) => row.quantityAvailable ?? 0,
        header: () => <div className="w-full text-right">Available</div>,
        cell: ({ row }) => (
            <div className="text-right">
                {row.original.quantityAvailable}
            </div>
        ),
    },
    {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
            row.original.createdAt
                ? new Date(row.original.createdAt).toLocaleString()
                : '—',
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
                    <DropdownMenuItem onClick={() => onEdit(row.original)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFill(row.original)}>
                        <IconTruck className="mr-2 h-4 w-4" />
                        Fill Consignment
                    </DropdownMenuItem>
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

export default function ConsignmentPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<ConsignmentStock> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        retailerOrgId: '',
        catalogId: '',
        variantId: '',
        priceTierId: '',
        quantityOnHand: '',
    });
    const [editing, setEditing] = useState<ConsignmentStock | null>(null);
    const [filling, setFilling] = useState<ConsignmentStock | null>(null);
    const [pickupAddressId, setPickupAddressId] = useState('');
    const [deliveryAddressId, setDeliveryAddressId] = useState('');
    const [fillQuantity, setFillQuantity] = useState('');
    const [supplierAddresses, setSupplierAddresses] = useState<OrgAddress[]>([]);
    const [retailerAddresses, setRetailerAddresses] = useState<OrgAddress[]>([]);
    const [editCatalogId, setEditCatalogId] = useState('');
    const [editVariantId, setEditVariantId] = useState('');
    const [editPriceTierId, setEditPriceTierId] = useState('');
    const [editQty, setEditQty] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
    const [editPriceTiers, setEditPriceTiers] = useState<SupplierPriceTier[]>([]);
    const [retailers, setRetailers] = useState<
        { orgId: number; label: string }[]
    >([]);
    const [catalogs, setCatalogs] = useState<SupplierCatalog[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [priceTiers, setPriceTiers] = useState<SupplierPriceTier[]>([]);
    const { orgId } = useUserMetadata();

    useEffect(() => {
        if (!orgId) return;
        getOrgAddresses(orgId).then(setSupplierAddresses).catch(() => {});
    }, [orgId]);

    useEffect(() => {
        if (!filling?.retailerOrgId) return;
        getOrgAddresses(filling.retailerOrgId).then(setRetailerAddresses).catch(() => {});
    }, [filling]);

    const [deleting, setDeleting] = useState<ConsignmentStock | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [fillingBusy, setFillingBusy] = useState(false);
    const [contractError, setContractError] = useState('');
    const load = async () => {
        setLoading(true);
        try {
            const res = await getConsignments({ page: 0, size: 100 });
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
                const res = await getSupplierCatalogs({ page: 0, size: 100 });
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
        if (!form.catalogId) {
            setVariants([]);
            setPriceTiers([]);
            return;
        }
        let active = true;
        (async () => {
            try {
                const [vs, pts] = await Promise.all([
                    getVariants({ catalogId: Number(form.catalogId) }),
                    getPriceTiers({ catalogId: Number(form.catalogId) }),
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
    }, [form.catalogId]);

    useEffect(() => {
        if (!editCatalogId) {
            setEditVariants([]);
            setEditPriceTiers([]);
            return;
        }
        let active = true;
        (async () => {
            try {
                const [vs, pts] = await Promise.all([
                    getVariants({ catalogId: Number(editCatalogId) }),
                    getPriceTiers({ catalogId: Number(editCatalogId) }),
                ]);
                if (!active) return;
                setEditVariants(Array.isArray(vs) ? vs : (vs.content ?? []));
                setEditPriceTiers(Array.isArray(pts) ? pts : (pts.content ?? []));
            } catch {
                if (active) {
                    setEditVariants([]);
                    setEditPriceTiers([]);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, [editCatalogId]);
    useEffect(() => {
        if (!form.retailerOrgId) {
            setContractError('');
            return;
        }
        let active = true;
        (async () => {
            try {
                const res = await apiClient.get<{ hasActiveContract?: boolean }>(
                    `/iam/core/retailer/supplier-contracts/check?retailerOrgId=${form.retailerOrgId}&contractType=CONSIGNMENT`
                );
                if (!active) return;
                if (!res.data?.hasActiveContract) {
                    setContractError('No active CONSIGNMENT contract with this retailer.');
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

    const handleCreate = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createConsignment({
                retailerOrgId: Number(form.retailerOrgId),
                catalogId: form.catalogId ? Number(form.catalogId) : undefined,
                variantId: form.variantId ? Number(form.variantId) : undefined,
                priceTierId: form.priceTierId ? Number(form.priceTierId) : undefined,
                quantityOnHand: Number(form.quantityOnHand),
            });
            toast({ title: 'Consignment created', variant: 'success' });
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
    const handleEdit = async () => {
        if (!editing || saving) return;
        setSaving(true);
        try {
            await updateConsignment(editing.consignmentId, {
                retailerOrgId: Number(editing.retailerOrgId),
                catalogId: editCatalogId ? Number(editCatalogId) : undefined,
                variantId: editVariantId ? Number(editVariantId) : undefined,
                priceTierId: editPriceTierId ? Number(editPriceTierId) : undefined,
                quantityOnHand: Number(editQty),
                notes: editNotes || undefined,
            });
            toast({ title: 'Consignment updated', variant: 'success' });
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
            await deleteConsignment(deleting.consignmentId);
            toast({ title: 'Consignment deleted', variant: 'success' });
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
    const openFill = (c: ConsignmentStock) => {
        setFilling(c);
        setPickupAddressId('');
        setDeliveryAddressId('');
    };
    const openConsignmentEdit = (c: ConsignmentStock) => {
        setEditing(c);
        setEditCatalogId(c.catalogId ? String(c.catalogId) : '');
        setEditVariantId(c.variantId ? String(c.variantId) : '');
        setEditPriceTierId(c.priceTierId ? String(c.priceTierId) : '');
        setEditQty(String(c.quantityOnHand ?? ''));
        setEditNotes(c.notes ?? '');
    };
    const columns = buildConsignmentColumns(
        openConsignmentEdit,
        openFill,
        (c) => setDeleting(c)
    );
    const consignments = data?.content ?? [];
    const table = useTables<ConsignmentStock>({
        data: consignments,
        columns,
        getRowId: (row, index) =>
            row.consignmentId !== undefined
                ? String(row.consignmentId)
                : String(index),
    });
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Consignment Stock (Retailer Location)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Consignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Consignment</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Retailer</Label>
                                {retailers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                                        There is no established partnership with
                                        any retailer yet. Accept a retailer
                                        invitation first to add consignment
                                        stock.
                                    </p>
                                ) : (
                                    <Select
                                        value={
                                            form.retailerOrgId
                                                ? String(form.retailerOrgId)
                                                : ''
                                        }
                                        onValueChange={(v) =>
                                            setForm({
                                                ...form,
                                                retailerOrgId: v,
                                            })
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
                                    value={form.catalogId ? String(form.catalogId) : ''}
                                    onValueChange={(v) => setForm({ ...form, catalogId: v })}
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
                                    value={form.variantId ? String(form.variantId) : ''}
                                    onValueChange={(v) => setForm({ ...form, variantId: v })}
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
                                    value={form.priceTierId ? String(form.priceTierId) : ''}
                                    onValueChange={(v) => setForm({ ...form, priceTierId: v })}
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
                            <div className="grid gap-2">
                                <Label>Qty On Hand</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={form.quantityOnHand}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            quantityOnHand: e.target.value,
                                        })
                                    }
                                />
                            </div>
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
            <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Consignment ({editing?.consignmentNumber})</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Catalog Item</Label>
                            <Select value={editCatalogId} onValueChange={setEditCatalogId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select catalog item" /></SelectTrigger>
                                <SelectContent>
                                    {catalogs.map((c) => (
                                        <SelectItem key={c.catalogId} value={String(c.catalogId)}>{c.name} ({c.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Variant</Label>
                            <Select value={editVariantId} onValueChange={setEditVariantId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select variant (optional)" /></SelectTrigger>
                                <SelectContent>
                                    {editVariants.map((v, i) => (
                                        <SelectItem key={v.variantId ?? i} value={String(v.variantId)}>{v.variantValue} ({v.variantType})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Price Tier</Label>
                            <Select value={editPriceTierId} onValueChange={setEditPriceTierId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select price tier (optional)" /></SelectTrigger>
                                <SelectContent>
                                    {editPriceTiers.map((t, i) => (
                                        <SelectItem key={t.tierId ?? i} value={String(t.tierId)}>{t.tierName ?? `Tier ${t.tierId}`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity On Hand</Label>
                            <Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes</Label>
                            <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                        </div>
                        <Button onClick={handleEdit} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={filling !== null} onOpenChange={(v) => !v && setFilling(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Fill Consignment ({filling?.consignmentNumber})</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Catalog Item</Label>
                            <Input value={filling?.catalogName || filling?.catalogId || ''} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label>Variant</Label>
                            <Input value={filling?.variantValue || filling?.variantId || ''} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label>Price Tier</Label>
                            <Input value={filling?.priceTierId || ''} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label>Pickup Address</Label>
                            <Select value={pickupAddressId} onValueChange={setPickupAddressId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select pickup address" /></SelectTrigger>
                                <SelectContent>
                                    {supplierAddresses.map((a) => (
                                        <SelectItem key={a.orgAddressId} value={String(a.orgAddressId)}>
                                            {orgAddressOptionLabel(a)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Delivery Address</Label>
                            <Select value={deliveryAddressId} onValueChange={setDeliveryAddressId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select delivery address" /></SelectTrigger>
                                <SelectContent>
                                    {retailerAddresses.map((a) => (
                                        <SelectItem key={a.orgAddressId} value={String(a.orgAddressId)}>
                                            {orgAddressOptionLabel(a)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <Input type="number" placeholder="e.g. 100" value={fillQuantity} onChange={(e) => setFillQuantity(e.target.value)} min="1" />
                        </div>
                        <Button onClick={async () => {
                            if (!filling) return;
    const fillQty = Number(fillQuantity);
                            if (!fillQty || fillQty <= 0) {
                                toast({ title: 'Quantity is required', variant: 'destructive' });
                                return;
                            }
                            const pickup = supplierAddresses.find((a) => String(a.orgAddressId) === pickupAddressId);
                            const delivery = retailerAddresses.find((a) => String(a.orgAddressId) === deliveryAddressId);
                            try {
                                setFillingBusy(true);
                                await fillConsignment(
                                    filling.consignmentId,
                                    pickup ? formatOrgAddress(pickup) : undefined,
                                    delivery ? formatOrgAddress(delivery) : undefined,
                                    fillQty
                                );
                                toast({ title: 'Consignment shipment generated', variant: 'success' });
                                setFilling(null);
                                load();
                            } catch (e) {
                                toast({
                                    title: e instanceof Error ? e.message : String(e),
                                    variant: 'destructive',
                                });
                            } finally {
                                setFillingBusy(false);
                            }
                        }} disabled={fillingBusy || !fillQuantity || Number(fillQuantity) <= 0}>
                            {fillingBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconTruck className="mr-2 h-4 w-4" />} Fill Consignment
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
                        <AlertDialogTitle>Delete consignment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete consignment &ldquo;
                            {deleting?.consignmentNumber}&rdquo;.
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
                    <CardTitle>Consignment Inventory</CardTitle>
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
                            emptyMessage="No consignment stock"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
