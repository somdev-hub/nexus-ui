'use client';

import { useEffect, useState } from 'react';
import { Check, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import {
    formatOrgAddress,
    orgAddressOptionLabel,
    type OrgAddress,
} from '@/lib/services/org-profile-service';
import {
    createPartialShipment,
} from '@/lib/services/supplier-orders-service';
import {
    loadHandoverOptions,
    type HandoverOption,
    type HandoverOptionsData,
} from '@/lib/services/supplier-handover-service';
import type {
    PartialShipmentResponse,
    SupplierOrder,
} from '@/types/supplier';

// ─────────────────────────────────────────────────────────────
// Partial-ship + supplier-owned handover dialog.
// Lists logistics partnerships grouped SHORT_TERM / LONG_TERM,
// gated on pickup/delivery city coverage. The shipment (BOOKED)
// then surfaces on the logistics load board.
// ─────────────────────────────────────────────────────────────

interface PartialShipmentDialogProps {
    order: SupplierOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (res: PartialShipmentResponse) => void;
}

function OptionRow({
    option,
    selected,
    onSelect,
}: {
    option: HandoverOption;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <label
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
                option.matches
                    ? selected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/40'
                    : 'cursor-not-allowed opacity-60'
            }`}
        >
            <input
                type="radio"
                name="logistics-partnership"
                className="mt-1"
                checked={selected}
                disabled={!option.matches}
                onChange={onSelect}
            />
            <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                    {option.logisticsName}
                    {option.matches ? (
                        <Badge variant="outline" className="text-xs">
                            Serves {option.coveredCities.join(' · ')}
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-xs">
                            Unavailable
                        </Badge>
                    )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {option.routeLabel || '—'}
                </span>
                {!option.matches && option.reason ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                        {option.reason}
                    </span>
                ) : null}
            </span>
        </label>
    );
}

export function PartialShipmentDialog({
    order,
    open,
    onOpenChange,
    onCreated,
}: PartialShipmentDialogProps) {
    const { toast } = useToast();
    const { orgId } = useUserMetadata();
    const [shippedQty, setShippedQty] = useState('');
    const [options, setOptions] = useState<HandoverOptionsData | null>(null);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [selectedPartnershipId, setSelectedPartnershipId] = useState('');
    const [supplierAddressId, setSupplierAddressId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open || !order) return;
        // Default to the full PO ordered quantity — the supplier may lower
        // it for a partial shipment, but never raise it.
        const ordered =
            order.lineItems?.reduce(
                (sum, li) => sum + (Number(li.quantityOrdered) || 0),
                0
            ) ?? 0;
        setShippedQty(ordered > 0 ? String(ordered) : '');
        setOptions(null);
        setOptionsError(null);
        setSelectedPartnershipId('');
        setSupplierAddressId('');
        let active = true;
        setOptionsLoading(true);
        loadHandoverOptions(order, orgId)
            .then((data) => {
                if (!active) return;
                setOptions(data);
                if (
                    data.autoSupplierAddress?.orgAddressId !== undefined
                ) {
                    setSupplierAddressId(
                        String(data.autoSupplierAddress.orgAddressId)
                    );
                }
            })
            .catch((e: unknown) => {
                if (!active) return;
                const message =
                    e instanceof Error ? e.message : String(e);
                setOptionsError(message);
                toast({ title: message, variant: 'destructive' });
            })
            .finally(() => {
                if (active) setOptionsLoading(false);
            });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, order?.purchaseOrderId]);

    const orderedQty =
        order?.lineItems?.reduce(
            (sum, li) => sum + (Number(li.quantityOrdered) || 0),
            0
        ) ?? 0;

    const chosenSupplierAddress: OrgAddress | undefined =
        options?.supplierAddresses.find(
            (a) => String(a.orgAddressId ?? '') === supplierAddressId
        ) ?? options?.autoSupplierAddress;

    const selectedOption: HandoverOption | undefined = [
        ...(options?.shortTerm ?? []),
        ...(options?.longTerm ?? []),
    ].find((o) => String(o.partnershipId) === selectedPartnershipId);

    const doCreate = async (withHandover: boolean) => {
        if (!order) return;
        const qty = Number(shippedQty);
        if (!Number.isFinite(qty) || qty <= 0) {
            toast({
                title: 'Enter a valid shipped quantity',
                variant: 'destructive',
            });
            return;
        }
        if (orderedQty > 0 && qty > orderedQty) {
            toast({
                title: `Shipped quantity cannot exceed the ordered quantity (${orderedQty})`,
                variant: 'destructive',
            });
            return;
        }
        if (withHandover) {
            if (!selectedOption) {
                toast({
                    title: 'Select a logistics partner first',
                    variant: 'destructive',
                });
                return;
            }
            if (!chosenSupplierAddress) {
                toast({
                    title: 'Select a pickup address first',
                    variant: 'destructive',
                });
                return;
            }
        }
        setSubmitting(true);
        try {
            const res = await createPartialShipment(order.purchaseOrderId, {
                shippedQuantity: qty,
                trackingNumber: 'TRK-' + Date.now(),
                ...(withHandover && selectedOption
                    ? {
                          partnershipId: selectedOption.partnershipId,
                          logisticsOrgId: selectedOption.logisticsOrgId,
                          pickupLocation: chosenSupplierAddress
                              ? formatOrgAddress(chosenSupplierAddress)
                              : undefined,
                          deliveryLocation:
                              options?.retailerAddressText || undefined,
                      }
                    : {}),
            });
            toast({
                title:
                    withHandover && res.handedOverToLogistics
                        ? `Shipment ${res.shipmentNumber} handed over — now on the logistics load board`
                        : `Partial shipment ${res.shipmentNumber} created`,
                variant: 'success',
            });
            onOpenChange(false);
            onCreated?.(res);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="md:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Partial Shipment for {order?.poNumber ?? ''}
                    </DialogTitle>
                    <DialogDescription>
                        Choose a partnered logistics provider. The shipment
                        is booked straight to their load board.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                    <div className="grid gap-2">
                        <Label>
                            Shipped Qty
                            {orderedQty > 0 && (
                                <span className="ml-2 font-normal text-muted-foreground">
                                    Ordered: {orderedQty} — lower it for a
                                    partial shipment
                                </span>
                            )}
                        </Label>
                        <Input
                            placeholder="e.g. 50"
                            value={shippedQty}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                if (
                                    orderedQty > 0 &&
                                    Number.isFinite(next) &&
                                    next > orderedQty
                                ) {
                                    setShippedQty(String(orderedQty));
                                    return;
                                }
                                setShippedQty(e.target.value);
                            }}
                            type="number"
                            min={0}
                            max={orderedQty > 0 ? orderedQty : undefined}
                        />
                    </div>

                    {optionsLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : optionsError ? (
                        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
                            {optionsError}
                        </p>
                    ) : options ? (
                        <>
                            <div className="grid gap-2 rounded-md border p-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">
                                        Pickup:{' '}
                                    </span>
                                    {options.needsSupplierChoice ? (
                                        <Select
                                            value={supplierAddressId}
                                            onValueChange={
                                                setSupplierAddressId
                                            }
                                        >
                                            <SelectTrigger className="mt-1 w-full">
                                                <SelectValue placeholder="Select pickup address" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.supplierAddresses.map(
                                                    (a) => (
                                                        <SelectItem
                                                            key={
                                                                a.orgAddressId
                                                            }
                                                            value={String(
                                                                a.orgAddressId
                                                            )}
                                                        >
                                                            {orgAddressOptionLabel(
                                                                a
                                                            )}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="font-medium">
                                            {options.autoSupplierAddress
                                                ? formatOrgAddress(
                                                      options.autoSupplierAddress
                                                  )
                                                : '—'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Deliver to:{' '}
                                    </span>
                                    <span className="font-medium">
                                        {options.retailerAddressText || '—'}
                                    </span>
                                </div>
                            </div>

                            {options.shortTerm.length > 0 && (
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-2">
                                        <Truck className="h-3.5 w-3.5" />
                                        Short-term partners
                                    </Label>
                                    {options.shortTerm.map((o) => (
                                        <OptionRow
                                            key={o.partnershipId}
                                            option={o}
                                            selected={
                                                selectedPartnershipId ===
                                                String(o.partnershipId)
                                            }
                                            onSelect={() =>
                                                setSelectedPartnershipId(
                                                    String(o.partnershipId)
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            )}

                            {options.longTerm.length > 0 && (
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-2">
                                        <Truck className="h-3.5 w-3.5" />
                                        Long-term partners
                                    </Label>
                                    {options.longTerm.map((o) => (
                                        <OptionRow
                                            key={o.partnershipId}
                                            option={o}
                                            selected={
                                                selectedPartnershipId ===
                                                String(o.partnershipId)
                                            }
                                            onSelect={() =>
                                                setSelectedPartnershipId(
                                                    String(o.partnershipId)
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            )}

                            {options.shortTerm.length === 0 &&
                                options.longTerm.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No active logistics partnerships yet —
                                        propose one from the logistics
                                        marketplace first.
                                    </p>
                                )}
                        </>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            disabled={submitting}
                            onClick={() => doCreate(false)}
                        >
                            Create without handover
                        </Button>
                        <Button
                            disabled={
                                submitting || !selectedOption?.matches
                            }
                            onClick={() => doCreate(true)}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            {submitting
                                ? 'Creating…'
                                : 'Create Shipment & Hand Over'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PartialShipmentDialog;
