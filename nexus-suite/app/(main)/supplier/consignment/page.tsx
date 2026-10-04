'use client';
import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ConsignmentStock } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { getSupplierPartnerships } from '@/lib/services/org-partnerships-service';
import { getMaterials } from '@/lib/services/materials-service';
import type { Material } from '@/types/materials';
import {
    getConsignments,
    createConsignment,
    adjustConsignment,
    deleteConsignment,
} from '@/lib/services/supplier-inventory-service';
import { useToast } from '@/hooks/use-toast';

export default function ConsignmentPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<ConsignmentStock> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        retailerOrgId: '',
        warehouseId: '',
        materialId: '',
        quantityOnHand: '',
    });
    const [adjusting, setAdjusting] = useState<ConsignmentStock | null>(null);
    const [retailers, setRetailers] = useState<
        { orgId: number; label: string }[]
    >([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const { orgId } = useUserMetadata();
    const [delta, setDelta] = useState('');
    const [reason, setReason] = useState('');
    const [deleting, setDeleting] = useState<ConsignmentStock | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const res = await getConsignments({ page: 0, size: 20 });
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
                    seen.set(
                        id,
                        name ? `${name} (#${id})` : `Org #${id}`
                    );
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
        const loadMaterials = async () => {
            try {
                const res = await getMaterials({
                    pageNo: 0,
                    pageOffset: 100,
                });
                if (!active) return;
                setMaterials(res.content ?? []);
            } catch {
                // leave dropdown empty; global 500 toast already fired
            }
        };
        loadMaterials();
        return () => {
            active = false;
        };
    }, []);
    const handleCreate = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createConsignment({
                retailerOrgId: Number(form.retailerOrgId),
                warehouseId: form.warehouseId
                    ? Number(form.warehouseId)
                    : undefined,
                materialId: Number(form.materialId),
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
    const handleAdjust = async () => {
        if (!adjusting || saving) return;
        setSaving(true);
        try {
            await adjustConsignment(
                adjusting.consignmentId,
                Number(delta),
                reason || undefined
            );
            toast({ title: 'Quantity adjusted', variant: 'success' });
            setAdjusting(null);
            setDelta('');
            setReason('');
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
                                        There is no established partnership
                                        with any retailer yet. Accept a
                                        retailer invitation first to add
                                        consignment stock.
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Warehouse ID</Label>
                                    <Input
                                        placeholder="e.g. 7"
                                        value={form.warehouseId}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                warehouseId: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Material</Label>
                                    <Select
                                        value={
                                            form.materialId
                                                ? String(form.materialId)
                                                : ''
                                        }
                                        onValueChange={(v) =>
                                            setForm({
                                                ...form,
                                                materialId: v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select material" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {materials.map((m) => (
                                                <SelectItem
                                                    key={m.materialId}
                                                    value={String(m.materialId)}
                                                >
                                                    {m.materialName} (
                                                    {m.materialCode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
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
                open={adjusting !== null}
                onOpenChange={(v) => !v && setAdjusting(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Adjust Quantity ({adjusting?.consignmentNumber})
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label>Delta (use negative to deduct)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 50 or -20"
                                value={delta}
                                onChange={(e) => setDelta(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason</Label>
                            <Input
                                placeholder="e.g. Cycle count correction"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAdjust} disabled={saving}>
                            {saving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {saving ? 'Applying…' : 'Apply'}
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Consignment #</TableHead>
                                    <TableHead>Retailer</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead>Material</TableHead>
                                    <TableHead>On Hand</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map((c: ConsignmentStock) => (
                                    <TableRow key={c.consignmentId}>
                                        <TableCell className="font-medium">
                                            {c.consignmentNumber}
                                        </TableCell>
                                        <TableCell>
                                            {c.retailerOrgName ||
                                                c.retailerOrgId}
                                        </TableCell>
                                        <TableCell>
                                            {c.warehouseCode ||
                                                c.warehouseId ||
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            {c.materialName || c.materialId}
                                        </TableCell>
                                        <TableCell>
                                            {c.quantityOnHand}
                                        </TableCell>
                                        <TableCell>
                                            {c.quantityAvailable}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setAdjusting(c)
                                                    }
                                                >
                                                    <Pencil className="mr-1 h-3 w-3" />
                                                    Adjust
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setDeleting(c)
                                                    }
                                                >
                                                    <Trash2 className="mr-1 h-3 w-3" />
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
                                            No consignment stock
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
