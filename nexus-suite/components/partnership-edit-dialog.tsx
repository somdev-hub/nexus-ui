'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { DatePicker } from '@/components/ui/date-picker';
import { formatYmd, parseYmd } from '@/lib/date-utils';
import { parseOptionalFloat } from '@/lib/utils';

export interface PartnershipEditValues {
    partnershipTerm?: string;
    discountRate?: number;
    endDate?: string;
}

interface PartnershipEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    initial?: PartnershipEditValues;
    onSave: (values: PartnershipEditValues) => Promise<void>;
    onSaved?: () => void;
}

export function PartnershipEditDialog({
    open,
    onOpenChange,
    title = 'Edit Partnership',
    initial,
    onSave,
    onSaved,
}: PartnershipEditDialogProps) {
    const [term, setTerm] = useState('');
    const [discountRate, setDiscountRate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setTerm(initial?.partnershipTerm ?? '');
            setDiscountRate(
                initial?.discountRate !== undefined &&
                    initial?.discountRate !== null
                    ? String(initial.discountRate)
                    : ''
            );
            setEndDate(initial?.endDate ? initial.endDate.slice(0, 10) : '');
        }
    }, [open, initial]);

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await onSave({
                partnershipTerm: term || undefined,
                discountRate: parseOptionalFloat(discountRate),
                endDate: endDate || undefined,
            });
            toast.success('Partnership updated');
            onOpenChange(false);
            onSaved?.();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to update'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Update the commercial terms of this partnership. Either
                        party may edit.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label>Partnership Terms</Label>
                        <Textarea
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            placeholder="e.g. Net-30 payment, quarterly review"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label>Discount Rate (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={discountRate}
                                onChange={(e) =>
                                    setDiscountRate(e.target.value)
                                }
                                placeholder="e.g. 5"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>End Date</Label>
                            <DatePicker
                                date={parseYmd(endDate)}
                                onDateChange={(d) => setEndDate(formatYmd(d))}
                                placeholder="Pick end date"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            loading={submitting}
                            onClick={handleSave}
                        >
                            Save Changes
                        </LoadingButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PartnershipEditDialog;
