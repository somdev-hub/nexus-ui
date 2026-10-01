'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { SupplierQuotation } from '@/types/supplier';
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
import { Textarea } from '@/components/ui/textarea';
import {
    getQuotations,
    getQuotationById,
    createQuotation,
    transitionQuotation,
    convertQuotation,
    deleteQuotation,
} from '@/lib/services/supplier-commercial-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';

export default function QuotationsPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<SupplierQuotation> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:quotation', () => setOpen(true));
    const [form, setForm] = useState({
        buyerOrgId: '',
        validFrom: '',
        validTo: '',
        terms: '',
        catalogId: '',
        quantity: '',
        unitPrice: '',
    });
    const [detail, setDetail] = useState<SupplierQuotation | null>(null);
    const [deleting, setDeleting] = useState<SupplierQuotation | null>(null);
    const load = async () => {
        setLoading(true);
        try {
            const res = await getQuotations({ page: 0, size: 20 });
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
            await createQuotation({
                buyerOrgId: form.buyerOrgId
                    ? Number(form.buyerOrgId)
                    : undefined,
                validFrom: form.validFrom || undefined,
                validTo: form.validTo || undefined,
                terms: form.terms || undefined,
                currency: 'USD',
                lineItems: form.catalogId
                    ? [
                          {
                              catalogId: Number(form.catalogId),
                              quantity: Number(form.quantity || 1),
                              unitPrice: Number(form.unitPrice || 0),
                          },
                      ]
                    : [],
            });
            toast({ title: 'Quotation created', variant: 'success' });
            setOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const transition = async (id: number, status: string) => {
        try {
            await transitionQuotation(id, status);
            toast({ title: `Moved to ${status}`, variant: 'success' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const convert = async (id: number) => {
        try {
            const r = await convertQuotation(id);
            toast({
                title: `Converted to PO ${r.poNumber}`,
                variant: 'success',
            });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const openDetail = async (id: number) => {
        try {
            const q = await getQuotationById(id);
            setDetail(q);
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
            await deleteQuotation(deleting.quotationId);
            toast({ title: 'Quotation deleted', variant: 'success' });
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
                    Quotations (Versioned, Validity, Terms, Convert to Order)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Quotation
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Quotation</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Buyer Org ID</Label>
                                <Input
                                    placeholder="e.g. 5"
                                    value={form.buyerOrgId}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            buyerOrgId: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Valid From</Label>
                                    <Input
                                        type="date"
                                        value={form.validFrom}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                validFrom: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Valid To</Label>
                                    <Input
                                        type="date"
                                        value={form.validTo}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                validTo: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Terms</Label>
                                <Textarea
                                    placeholder="e.g. Net 30, FOB destination"
                                    value={form.terms}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            terms: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
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
                                    <Label>Qty</Label>
                                    <Input
                                        placeholder="e.g. 100"
                                        value={form.quantity}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                quantity: e.target.value,
                                            })
                                        }
                                    />
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
                            </div>
                            <Button onClick={handleCreate}>Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Quotations</CardTitle>
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
                                    <TableHead>Number</TableHead>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Validity</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map((q: SupplierQuotation) => (
                                    <TableRow key={q.quotationId}>
                                        <TableCell className="font-medium">
                                            <button
                                                className="underline underline-offset-2"
                                                onClick={() =>
                                                    openDetail(q.quotationId)
                                                }
                                            >
                                                {q.quotationNumber}
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            {q.buyerOrgName ||
                                                q.buyerOrgId ||
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge>{q.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            v{q.versionNumber ?? 1}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {q.validFrom || '-'} →{' '}
                                            {q.validTo || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {q.totalAmount
                                                ? `$${q.totalAmount}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="flex flex-wrap gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openDetail(q.quotationId)
                                                }
                                            >
                                                History
                                            </Button>
                                            {q.status === 'DRAFT' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        transition(
                                                            q.quotationId,
                                                            'SENT'
                                                        )
                                                    }
                                                >
                                                    Send
                                                </Button>
                                            )}
                                            {q.status === 'SENT' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        transition(
                                                            q.quotationId,
                                                            'ACCEPTED'
                                                        )
                                                    }
                                                >
                                                    Accept
                                                </Button>
                                            )}
                                            {(q.status === 'DRAFT' ||
                                                q.status === 'SENT') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        transition(
                                                            q.quotationId,
                                                            'REJECTED'
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </Button>
                                            )}
                                            {q.status === 'SENT' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        transition(
                                                            q.quotationId,
                                                            'EXPIRED'
                                                        )
                                                    }
                                                >
                                                    Expire
                                                </Button>
                                            )}
                                            {q.status === 'ACCEPTED' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        convert(q.quotationId)
                                                    }
                                                >
                                                    Convert to Order
                                                </Button>
                                            )}
                                            {q.status !== 'ACCEPTED' &&
                                                q.status !== 'CONVERTED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            setDeleting(q)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No quotations
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <Dialog
                open={detail !== null}
                onOpenChange={(v) => !v && setDetail(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Quotation {detail?.quotationNumber} (v
                            {detail?.versionNumber ?? 1})
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <div>
                                    <Badge>{detail?.status}</Badge>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Parent Quotation</Label>
                                <div>
                                    {(
                                        detail as SupplierQuotation & {
                                            parentQuotationId?: number;
                                        }
                                    )?.parentQuotationId ?? '-'}
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Line Items</Label>
                            <div className="space-y-1 text-sm">
                                {detail?.lineItems?.map((li, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between border-b py-1 last:border-0"
                                    >
                                        <span>
                                            Catalog {li.catalogId} ×{' '}
                                            {li.quantity}
                                        </span>
                                        <span>
                                            ${li.unitPrice} = ${li.totalPrice}
                                        </span>
                                    </div>
                                ))}
                                {!detail?.lineItems?.length && (
                                    <div className="text-sm text-muted-foreground">
                                        No line items
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Terms</Label>
                            <div className="text-sm">
                                {detail?.terms || '-'}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={deleting !== null}
                onOpenChange={(v) => !v && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete quotation &ldquo;
                            {deleting?.quotationNumber}&rdquo;. Accepted or
                            converted quotations cannot be deleted.
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
        </div>
    );
}
