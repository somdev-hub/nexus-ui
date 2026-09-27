'use client';
import { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
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
    transitionQuoteStatus,
    deleteShipmentQuote,
} from '@/lib/services/logistics-ops-service';
import { useToast } from '@/hooks/use-toast';

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
    const [form, setForm] = useState({
        shipmentId: '',
        baseRate: '',
        fuelSurcharge: '',
        accessorialCharges: '',
        accessorialDetails: '',
        validUntil: '',
        notes: '',
    });

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
                        <div className="grid gap-3">
                            <div className="grid gap-1.5">
                                <Label>Shipment ID</Label>
                                <Input
                                    type="number"
                                    value={form.shipmentId}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            shipmentId: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 12"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-1.5">
                                    <Label>Base Rate</Label>
                                    <Input
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
                                <div className="grid gap-1.5">
                                    <Label>Fuel Surcharge</Label>
                                    <Input
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
                                <div className="grid gap-1.5">
                                    <Label>Accessorials</Label>
                                    <Input
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
                            <div className="grid gap-1.5">
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
                            <div className="grid gap-1.5">
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
                            <div className="grid gap-1.5">
                                <Label>Notes</Label>
                                <Textarea
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            notes: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <Button onClick={handleCreate}>Create</Button>
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
                                    <SelectTrigger className="w-40">
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
                                <div className="text-sm text-muted-foreground">
                                    Loading...
                                </div>
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
                                    <SelectTrigger className="w-40">
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
                                <div className="text-sm text-muted-foreground">
                                    Loading...
                                </div>
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
                                                        {q.status ===
                                                            'DRAFT' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    transition(
                                                                        q.quoteId,
                                                                        'SUBMITTED'
                                                                    )
                                                                }
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Submit
                                                            </Button>
                                                        )}
                                                        {q.status ===
                                                            'ACCEPTED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    transition(
                                                                        q.quoteId,
                                                                        'BOOKED'
                                                                    )
                                                                }
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Book
                                                            </Button>
                                                        )}
                                                        {(q.status ===
                                                            'DRAFT' ||
                                                            q.status ===
                                                                'REJECTED') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    remove(
                                                                        q.quoteId
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
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
        </div>
    );
}
