'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { SupplierPriceTier } from '@/types/supplier';
import type { SupplierContract } from '@/types/supplier-contracts';
import { getSupplierContractsForSupplier } from '@/lib/services/supplier-contracts-supplier-service';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CatalogSelect } from '@/components/catalog-select';
import { Money } from '@/components/money';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currency';
import {
    getPriceTiers,
    createPriceTier,
    updatePriceTier,
    deletePriceTier,
} from '@/lib/services/supplier-catalog-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';
import { DatePicker } from '@/components/ui/date-picker';
import { formatYmd, parseYmd } from '@/lib/date-utils';

export default function SupplierPricingPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<SupplierPriceTier> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:pricing', () => setOpen(true));
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        catalogId: '',
        minQuantity: '',
        maxQuantity: '',
        unitPrice: '',
        customerSegment: '',
        tierName: '',
        contractId: '',
        validFrom: '',
        validTo: '',
        currency: 'USD',
    });

    const [contracts, setContracts] = useState<SupplierContract[]>([]);
    const [editing, setEditing] = useState<SupplierPriceTier | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [tiers, shared] = await Promise.all([
                getPriceTiers({ page: 0, size: 20 }),
                getSupplierContractsForSupplier(0, 100).catch(() => null),
            ]);
            setData(tiers);
            setContracts(
                (shared?.content ?? []).filter((c) => c.status === 'ACTIVE')
            );
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

    const handleCreate = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createPriceTier({
                catalogId: Number(form.catalogId),
                minQuantity: form.minQuantity
                    ? Number(form.minQuantity)
                    : undefined,
                maxQuantity: form.maxQuantity
                    ? Number(form.maxQuantity)
                    : undefined,
                unitPrice: Number(form.unitPrice),
                customerSegment: form.customerSegment || undefined,
                tierName: form.tierName || undefined,
                contractId: form.contractId
                    ? Number(form.contractId)
                    : undefined,
                validFrom: form.validFrom || undefined,
                validTo: form.validTo || undefined,
                currency: form.currency || 'USD',
            });
            toast({ title: 'Price tier created', variant: 'success' });
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

    const [editForm, setEditForm] = useState({
        catalogId: '',
        minQuantity: '',
        maxQuantity: '',
        unitPrice: '',
        customerSegment: '',
        tierName: '',
        contractId: '',
        validFrom: '',
        validTo: '',
        currency: 'USD',
    });
    const [editContractTouched, setEditContractTouched] = useState(false);

    const openEdit = (t: SupplierPriceTier) => {
        setEditing(t);
        setEditContractTouched(false);
        setEditForm({
            catalogId: t.catalogId ? String(t.catalogId) : '',
            minQuantity:
                t.minQuantity !== undefined && t.minQuantity !== null
                    ? String(t.minQuantity)
                    : '',
            maxQuantity:
                t.maxQuantity !== undefined && t.maxQuantity !== null
                    ? String(t.maxQuantity)
                    : '',
            unitPrice:
                t.unitPrice !== undefined && t.unitPrice !== null
                    ? String(t.unitPrice)
                    : '',
            customerSegment: t.customerSegment ?? '',
            tierName: t.tierName ?? '',
            contractId:
                t.contractId !== undefined && t.contractId !== null
                    ? String(t.contractId)
                    : '',
            validFrom: t.validFrom ?? '',
            validTo: t.validTo ?? '',
            currency: t.currency ?? 'USD',
        });
    };

    const handleEdit = async () => {
        if (!editing || saving) return;
        setSaving(true);
        try {
            await updatePriceTier(editing.tierId, {
                minQuantity: editForm.minQuantity
                    ? Number(editForm.minQuantity)
                    : undefined,
                maxQuantity: editForm.maxQuantity
                    ? Number(editForm.maxQuantity)
                    : undefined,
                unitPrice: editForm.unitPrice
                    ? Number(editForm.unitPrice)
                    : undefined,
                customerSegment: editForm.customerSegment || undefined,
                tierName: editForm.tierName || undefined,
                ...(editContractTouched
                    ? editForm.contractId
                        ? { contractId: Number(editForm.contractId) }
                        : { clearContract: true }
                    : {}),
                validFrom: editForm.validFrom || undefined,
                validTo: editForm.validTo || undefined,
                currency: editForm.currency || undefined,
            });
            toast({ title: 'Price tier updated', variant: 'success' });
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

    const handleDelete = async (id: number) => {
        try {
            await deletePriceTier(id);
            toast({ title: 'Price tier deleted', variant: 'success' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Dynamic Pricing (Volume / Segment / Contract / Validity)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Tier
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Price Tier</DialogTitle>
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Min Qty</Label>
                                    <Input
                                        placeholder="e.g. 10"
                                        value={form.minQuantity}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                minQuantity: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Max Qty</Label>
                                    <Input
                                        placeholder="e.g. 100"
                                        value={form.maxQuantity}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                maxQuantity: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Unit Price</Label>
                                <Input
                                    placeholder="e.g. 99.50"
                                    value={form.unitPrice}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            unitPrice: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Currency</Label>
                                <Select
                                    value={form.currency || 'USD'}
                                    onValueChange={(v) =>
                                        setForm({ ...form, currency: v })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem
                                                key={c.code}
                                                value={c.code}
                                            >
                                                {c.code} — {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Customer Segment</Label>
                                <Input
                                    value={form.customerSegment}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            customerSegment: e.target.value,
                                        })
                                    }
                                    placeholder="ENTERPRISE / SMB"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tier Name</Label>
                                <Input
                                    placeholder="e.g. Volume-100+"
                                    value={form.tierName}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tierName: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Contract (optional)</Label>
                                <Select
                                    value={form.contractId || 'none'}
                                    onValueChange={(v) =>
                                        setForm({
                                            ...form,
                                            contractId:
                                                v === 'none' ? '' : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="No contract — applies generally" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No contract
                                        </SelectItem>
                                        {contracts.map((c) => (
                                            <SelectItem
                                                key={c.contractId}
                                                value={String(c.contractId)}
                                            >
                                                {c.contractNumber} —{' '}
                                                {c.contractName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Valid From</Label>
                                    <DatePicker
                                        date={parseYmd(form.validFrom)}
                                        onDateChange={(d) =>
                                            setForm({
                                                ...form,
                                                validFrom: formatYmd(d),
                                            })
                                        }
                                        placeholder="Pick start date"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Valid To</Label>
                                    <DatePicker
                                        date={parseYmd(form.validTo)}
                                        onDateChange={(d) =>
                                            setForm({
                                                ...form,
                                                validTo: formatYmd(d),
                                            })
                                        }
                                        placeholder="Pick end date"
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
                <Dialog
                    open={editing !== null}
                    onOpenChange={(v) => !v && setEditing(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Price Tier</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Catalog Item</Label>
                                <CatalogSelect
                                    value={editForm.catalogId}
                                    onChange={() => undefined}
                                    placeholder="Select catalog item"
                                    disabled
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Min Qty</Label>
                                    <Input
                                        placeholder="e.g. 10"
                                        value={editForm.minQuantity}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                minQuantity: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Max Qty</Label>
                                    <Input
                                        placeholder="e.g. 100"
                                        value={editForm.maxQuantity}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                maxQuantity: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Unit Price</Label>
                                <Input
                                    placeholder="e.g. 99.50"
                                    value={editForm.unitPrice}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            unitPrice: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Currency</Label>
                                <Select
                                    value={editForm.currency || 'USD'}
                                    onValueChange={(v) =>
                                        setEditForm({
                                            ...editForm,
                                            currency: v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem
                                                key={c.code}
                                                value={c.code}
                                            >
                                                {c.code} — {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Customer Segment</Label>
                                <Input
                                    value={editForm.customerSegment}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            customerSegment: e.target.value,
                                        })
                                    }
                                    placeholder="ENTERPRISE / SMB"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tier Name</Label>
                                <Input
                                    placeholder="e.g. Volume-100+"
                                    value={editForm.tierName}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            tierName: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Contract (optional)</Label>
                                <Select
                                    value={editForm.contractId || 'none'}
                                    onValueChange={(v) => {
                                        setEditForm({
                                            ...editForm,
                                            contractId:
                                                v === 'none' ? '' : v,
                                        });
                                        setEditContractTouched(true);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="No contract — applies generally" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No contract
                                        </SelectItem>
                                        {contracts.map((c) => (
                                            <SelectItem
                                                key={c.contractId}
                                                value={String(c.contractId)}
                                            >
                                                {c.contractNumber} —{' '}
                                                {c.contractName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Valid From</Label>
                                    <DatePicker
                                        date={parseYmd(editForm.validFrom)}
                                        onDateChange={(d) =>
                                            setEditForm({
                                                ...editForm,
                                                validFrom: formatYmd(d),
                                            })
                                        }
                                        placeholder="Pick start date"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Valid To</Label>
                                    <DatePicker
                                        date={parseYmd(editForm.validTo)}
                                        onDateChange={(d) =>
                                            setEditForm({
                                                ...editForm,
                                                validTo: formatYmd(d),
                                            })
                                        }
                                        placeholder="Pick end date"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleEdit} disabled={saving}>
                                {saving && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Pricing Tiers</CardTitle>
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
                                    <TableHead>Catalog</TableHead>
                                    <TableHead>Qty Range</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Segment</TableHead>
                                    <TableHead>Contract</TableHead>
                                    <TableHead>Validity</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map((t: SupplierPriceTier) => (
                                    <TableRow key={t.tierId}>
                                        <TableCell>
                                            {t.catalogName || t.catalogId}
                                        </TableCell>
                                        <TableCell>
                                            {t.minQuantity ?? 0} -{' '}
                                            {t.maxQuantity ?? '∞'}
                                        </TableCell>
                                        <TableCell>
                                            <Money
                                                amount={t.unitPrice}
                                                currency={t.currency}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {t.customerSegment || 'ALL'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {t.contractNumber ??
                                                t.contractId ??
                                                '-'}
                                        </TableCell>
                                        <TableCell className="text-xs whitespace-nowrap">
                                            {t.validFrom
                                                ? new Date(
                                                      t.validFrom
                                                  ).toLocaleDateString()
                                                : '-'}
                                            {' → '}
                                            {t.validTo
                                                ? new Date(
                                                      t.validTo
                                                  ).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEdit(t)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(t.tierId)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No tiers
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
