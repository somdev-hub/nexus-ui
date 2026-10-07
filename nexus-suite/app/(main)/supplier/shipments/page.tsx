'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    getSupplierLogisticsPartnerships,
    getSupplierShipments,
    handoverShipment,
    type SupplierLogisticsPartnership,
    type SupplierShipment,
} from '@/lib/services/supplier-logistics-service';

// ─────────────────────────────────────────────────────────────
// Supplier-owned delivery: after acknowledgement the supplier
// prepares shipments here and hands them to a partnered logistics
// org (DRAFT -> BOOKED). The retailer journey ends at the PO —
// they only receive and pay.
// ─────────────────────────────────────────────────────────────

export default function SupplierShipmentsPage() {
    const { toast } = useToast();
    const [shipments, setShipments] = useState<SupplierShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [partnerships, setPartnerships] = useState<
        SupplierLogisticsPartnership[]
    >([]);
    const [handingOver, setHandingOver] = useState<SupplierShipment | null>(
        null
    );
    const [partnershipId, setPartnershipId] = useState('');
    const [pickupLocation, setPickupLocation] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ships, mine] = await Promise.all([
                getSupplierShipments(),
                getSupplierLogisticsPartnerships(),
            ]);
            setShipments(ships.content ?? []);
            setPartnerships(
                (mine.content ?? []).filter((p) => p.status === 'ACTIVE')
            );
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    const submitHandover = async () => {
        if (!handingOver) return;
        const partnership = partnerships.find(
            (p) => String(p.partnershipId) === partnershipId
        );
        if (!partnership) {
            toast({
                title: 'Select an active logistics partnership',
                variant: 'destructive',
            });
            return;
        }
        // Counterparty resolution happens server-side; the client only
        // selects the partnership.
        setSubmitting(true);
        try {
            // The logistics org is derived server-side as the partnership
            // counterparty — the client only selects the partnership.
            const res = await handoverShipment(handingOver.shipmentId, {
                partnershipId: partnership.partnershipId,
                pickupLocation: pickupLocation || undefined,
                deliveryLocation: deliveryLocation || undefined,
                notes: notes || undefined,
            });
            toast({
                title: `Shipment ${res.shipmentNumber ?? ''} handed over — ${res.status ?? 'BOOKED'}`,
                variant: 'success',
            });
            setHandingOver(null);
            setPartnershipId('');
            setPickupLocation('');
            setDeliveryLocation('');
            setNotes('');
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Delivery Shipments
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Hand prepared shipments to your logistics partners.
                        Delivery is owned by the supplier.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/supplier/partnership/logistics-market">
                        Logistics Marketplace
                    </Link>
                </Button>
            </div>

            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>My Shipments ({shipments.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shipment #</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>PO</TableHead>
                                    <TableHead>Tracking</TableHead>
                                    <TableHead>Pickup → Delivery</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shipments.map((s) => (
                                    <TableRow key={s.shipmentId}>
                                        <TableCell className="font-mono">
                                            {s.shipmentNumber ?? s.shipmentId}
                                        </TableCell>
                                        <TableCell>
                                            <Badge>{s.status ?? '—'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {(s.purchaseOrder as { poNumber?: string } | undefined)
                                                ?.poNumber ?? '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {s.trackingNumber ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {s.pickupLocation ?? '—'} →{' '}
                                            {s.deliveryLocation ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {s.status === 'DRAFT' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setHandingOver(s)
                                                    }
                                                >
                                                    Hand over to Logistics
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    {(
                                                        s.logisticsOrg as
                                                            | {
                                                                  name?: string;
                                                              }
                                                            | undefined
                                                    )?.name ??
                                                        'With logistics'}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!shipments.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No shipments yet — create one from
                                            an acknowledged order via Partial
                                            Ship.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={handingOver !== null}
                onOpenChange={(v) => !v && setHandingOver(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Hand over {(handingOver?.shipmentNumber as string) ?? ''} to
                            logistics
                        </DialogTitle>
                        <DialogDescription>
                            The shipment moves DRAFT → BOOKED with the selected
                            partner. Requires an ACTIVE logistics partnership.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Logistics partnership</Label>
                            <Select
                                value={partnershipId}
                                onValueChange={setPartnershipId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select partner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {partnerships.map((p) => (
                                        <SelectItem
                                            key={p.partnershipId}
                                            value={String(p.partnershipId)}
                                        >
                                            #{p.partnershipId}{' '}
                                            {p.secondaryOrgName ??
                                                p.primaryOrgName ??
                                                ''}{' '}
                                            ({(p.partnershipTermType as string) ??
                                                '—'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                                <Label>Pickup location</Label>
                                <Input
                                    value={pickupLocation}
                                    onChange={(e) =>
                                        setPickupLocation(e.target.value)
                                    }
                                    placeholder="Warehouse A"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Delivery location</Label>
                                <Input
                                    value={deliveryLocation}
                                    onChange={(e) =>
                                        setDeliveryLocation(e.target.value)
                                    }
                                    placeholder="Retailer dock"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes (optional)</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Handover notes"
                            />
                        </div>
                        <Button
                            onClick={submitHandover}
                            disabled={submitting}
                        >
                            {submitting ? 'Handing over…' : 'Confirm Handover'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
