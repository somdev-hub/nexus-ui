'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    createDeliveryAppointment,
    getDeliveryAppointments,
} from '@/lib/services/delivery-appointment-service';
import { getShipments } from '@/lib/services/shipment-service';
import {
    getWarehouses,
    type Warehouse,
} from '@/lib/services/stock-service';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import type { DeliveryAppointment } from '@/types/delivery-appointment';
import type { Shipment } from '@/types/shipment';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const COLOR: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-indigo-100 text-indigo-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
    MISSED: 'bg-red-100 text-red-800',
    RESCHEDULED: 'bg-orange-100 text-orange-800',
};

export default function DeliveryAppointmentsPage() {
    const [data, setData] = useState<DeliveryAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [form, setForm] = useState({
        shipmentId: '',
        warehouseId: '',
        scheduledStart: '',
        scheduledEnd: '',
        dockNumber: '',
    });

    const load = async () => {
        setIsLoading(true);
        try {
            const r = await getDeliveryAppointments({
                pageNo: 0,
                pageOffset: 20,
            });
            setData(r.content);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let a = true;
        (async () => {
            try {
                const r = await getDeliveryAppointments({
                    pageNo: 0,
                    pageOffset: 20,
                });
                if (!a) return;
                setData(r.content);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed');
            } finally {
                if (a) setIsLoading(false);
            }
        })();
        return () => {
            a = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const r = await getShipments({ pageNo: 0, pageOffset: 100 });
                if (!active) return;
                setShipments(r.content ?? []);
            } catch {
                // Non-fatal: shipment dropdown stays empty.
            }
            try {
                const w = await getWarehouses();
                if (!active) return;
                setWarehouses(w);
            } catch {
                // Non-fatal: warehouse dropdown stays empty.
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const set =
        (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSchedule = async () => {
        if (
            !form.shipmentId ||
            !form.warehouseId ||
            !form.scheduledStart ||
            !form.scheduledEnd
        ) {
            toast.error(
                'Shipment, warehouse, start and end times are required'
            );
            return;
        }
        setSaving(true);
        try {
            await createDeliveryAppointment({
                shipmentId: Number(form.shipmentId),
                warehouseId: Number(form.warehouseId),
                scheduledStart: new Date(form.scheduledStart).toISOString(),
                scheduledEnd: new Date(form.scheduledEnd).toISOString(),
                dockNumber: form.dockNumber || undefined,
            });
            toast.success('Delivery appointment scheduled');
            setOpen(false);
            setForm({
                shipmentId: '',
                warehouseId: '',
                scheduledStart: '',
                scheduledEnd: '',
                dockNumber: '',
            });
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to schedule');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading)
        return (
            <div className="p-6">
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    return (
        <div className="flex flex-1 flex-col p-6 gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">
                        Delivery Appointments
                    </h1>
                    <p className="text-muted-foreground">
                        Warehouse receiving slots · FR-RET-034
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={load}>
                        Refresh
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>Schedule</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Schedule Delivery Appointment
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Shipment</Label>
                                        <Select
                                            value={form.shipmentId}
                                            onValueChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    shipmentId: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select shipment" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shipments.map((s) => (
                                                    <SelectItem
                                                        key={s.shipmentId}
                                                        value={String(
                                                            s.shipmentId
                                                        )}
                                                    >
                                                        {s.shipmentNumber ??
                                                            `#${s.shipmentId}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Warehouse</Label>
                                        <Select
                                            value={form.warehouseId}
                                            onValueChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    warehouseId: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select warehouse" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((w) => (
                                                    <SelectItem
                                                        key={w.warehouseId}
                                                        value={String(
                                                            w.warehouseId
                                                        )}
                                                    >
                                                        {w.code ??
                                                            `#${w.warehouseId}`}
                                                        {w.location
                                                            ? ` — ${w.location}`
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Start</Label>
                                        <DateTimePicker
                                            value={
                                                form.scheduledStart
                                                    ? new Date(
                                                          form.scheduledStart
                                                      )
                                                    : undefined
                                            }
                                            onChange={(d) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    scheduledStart: d
                                                        ? d.toISOString()
                                                        : '',
                                                }))
                                            }
                                            placeholder="Pick start"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>End</Label>
                                        <DateTimePicker
                                            value={
                                                form.scheduledEnd
                                                    ? new Date(
                                                          form.scheduledEnd
                                                      )
                                                    : undefined
                                            }
                                            onChange={(d) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    scheduledEnd: d
                                                        ? d.toISOString()
                                                        : '',
                                                }))
                                            }
                                            placeholder="Pick end"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Dock Number</Label>
                                    <Input
                                        placeholder="e.g. DOCK-07"
                                        value={form.dockNumber}
                                        onChange={set('dockNumber')}
                                    />
                                </div>
                                <Button
                                    onClick={handleSchedule}
                                    disabled={saving}
                                >
                                    {saving ? 'Scheduling...' : 'Schedule'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Appointment #</TableHead>
                            <TableHead>Shipment</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Scheduled</TableHead>
                            <TableHead>Dock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((a) => (
                            <TableRow key={a.appointmentId}>
                                <TableCell className="font-mono">
                                    {a.appointmentNumber}
                                </TableCell>
                                <TableCell>
                                    {a.shipmentNumber || a.shipmentId || '—'}
                                </TableCell>
                                <TableCell>
                                    {a.warehouseCode || a.warehouseId}
                                </TableCell>
                                <TableCell>
                                    <Badge className={COLOR[a.status]}>
                                        {a.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(
                                        a.scheduledStart
                                    ).toLocaleString()}{' '}
                                    →{' '}
                                    {new Date(
                                        a.scheduledEnd
                                    ).toLocaleTimeString()}
                                </TableCell>
                                <TableCell>{a.dockNumber || '—'}</TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8"
                                >
                                    No appointments
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
