'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { SupplierQualityCertificate } from '@/types/supplier';
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
} from '@/lib/services/supplier-orders-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';

export default function QualityCertsPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<SupplierQualityCertificate> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:cert', () => setOpen(true));
    const [form, setForm] = useState({
        purchaseOrderId: '',
        catalogId: '',
        certificateType: 'COA',
        certificateNumber: '',
    });
    const load = async () => {
        setLoading(true);
        try {
            const res = await getQualityCerts({ page: 0, size: 20 });
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
                                <Label>PO ID</Label>
                                <Input
                                    placeholder="e.g. 501"
                                    value={form.purchaseOrderId}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            purchaseOrderId: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Catalog ID</Label>
                                <Input
                                    placeholder="e.g. 101"
                                    value={form.catalogId}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            catalogId: e.target.value,
                                        })
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
                            <Button onClick={handleCreate}>
                                Create (DMS mocked)
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>PO</TableHead>
                                    <TableHead>Catalog</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Number</TableHead>
                                    <TableHead>DMS</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map(
                                    (c: SupplierQualityCertificate) => (
                                        <TableRow key={c.certificateId}>
                                            <TableCell>
                                                {c.poNumber ||
                                                    c.purchaseOrderId ||
                                                    '-'}
                                            </TableCell>
                                            <TableCell>
                                                {c.catalogName ||
                                                    c.catalogId ||
                                                    '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>
                                                    {c.certificateType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {c.certificateNumber || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {c.dmsDocumentId || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(
                                                            c.certificateId
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No certificates
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
