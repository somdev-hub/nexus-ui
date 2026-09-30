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
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { createRetailerInvitation } from '@/lib/services/partnership-invitations-service';
import type { PartnershipInvitationContext } from '@/types/partnership-invitations';

interface PartnershipInvitationDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultContext?: PartnershipInvitationContext;
    /** When set, the context selector is hidden and this value is used. */
    fixedContext?: PartnershipInvitationContext;
    /** Show the optional local-supplier reference field. */
    showRetailerSupplierRef?: boolean;
    trigger?: React.ReactNode;
    onCreated?: () => void;
}

const CONTEXTS: PartnershipInvitationContext[] = [
    'RETAILER_SUPPLIER',
    'RETAILER_LOGISTICS',
    'SUPPLIER_LOGISTICS',
];

export function PartnershipInvitationDialog({
    open,
    onOpenChange,
    defaultContext = 'RETAILER_SUPPLIER',
    fixedContext,
    showRetailerSupplierRef = false,
    trigger,
    onCreated,
}: PartnershipInvitationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const dialogOpen = isControlled ? open : internalOpen;
    const setDialogOpen = (v: boolean) => {
        if (!isControlled) setInternalOpen(v);
        onOpenChange?.(v);
    };

    const [invitedOrgId, setInvitedOrgId] = useState('');
    const [context, setContext] =
        useState<PartnershipInvitationContext>(defaultContext);
    const [proposedTerms, setProposedTerms] = useState('');
    const [retailerSupplierId, setRetailerSupplierId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (dialogOpen) {
            setContext(fixedContext ?? defaultContext);
        }
    }, [dialogOpen, fixedContext, defaultContext]);

    const handleSubmit = async () => {
        const orgId = Number(invitedOrgId);
        if (!invitedOrgId || Number.isNaN(orgId) || orgId < 1) {
            toast.error('Counterparty organization ID is required');
            return;
        }
        setSubmitting(true);
        try {
            await createRetailerInvitation({
                invitedOrgId: orgId,
                partnershipContext: fixedContext ?? context,
                proposedTerms: proposedTerms || undefined,
                retailerSupplierId: retailerSupplierId
                    ? Number(retailerSupplierId)
                    : undefined,
            });
            toast.success('Partnership invitation sent');
            setInvitedOrgId('');
            setProposedTerms('');
            setRetailerSupplierId('');
            setDialogOpen(false);
            onCreated?.();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to send invitation'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Partner Organization</DialogTitle>
                    <DialogDescription>
                        Send a partnership invitation to a counterparty
                        organization.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label>Counterparty Organization ID</Label>
                        <Input
                            type="number"
                            value={invitedOrgId}
                            onChange={(e) => setInvitedOrgId(e.target.value)}
                            placeholder="e.g. 42"
                        />
                    </div>
                    {!fixedContext ? (
                        <div className="grid gap-2">
                            <Label>Partnership Context</Label>
                            <Select
                                value={context}
                                onValueChange={(v) =>
                                    setContext(
                                        v as PartnershipInvitationContext
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select context" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONTEXTS.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}
                    {showRetailerSupplierRef ||
                    (fixedContext ?? context) === 'RETAILER_SUPPLIER' ? (
                        <div className="grid gap-2">
                            <Label>Local Supplier Reference (optional)</Label>
                            <Input
                                type="number"
                                value={retailerSupplierId}
                                onChange={(e) =>
                                    setRetailerSupplierId(e.target.value)
                                }
                                placeholder="e.g. 7"
                            />
                        </div>
                    ) : null}
                    <div className="grid gap-2">
                        <Label>Proposed Terms (optional)</Label>
                        <Textarea
                            value={proposedTerms}
                            onChange={(e) => setProposedTerms(e.target.value)}
                            placeholder="e.g. Net-30 payment, quarterly review"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            Send Invitation
                        </LoadingButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PartnershipInvitationDialog;
