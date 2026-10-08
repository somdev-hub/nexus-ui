'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Truck } from 'lucide-react';
import type { SupplierOrder } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getSupplierOrders,
    acknowledgeOrder,
} from '@/lib/services/supplier-orders-service';
import { getSupplierPod } from '@/lib/services/counterparty-docs-service';
import PodSection from '@/components/pod-section';
import PartialShipmentDialog from '@/components/supplier-handover-dialog';
import type { PartialShipmentResponse } from '@/types/supplier';
import { useToast } from '@/hooks/use-toast';
import { Money } from '@/components/money';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function SupplierOrdersPage() {
    const { toast } = useToast();
    const [data, setData] = useState<PaginatedResponse<SupplierOrder> | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [partialOrder, setPartialOrder] = useState<SupplierOrder | null>(
        null
    );
    const [podOpen, setPodOpen] = useState<number | null>(null);
    // Shipment refs created this session (createPartialShipment returns
    // PartialShipmentResponse: { shipmentId, shipmentNumber, ... }).
    const [shipmentByPo, setShipmentByPo] = useState<
        Record<number, { shipmentId: number; shipmentNumber: string }>
    >({});
    const load = async () => {
        setLoading(true);
        try {
            const res = await getSupplierOrders({
                page: 0,
                size: 20,
                status: status === 'all' ? undefined : status,
                poNumber: search || undefined,
            });
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
    }, [status]);
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
    }, [search]);
    const ack = async (id: number) => {
        try {
            await acknowledgeOrder(id, undefined, 'Acknowledged via portal');
            toast({ title: 'Acknowledged', variant: 'success' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const handlePartialCreated = (
        orderId: number,
        res: PartialShipmentResponse
    ) => {
        setShipmentByPo((m) => ({
            ...m,
            [orderId]: {
                shipmentId: res.shipmentId,
                shipmentNumber: res.shipmentNumber,
            },
        }));
        load();
    };
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Order Ingestion & Partial Shipments
                </h1>
                <div className="flex gap-2">
                    <Input
                        placeholder="PO number"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-40"
                    />
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="SENT_TO_SUPPLIER">
                                SENT_TO_SUPPLIER
                            </SelectItem>
                            <SelectItem value="ACKNOWLEDGED">
                                ACKNOWLEDGED
                            </SelectItem>
                            <SelectItem value="PARTIALLY_RECEIVED">
                                PARTIAL
                            </SelectItem>
                            <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Purchase Orders (Supplier View)</CardTitle>
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
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Expected Delivery</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Payment Terms</TableHead>
                                    <TableHead>ASN / Shipment</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map((o: SupplierOrder) => {
                                    const runtime = o as SupplierOrder & {
                                        asnNumber?: string;
                                        shipmentId?: number;
                                        shipmentNumber?: string;
                                    };
                                    const sessionShip =
                                        shipmentByPo[o.purchaseOrderId];
                                    const asnNumber =
                                        runtime.asnNumber ??
                                        sessionShip?.shipmentNumber ??
                                        runtime.shipmentNumber ??
                                        '—';
                                    const podShipmentId =
                                        sessionShip?.shipmentId ??
                                        runtime.shipmentId ??
                                        null;
                                    return (
                                        <TableRow key={o.purchaseOrderId}>
                                            <TableCell className="font-medium">
                                                {o.poNumber}
                                            </TableCell>
                                            <TableCell>
                                                {o.buyerOrgName ||
                                                    o.buyerOrg?.name ||
                                                    (o.buyerOrgId !== undefined
                                                        ? `Org #${o.buyerOrgId}`
                                                        : '-')}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {o.orderDate
                                                    ? new Date(
                                                          o.orderDate
                                                      ).toLocaleDateString()
                                                    : o.createdAt
                                                      ? new Date(
                                                            o.createdAt
                                                        ).toLocaleDateString()
                                                      : '-'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {o.expectedDeliveryDate
                                                    ? new Date(
                                                          o.expectedDeliveryDate
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{o.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Money
                                                    amount={o.totalAmount}
                                                    currency={o.currency}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {o.paymentTerms || '-'}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {asnNumber}
                                            </TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/supplier/orders/${o.purchaseOrderId}`}
                                                    >
                                                        View
                                                    </Link>
                                                </Button>
                                                {o.status ===
                                                    'SENT_TO_SUPPLIER' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            ack(
                                                                o.purchaseOrderId
                                                            )
                                                        }
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Acknowledge
                                                    </Button>
                                                )}
                                                {(o.status === 'ACKNOWLEDGED' ||
                                                    o.status ===
                                                        'PARTIALLY_RECEIVED') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setPartialOrder(o)
                                                        }
                                                    >
                                                        <Truck className="mr-2 h-4 w-4" />
                                                        Partial Ship
                                                    </Button>
                                                )}
                                                {podShipmentId !== null && (
                                                    <Dialog
                                                        open={
                                                            podOpen ===
                                                            o.purchaseOrderId
                                                        }
                                                        onOpenChange={(v) =>
                                                            setPodOpen(
                                                                v
                                                                    ? o.purchaseOrderId
                                                                    : null
                                                            )
                                                        }
                                                    >
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                POD
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>
                                                                    Proof of
                                                                    Delivery ·{' '}
                                                                    {asnNumber}
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            <PodSection
                                                                fetchPod={() =>
                                                                    getSupplierPod(
                                                                        podShipmentId
                                                                    )
                                                                }
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No orders
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <PartialShipmentDialog
                order={partialOrder}
                open={partialOrder !== null}
                onOpenChange={(v) => {
                    if (!v) setPartialOrder(null);
                }}
                onCreated={(res) => {
                    if (partialOrder) {
                        handlePartialCreated(
                            partialOrder.purchaseOrderId,
                            res
                        );
                    }
                }}
            />
        </div>
    );
}
