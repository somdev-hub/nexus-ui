'use client';
import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
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
    const [delta, setDelta] = useState('');
    const [reason, setReason] = useState('');
    const [deleting, setDeleting] = useState<ConsignmentStock | null>(null);
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
    const handleCreate = async () => {
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
        }
    };
    const handleAdjust = async () => {
        if (!adjusting) return;
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
        }
    };
    const handleDelete = async () => {
        if (!deleting) return;
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
                                <Label>Retailer Org ID</Label>
                                <Input
                                    placeholder="e.g. 12"
                                    value={form.retailerOrgId}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            retailerOrgId: e.target.value,
                                        })
                                    }
                                />
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
                                    <Label>Material ID</Label>
                                    <Input
                                        placeholder="e.g. 45"
                                        value={form.materialId}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                materialId: e.target.value,
                                            })
                                        }
                                    />
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
                            <Button onClick={handleCreate}>Create</Button>
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
                        <Button onClick={handleAdjust}>Apply</Button>
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
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Delete
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
