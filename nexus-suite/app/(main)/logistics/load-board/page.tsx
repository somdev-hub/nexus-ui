'use client';
import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import type { LoadBoardShipment, ShipmentQuote } from '@/types/logistics-ops';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    getLoadBoard,
    getShipmentQuotes,
    createShipmentQuote,
    updateQuote,
    transitionQuoteStatus,
    deleteShipmentQuote,
} from '@/lib/services/logistics-ops-service';
import {
    getShipments,
    type Shipment,
} from '@/lib/services/shipment-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';
import { LoadingButton } from '@/components/ui/loading-button';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function LoadBoardPage() {
    const { toast } = useToast();
    const [loads, setLoads] =
        useState<PaginatedResponse<LoadBoardShipment> | null>(null);
    const [quotes, setQuotes] =
        useState<PaginatedResponse<ShipmentQuote> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [mode, setMode] = useState('all');
    const [quoteStatus, setQuoteStatus] = useState('all');
    const [open, setOpen] = useState(false);
    const [shipmentOptions, setShipmentOptions] = useState<Shipment[]>([]);
    useQuickCreateIntent('logistics:quote', () => setOpen(true));
    const [busy, setBusy] = useState<string | null>(null);
    const withBusy = async (key: string, fn: () => Promise<unknown>) => {
        if (busy) return;
        setBusy(key);
        try {
            await fn();
        } finally {
            setBusy(null);
        }
    };
    const [form, setForm] = useState({
        shipmentId: '',
        baseRate: '',
        fuelSurcharge: '',
        accessorialCharges: '',
        accessorialDetails: '',
        validUntil: '',
        notes: '',
    });
    const [quoteEdit, setQuoteEdit] = useState<{
        id: number;
        baseRate: string;
        fuelSurcharge: string;
        accessorialCharges: string;
        accessorialDetails: string;
        validUntil: string;
        notes: string;
    } | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [l, q] = await Promise.all([
                getLoadBoard({
                    page: 0,
                    size: 20,
                    search: search || undefined,
                    mode: mode === 'all' ? undefined : mode,
                }),
                getShipmentQuotes({
                    page: 0,
                    size: 20,
                    status: quoteStatus === 'all' ? undefined : quoteStatus,
                }),
            ]);
            setLoads(l);
            setQuotes(q);
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
    }, [mode, quoteStatus]);
    useEffect(() => {
        getShipments({ page: 0, size: 100 })
            .then((s) => {
                if (s?.content) setShipmentOptions(s.content);
            })
            .catch(() => {});
    }, []);
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
    }, [search]);

    const handleCreate = async () => {
        try {
            await createShipmentQuote({
                shipmentId: form.shipmentId
                    ? Number(form.shipmentId)
                    : undefined,
                baseRate: form.baseRate ? Number(form.baseRate) : 0,
                fuelSurcharge: form.fuelSurcharge
                    ? Number(form.fuelSurcharge)
                    : 0,
                accessorialCharges: form.accessorialCharges
                    ? Number(form.accessorialCharges)
                    : 0,
                accessorialDetails: form.accessorialDetails || undefined,
                validUntil: form.validUntil || undefined,
                notes: form.notes || undefined,
                currency: 'USD',
            });
            toast({ title: 'Quote created', variant: 'success' });
            setOpen(false);
            setForm({
                shipmentId: '',
                baseRate: '',
                fuelSurcharge: '',
                accessorialCharges: '',
                accessorialDetails: '',
                validUntil: '',
                notes: '',
            });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const transition = async (id: number, newStatus: string) => {
        try {
            await transitionQuoteStatus(id, newStatus);
            toast({
                title: `Quote ${newStatus.toLowerCase()}`,
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

    const handleQuoteUpdate = async () => {
        if (!quoteEdit) return;
        try {
            await updateQuote(quoteEdit.id, {
                baseRate: quoteEdit.baseRate ? Number(quoteEdit.baseRate) : undefined,
                fuelSurcharge: quoteEdit.fuelSurcharge ? Number(quoteEdit.fuelSurcharge) : undefined,
                accessorialCharges: quoteEdit.accessorialCharges
                    ? Number(quoteEdit.accessorialCharges)
                    : undefined,
                accessorialDetails: quoteEdit.accessorialDetails || undefined,
                validUntil: quoteEdit.validUntil || undefined,
                notes: quoteEdit.notes || undefined,
            });
            toast({ title: 'Quote updated', variant: 'success' });
            setQuoteEdit(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const remove = async (id: number) => {
        try {
            await deleteShipmentQuote(id);
            toast({ title: 'Quote deleted', variant: 'success' });
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
                <h1 className="text-2xl font-semibold">Load Board</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Quote
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Shipment Quote</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Shipment</Label>
                                <Select
                                    value={form.shipmentId || undefined}
                                    onValueChange={(v) =>
                                        setForm({
                                            ...form,
                                            shipmentId: v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select shipment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shipmentOptions.map((s) => (
                                            <SelectItem
                                                key={s.shipmentId}
                                                value={String(s.shipmentId)}
                                            >
                                                {s.shipmentNumber} (#
                                                {s.shipmentId})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label>Base Rate</Label>
                                    <Input placeholder="e.g. 12000"
                                        type="number"
                                        value={form.baseRate}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                baseRate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Fuel Surcharge</Label>
                                    <Input placeholder="e.g. 1500"
                                        type="number"
                                        value={form.fuelSurcharge}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                fuelSurcharge: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Accessorials</Label>
                                    <Input placeholder="e.g. 800"
                                        type="number"
                                        value={form.accessorialCharges}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                accessorialCharges:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Accessorial Details</Label>
                                <Textarea
                                    value={form.accessorialDetails}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            accessorialDetails: e.target.value,
                                        })
                                    }
                                    placeholder="Liftgate, detention, ..."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Valid Until (YYYY-MM-DD)</Label>
                                <Input
                                    value={form.validUntil}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            validUntil: e.target.value,
                                        })
                                    }
                                    placeholder="2026-12-31"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea placeholder="e.g. Handle with care"
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            notes: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <LoadingButton loading={busy === 'quote-create'} onClick={() => withBusy('quote-create', handleCreate)}>Create</LoadingButton>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Tabs defaultValue="loads">
                <TabsList>
                    <TabsTrigger value="loads">Available Loads</TabsTrigger>
                    <TabsTrigger value="quotes">My Quotes</TabsTrigger>
                </TabsList>
                <TabsContent value="loads">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Search shipment number"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Select value={mode} onValueChange={setMode}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Modes
                                        </SelectItem>
                                        <SelectItem value="ROAD">
                                            ROAD
                                        </SelectItem>
                                        <SelectItem value="RAIL">
                                            RAIL
                                        </SelectItem>
                                        <SelectItem value="AIR">AIR</SelectItem>
                                        <SelectItem value="SEA">SEA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shipment</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead>Load</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loads?.content?.map((s) => (
                                            <TableRow key={s.shipmentId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {s.shipmentNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {s.mode ?? '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {s.pickupAddress ?? '?'} →{' '}
                                                    {s.deliveryAddress ?? '?'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {s.totalWeight ?? '-'} kg •{' '}
                                                    {s.totalPackages ?? '-'}{' '}
                                                    pkgs
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {s.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setForm({
                                                                ...form,
                                                                shipmentId:
                                                                    String(
                                                                        s.shipmentId
                                                                    ),
                                                            });
                                                            setOpen(true);
                                                        }}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Bid
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!loads?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No available loads
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="quotes">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Select
                                    value={quoteStatus}
                                    onValueChange={setQuoteStatus}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="DRAFT">
                                            DRAFT
                                        </SelectItem>
                                        <SelectItem value="SUBMITTED">
                                            SUBMITTED
                                        </SelectItem>
                                        <SelectItem value="ACCEPTED">
                                            ACCEPTED
                                        </SelectItem>
                                        <SelectItem value="BOOKED">
                                            BOOKED
                                        </SelectItem>
                                        <SelectItem value="REJECTED">
                                            REJECTED
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={6} />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Quote</TableHead>
                                            <TableHead>Rate Split</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quotes?.content?.map((q) => (
                                            <TableRow key={q.quoteId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {q.quoteNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Shipment #
                                                        {q.shipmentId ?? '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    base {q.baseRate} + fuel{' '}
                                                    {q.fuelSurcharge ?? 0} + acc{' '}
                                                    {q.accessorialCharges ?? 0}
                                                </TableCell>
                                                <TableCell>
                                                    {q.totalAmount != null
                                                        ? `$${Number(q.totalAmount).toFixed(2)}`
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            q.status ===
                                                                'BOOKED' ||
                                                            q.status ===
                                                                'ACCEPTED'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {q.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {(q.status === 'DRAFT' ||
                                                            q.status === 'REJECTED' ||
                                                            q.status === 'EXPIRED') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                title="Edit quote"
                                                                onClick={() =>
                                                                    setQuoteEdit({
                                                                        id: q.quoteId,
                                                                        baseRate:
                                                                            q.baseRate != null
                                                                                ? String(q.baseRate)
                                                                                : '',
                                                                        fuelSurcharge:
                                                                            q.fuelSurcharge != null
                                                                                ? String(q.fuelSurcharge)
                                                                                : '',
                                                                        accessorialCharges:
                                                                            q.accessorialCharges != null
                                                                                ? String(q.accessorialCharges)
                                                                                : '',
                                                                        accessorialDetails:
                                                                            q.accessorialDetails ?? '',
                                                                        validUntil: q.validUntil ?? '',
                                                                        notes: q.notes ?? '',
                                                                    })
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {q.status ===
                                                            'DRAFT' && (
                                                            <LoadingButton
                                                                loading={busy === `quote-${q.quoteId}`}
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    withBusy(`quote-${q.quoteId}`, () =>
                                                                        transition(
                                                                            q.quoteId,
                                                                            'SUBMITTED'
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Submit
                                                            </LoadingButton>
                                                        )}
                                                        {q.status ===
                                                            'ACCEPTED' && (
                                                            <LoadingButton
                                                                loading={busy === `quote-${q.quoteId}`}
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    withBusy(`quote-${q.quoteId}`, () =>
                                                                        transition(
                                                                            q.quoteId,
                                                                            'BOOKED'
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Book
                                                            </LoadingButton>
                                                        )}
                                                        {(q.status ===
                                                            'DRAFT' ||
                                                            q.status ===
                                                                'REJECTED') && (
                                                            <LoadingButton
                                                                loading={busy === `quote-${q.quoteId}`}
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    withBusy(`quote-${q.quoteId}`, () =>
                                                                        remove(
                                                                            q.quoteId
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </LoadingButton>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!quotes?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No quotes
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Dialog open={quoteEdit != null} onOpenChange={(v) => { if (!v) setQuoteEdit(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Shipment Quote</DialogTitle>
                        <DialogDescription>Only DRAFT, rejected or expired quotes can be edited</DialogDescription>
                    </DialogHeader>
                    {quoteEdit && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label>Base Rate</Label>
                                    <Input type="number" value={quoteEdit.baseRate} onChange={(e) => setQuoteEdit({ ...quoteEdit, baseRate: e.target.value })} placeholder="e.g. 12000" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Fuel Surcharge</Label>
                                    <Input type="number" value={quoteEdit.fuelSurcharge} onChange={(e) => setQuoteEdit({ ...quoteEdit, fuelSurcharge: e.target.value })} placeholder="e.g. 1500" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Accessorials</Label>
                                    <Input type="number" value={quoteEdit.accessorialCharges} onChange={(e) => setQuoteEdit({ ...quoteEdit, accessorialCharges: e.target.value })} placeholder="e.g. 800" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Accessorial Details</Label>
                                <Textarea value={quoteEdit.accessorialDetails} onChange={(e) => setQuoteEdit({ ...quoteEdit, accessorialDetails: e.target.value })} placeholder="e.g. Liftgate, detention" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Valid Until (YYYY-MM-DD)</Label>
                                <Input value={quoteEdit.validUntil} onChange={(e) => setQuoteEdit({ ...quoteEdit, validUntil: e.target.value })} placeholder="e.g. 2026-12-31" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea value={quoteEdit.notes} onChange={(e) => setQuoteEdit({ ...quoteEdit, notes: e.target.value })} placeholder="e.g. Handle with care" />
                            </div>
                            <LoadingButton loading={busy === 'quote-update'} onClick={() => withBusy('quote-update', handleQuoteUpdate)}>Save</LoadingButton>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
