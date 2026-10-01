'use client';
import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { VmiConfig, VmiSuggestion } from '@/types/supplier';
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

const emptyForm = {
    retailerOrgId: '',
    materialId: '',
    warehouseId: '',
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
    const toPayload = (f: typeof emptyForm) => ({
        retailerOrgId: Number(f.retailerOrgId),
        materialId: Number(f.materialId),
        warehouseId: f.warehouseId ? Number(f.warehouseId) : undefined,
        minLevel: f.minLevel ? Number(f.minLevel) : undefined,
        maxLevel: f.maxLevel ? Number(f.maxLevel) : undefined,
        reorderPoint: f.reorderPoint ? Number(f.reorderPoint) : undefined,
        reorderQuantity: f.reorderQuantity
            ? Number(f.reorderQuantity)
            : undefined,
        autoReplenish: f.autoReplenish,
    });
    const handleCreate = async () => {
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
        }
    };
    const openEdit = (v: VmiConfig) => {
        setEditing(v);
        setEditForm({
            retailerOrgId: v.retailerOrgId ? String(v.retailerOrgId) : '',
            materialId: String(v.materialId ?? ''),
            warehouseId: v.warehouseId ? String(v.warehouseId) : '',
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
        if (!editing) return;
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
        }
    };
    const handleDelete = async () => {
        if (!deleting) return;
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
                <Label>Retailer Org ID</Label>
                <Input
                    placeholder="e.g. 12"
                    value={value.retailerOrgId}
                    onChange={(e) =>
                        setValue({ ...value, retailerOrgId: e.target.value })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Material ID</Label>
                <Input
                    placeholder="e.g. 45"
                    value={value.materialId}
                    onChange={(e) =>
                        setValue({ ...value, materialId: e.target.value })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Warehouse ID</Label>
                <Input
                    placeholder="e.g. 7"
                    value={value.warehouseId}
                    onChange={(e) =>
                        setValue({ ...value, warehouseId: e.target.value })
                    }
                />
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
                            <Button onClick={handleCreate}>Create</Button>
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
                        <Button onClick={handleEdit}>Save Changes</Button>
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
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Delete
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
                                            VMI #{s.vmiId} • Material{' '}
                                            {s.materialId}
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
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead>Min / Max</TableHead>
                                    <TableHead>Reorder Point</TableHead>
                                    <TableHead>Auto</TableHead>
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
                                            {v.materialName || v.materialId}
                                        </TableCell>
                                        <TableCell>
                                            {v.warehouseCode ||
                                                v.warehouseId ||
                                                '-'}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {v.minLevel ?? '-'} /{' '}
                                            {v.maxLevel ?? '-'}
                                        </TableCell>
                                        <TableCell>{v.reorderPoint}</TableCell>
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
                                            <div className="flex flex-wrap gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        replenish(v.vmiId)
                                                    }
                                                >
                                                    Replenish
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEdit(v)}
                                                >
                                                    <Pencil className="mr-1 h-3 w-3" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setDeleting(v)
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
