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
import { createSupplierInvitation } from '@/lib/services/partnership-invitations-service';
import { getRetailerSentInvitations } from '@/lib/services/partnership-invitations-service';
import { getSupplierSentInvitations } from '@/lib/services/partnership-invitations-service';
import { getOrganizationDirectory } from '@/lib/services/supplier-market-service';
import type { PartnershipInvitationContext } from '@/types/partnership-invitations';

interface PartnershipInvitationDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultContext?: PartnershipInvitationContext;
    /** When set, the context selector is hidden and this value is used. */
    fixedContext?: PartnershipInvitationContext;
    /** Show the optional local-supplier reference field. */
    showRetailerSupplierRef?: boolean;
    /**
     * Locked counterparty org (discovery flow). When provided the org is
     * shown read-only — the user can never type or edit an org ID.
     */
    invitedOrgId?: number;
    /** Display name for the locked counterparty org. */
    invitedOrgName?: string;
    /**
     * Which portal sends the invitation. Supplier senders use the supplier
     * passthrough so SUPPLIER_LOGISTICS proposals originate from suppliers.
     */
    senderRole?: 'retailer' | 'supplier';
    trigger?: React.ReactNode;
    onCreated?: () => void;
}

const CONTEXTS: PartnershipInvitationContext[] = [
    'RETAILER_SUPPLIER',
    'RETAILER_LOGISTICS',
    'SUPPLIER_LOGISTICS',
];

/** Prefer the server's message (e.g. duplicate-invite rejection) over axios's generic one. */
function extractServerMessage(err: unknown): string {
    const data = (err as { response?: { data?: unknown } })?.response?.data;
    if (typeof data === 'string' && data) {
        try {
            const parsed = JSON.parse(data) as Record<string, unknown>;
            if (typeof parsed.message === 'string' && parsed.message)
                return parsed.message;
        } catch {
            return data.slice(0, 300);
        }
    }
    if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        for (const key of ['message', 'description', 'error']) {
            if (typeof record[key] === 'string' && record[key]) {
                return String(record[key]).slice(0, 300);
            }
        }
    }
    return err instanceof Error ? err.message : 'Failed to send invitation';
}

/** Which org directory feeds the picker for a given context. */
function directoryTypeFor(
    context: PartnershipInvitationContext
): 'SUPPLIER' | 'LOGISTICS' {
    return context === 'RETAILER_SUPPLIER' ? 'SUPPLIER' : 'LOGISTICS';
}

interface DirectoryOption {
    id: number;
    orgName: string;
}

export function PartnershipInvitationDialog({
    open,
    onOpenChange,
    defaultContext = 'RETAILER_SUPPLIER',
    fixedContext,
    showRetailerSupplierRef = false,
    invitedOrgId: lockedOrgId,
    invitedOrgName,
    senderRole = 'retailer',
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

    const [context, setContext] =
        useState<PartnershipInvitationContext>(defaultContext);
    const [directory, setDirectory] = useState<DirectoryOption[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState('');
    // Org ids with an outstanding PENDING invitation from us. Send stays
    // disabled for these until accepted/rejected (backend enforces too).
    const [pendingOrgIds, setPendingOrgIds] = useState<Set<number>>(new Set());
    const [proposedTerms, setProposedTerms] = useState('');
    const [retailerSupplierId, setRetailerSupplierId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const effectiveContext = fixedContext ?? context;
    const locked = lockedOrgId !== undefined;

    useEffect(() => {
        if (!dialogOpen) return;
        setContext(fixedContext ?? defaultContext);
        if (locked) return;
        let active = true;
        setDirectoryLoading(true);
        getOrganizationDirectory(
            directoryTypeFor(fixedContext ?? defaultContext)
        )
            .then((entries) => {
                if (!active) return;
                setDirectory(
                    entries.map((e) => ({
                        id: Number(e.id),
                        orgName: String(e.orgName ?? `Organization ${e.id}`),
                    }))
                );
            })
            .catch(() => {
                if (active) toast.error('Failed to load organizations');
            })
            .finally(() => {
                if (active) setDirectoryLoading(false);
            });
        return () => {
            active = false;
        };
    }, [dialogOpen, fixedContext, defaultContext, locked]);

    // Outstanding sent invitations: drive the per-org Send disable state.
    useEffect(() => {
        if (!dialogOpen) return;
        let active = true;
        const fetchSent =
            senderRole === 'supplier'
                ? getSupplierSentInvitations
                : getRetailerSentInvitations;
        fetchSent({ pageNo: 0, pageOffset: 100 })
            .then((res) => {
                if (!active) return;
                const pending = new Set<number>();
                for (const inv of res.content ?? []) {
                    const status = String(inv.status ?? '').toUpperCase();
                    if (status !== 'PENDING') continue;
                    const org = inv.invitedOrg ?? inv.invitedOrgId ?? undefined;
                    const id = Number(org);
                    if (Number.isFinite(id) && id > 0) pending.add(id);
                }
                setPendingOrgIds(pending);
            })
            .catch(() => {
                // Non-fatal: backend still rejects duplicates.
                if (active) setPendingOrgIds(new Set());
            });
        return () => {
            active = false;
        };
    }, [dialogOpen]);

    // Refetch the picker when the context changes (unlocked mode only).
    useEffect(() => {
        if (!dialogOpen || locked) return;
        let active = true;
        setDirectoryLoading(true);
        setSelectedOrgId('');
        getOrganizationDirectory(directoryTypeFor(effectiveContext))
            .then((entries) => {
                if (!active) return;
                setDirectory(
                    entries.map((e) => ({
                        id: Number(e.id),
                        orgName: String(e.orgName ?? `Organization ${e.id}`),
                    }))
                );
            })
            .catch(() => {
                if (active) toast.error('Failed to load organizations');
            })
            .finally(() => {
                if (active) setDirectoryLoading(false);
            });
        return () => {
            active = false;
        };
    }, [effectiveContext, dialogOpen, locked]);

    const handleSubmit = async () => {
        const orgId = locked ? lockedOrgId : Number(selectedOrgId);
        if (!Number.isFinite(orgId) || orgId < 1) {
            toast.error('Please select a counterparty organization');
            return;
        }
        if (pendingOrgIds.has(orgId)) {
            toast.error(
                'An invitation to this organization is already pending'
            );
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                invitedOrgId: orgId,
                partnershipContext: effectiveContext,
                proposedTerms: proposedTerms || undefined,
                retailerSupplierId: retailerSupplierId
                    ? Number(retailerSupplierId)
                    : undefined,
            };
            if (senderRole === 'supplier') {
                await createSupplierInvitation(payload);
            } else {
                await createRetailerInvitation(payload);
            }
            toast.success('Partnership invitation sent');
            setSelectedOrgId('');
            setProposedTerms('');
            setRetailerSupplierId('');
            setPendingOrgIds((prev) => new Set(prev).add(orgId));
            setDialogOpen(false);
            onCreated?.();
        } catch (err: unknown) {
            toast.error(extractServerMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const targetOrgId = locked ? lockedOrgId : Number(selectedOrgId);
    const alreadyPending =
        Number.isFinite(targetOrgId) &&
        targetOrgId > 0 &&
        pendingOrgIds.has(targetOrgId);

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
                    {locked ? (
                        <div className="grid gap-2">
                            <Label>Counterparty Organization</Label>
                            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
                                {invitedOrgName
                                    ? `${invitedOrgName} (#${lockedOrgId})`
                                    : `Organization #${lockedOrgId}`}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label>Counterparty Organization</Label>
                            <Select
                                value={selectedOrgId}
                                onValueChange={setSelectedOrgId}
                                disabled={directoryLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            directoryLoading
                                                ? 'Loading organizations…'
                                                : 'Select organization'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {directory.map((o) => (
                                        <SelectItem
                                            key={o.id}
                                            value={String(o.id)}
                                        >
                                            {o.orgName} (#{o.id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
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
                    effectiveContext === 'RETAILER_SUPPLIER' ? (
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
                            disabled={alreadyPending}
                            title={
                                alreadyPending
                                    ? 'An invitation to this organization is already pending'
                                    : undefined
                            }
                        >
                            Send Invitation
                        </LoadingButton>
                    </div>
                    {alreadyPending ? (
                        <p className="text-sm text-muted-foreground">
                            An invitation to this organization is already
                            pending — sending is disabled until it is accepted
                            or rejected. You can withdraw it from Sent
                            Invitations.
                        </p>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PartnershipInvitationDialog;
