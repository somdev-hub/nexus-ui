'use client';
import { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { CarrierPayable, FreightRate } from '@/types/logistics-ops';
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
    getFreightRates,
    createFreightRate,
    deleteFreightRate,
    getCarrierPayables,
    createCarrierPayable,
    transitionPayableStatus,
} from '@/lib/services/logistics-ops-service';
import { useToast } from '@/hooks/use-toast';

export default function FinancialsPage() {
    const { toast } = useToast();
    const [rates, setRates] = useState<PaginatedResponse<FreightRate> | null>(
        null
    );
    const [payables, setPayables] =
        useState<PaginatedResponse<CarrierPayable> | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [rateType, setRateType] = useState('all');
    const [payableStatus, setPayableStatus] = useState('all');
    const [rateOpen, setRateOpen] = useState(false);
    const [payableOpen, setPayableOpen] = useState(false);
    const [rateForm, setRateForm] = useState({
        rateCode: '',
        rateType: 'CONTRACT',
        originLane: '',
        destinationLane: '',
        baseRate: '',
        fuelSurchargePct: '',
        accessorialTable: '',
    });
    const [payableForm, setPayableForm] = useState({
        shipmentId: '',
        carrierName: '',
        payableAmount: '',
        dueDate: '',
        notes: '',
    });

    const load = async () => {
        setLoading(true);
        try {
            const [r, p] = await Promise.all([
                getFreightRates({
                    page: 0,
                    size: 20,
                    search: search || undefined,
                    rateType: rateType === 'all' ? undefined : rateType,
                }),
                getCarrierPayables({
                    page: 0,
                    size: 20,
                    search: search || undefined,
                    status: payableStatus === 'all' ? undefined : payableStatus,
                }),
            ]);
            setRates(r);
            setPayables(p);
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
    }, [rateType, payableStatus]);
    useEffect(() => {
        const t = setTimeout(load, 400);
        return () => clearTimeout(t);
    }, [search]);

    const handleRateCreate = async () => {
        try {
            await createFreightRate({
                rateCode: rateForm.rateCode,
                rateType: rateForm.rateType as FreightRate['rateType'],
                originLane: rateForm.originLane || undefined,
                destinationLane: rateForm.destinationLane || undefined,
                baseRate: rateForm.baseRate
                    ? Number(rateForm.baseRate)
                    : undefined,
                fuelSurchargePct: rateForm.fuelSurchargePct
                    ? Number(rateForm.fuelSurchargePct)
                    : undefined,
                accessorialTable: rateForm.accessorialTable || undefined,
                currency: 'USD',
            });
            toast({ title: 'Rate created', variant: 'success' });
            setRateOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handlePayableCreate = async () => {
        try {
            await createCarrierPayable({
                shipmentId: payableForm.shipmentId
                    ? Number(payableForm.shipmentId)
                    : undefined,
                carrierName: payableForm.carrierName || undefined,
                payableAmount: payableForm.payableAmount
                    ? Number(payableForm.payableAmount)
                    : undefined,
                dueDate: payableForm.dueDate || undefined,
                notes: payableForm.notes || undefined,
                currency: 'USD',
            });
            toast({ title: 'Payable created', variant: 'success' });
            setPayableOpen(false);
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
                <h1 className="text-2xl font-semibold">Financials</h1>
                <div className="flex gap-2">
                    <Dialog open={rateOpen} onOpenChange={setRateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Rate Card
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Freight Rate</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Rate Code</Label>
                                        <Input
                                            value={rateForm.rateCode}
                                            onChange={(e) =>
                                                setRateForm({
                                                    ...rateForm,
                                                    rateCode: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Type</Label>
                                        <Select
                                            value={rateForm.rateType}
                                            onValueChange={(v) =>
                                                setRateForm({
                                                    ...rateForm,
                                                    rateType: v,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CONTRACT">
                                                    CONTRACT
                                                </SelectItem>
                                                <SelectItem value="SPOT">
                                                    SPOT
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Origin Lane</Label>
                                        <Input
                                            value={rateForm.originLane}
                                            onChange={(e) =>
                                                setRateForm({
                                                    ...rateForm,
                                                    originLane: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Destination Lane</Label>
                                        <Input
                                            value={rateForm.destinationLane}
                                            onChange={(e) =>
                                                setRateForm({
                                                    ...rateForm,
                                                    destinationLane:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Base Rate</Label>
                                        <Input
                                            type="number"
                                            value={rateForm.baseRate}
                                            onChange={(e) =>
                                                setRateForm({
                                                    ...rateForm,
                                                    baseRate: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Fuel %</Label>
                                        <Input
                                            type="number"
                                            value={rateForm.fuelSurchargePct}
                                            onChange={(e) =>
                                                setRateForm({
                                                    ...rateForm,
                                                    fuelSurchargePct:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Accessorial Table</Label>
                                    <Textarea
                                        value={rateForm.accessorialTable}
                                        onChange={(e) =>
                                            setRateForm({
                                                ...rateForm,
                                                accessorialTable:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="Liftgate: 50, Detention/hr: 75, ..."
                                    />
                                </div>
                                <Button onClick={handleRateCreate}>
                                    Create
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={payableOpen} onOpenChange={setPayableOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Carrier Payable
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Carrier Payable</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Shipment ID</Label>
                                        <Input
                                            type="number"
                                            value={payableForm.shipmentId}
                                            onChange={(e) =>
                                                setPayableForm({
                                                    ...payableForm,
                                                    shipmentId: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Carrier</Label>
                                        <Input
                                            value={payableForm.carrierName}
                                            onChange={(e) =>
                                                setPayableForm({
                                                    ...payableForm,
                                                    carrierName: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Amount</Label>
                                        <Input
                                            type="number"
                                            value={payableForm.payableAmount}
                                            onChange={(e) =>
                                                setPayableForm({
                                                    ...payableForm,
                                                    payableAmount:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Due (YYYY-MM-DD)</Label>
                                        <Input
                                            value={payableForm.dueDate}
                                            onChange={(e) =>
                                                setPayableForm({
                                                    ...payableForm,
                                                    dueDate: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={payableForm.notes}
                                        onChange={(e) =>
                                            setPayableForm({
                                                ...payableForm,
                                                notes: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <Button onClick={handlePayableCreate}>
                                    Create
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Tabs defaultValue="rates">
                <TabsList>
                    <TabsTrigger value="rates">Rate Cards</TabsTrigger>
                    <TabsTrigger value="payables">Carrier Payables</TabsTrigger>
                </TabsList>
                <TabsContent value="rates">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Input
                                    placeholder="Search code/lane"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Select
                                    value={rateType}
                                    onValueChange={setRateType}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Types
                                        </SelectItem>
                                        <SelectItem value="CONTRACT">
                                            CONTRACT
                                        </SelectItem>
                                        <SelectItem value="SPOT">
                                            SPOT
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
                                            <TableHead>Rate</TableHead>
                                            <TableHead>Lane</TableHead>
                                            <TableHead>Base / Fuel</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rates?.content?.map((r) => (
                                            <TableRow key={r.rateId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {r.rateCode}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {r.rateType} •{' '}
                                                        {r.equipmentType ?? '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {r.originLane ?? '?'} →{' '}
                                                    {r.destinationLane ?? '?'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {r.baseRate ?? '-'} • fuel{' '}
                                                    {r.fuelSurchargePct ?? 0}%
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={async () => {
                                                            await deleteFreightRate(
                                                                r.rateId
                                                            );
                                                            load();
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!rates?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No rates
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="payables">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle className="flex gap-2">
                                <Select
                                    value={payableStatus}
                                    onValueChange={setPayableStatus}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="PENDING">
                                            PENDING
                                        </SelectItem>
                                        <SelectItem value="APPROVED">
                                            APPROVED
                                        </SelectItem>
                                        <SelectItem value="PAID">
                                            PAID
                                        </SelectItem>
                                        <SelectItem value="DISPUTED">
                                            DISPUTED
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
                                            <TableHead>Payable</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payables?.content?.map((p) => (
                                            <TableRow key={p.payableId}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {p.payableNumber}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {p.carrierName ?? '-'} •
                                                        Shipment #
                                                        {p.shipmentId ?? '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {p.payableAmount != null
                                                        ? `$${Number(p.payableAmount).toFixed(2)}`
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            p.status === 'PAID'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {p.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {p.status ===
                                                            'PENDING' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionPayableStatus(
                                                                        p.payableId,
                                                                        'APPROVED'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {p.status ===
                                                            'APPROVED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await transitionPayableStatus(
                                                                        p.payableId,
                                                                        'PAID'
                                                                    );
                                                                    load();
                                                                }}
                                                            >
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!payables?.content?.length && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No payables
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
