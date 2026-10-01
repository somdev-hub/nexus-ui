'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, ChevronLeft, MapPin, Send, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PartnershipInvitationDialog } from '@/components/partnership-invitation-dialog';
import {
    browseSupplierCatalog,
    getSupplierDirectory,
    type SupplierBrowseItem,
    type SupplierDirectoryEntry,
} from '@/lib/services/supplier-market-service';
import { getRetailerSentInvitations } from '@/lib/services/partnership-invitations-service';

function formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}

function formatPrice(item: SupplierBrowseItem): string {
    if (item.basePrice === null || item.basePrice === undefined) return '—';
    const currency = item.currency ?? '';
    return `${item.basePrice}${currency ? ` ${currency}` : ''}`;
}

const SupplierDetailsPage = () => {
    const params = useParams<{ id: string }>();
    const supplierId = params?.id ?? '';
    const orgId = Number(supplierId);

    const [entry, setEntry] = useState<SupplierDirectoryEntry | null>(null);
    const [items, setItems] = useState<SupplierBrowseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [invitePending, setInvitePending] = useState(false);

    const loadInviteState = async () => {
        try {
            const res = await getRetailerSentInvitations({
                pageNo: 0,
                pageOffset: 100,
            });
            setInvitePending(
                (res.content ?? []).some(
                    (inv) =>
                        String(inv.status ?? '').toUpperCase() === 'PENDING' &&
                        Number(inv.invitedOrg ?? inv.invitedOrgId) === orgId
                )
            );
        } catch {
            // Non-fatal: the dialog enforces the same rule server-side.
        }
    };

    useEffect(() => {
        if (!supplierId || Number.isNaN(orgId)) {
            setIsLoading(false);
            setNotFound(true);
            return;
        }
        let isActive = true;
        const load = async () => {
            setIsLoading(true);
            setNotFound(false);
            // Parallel fetch: full directory (find this org) + this
            // supplier's public catalog items.
            const [dirResult, browseResult] = await Promise.allSettled([
                getSupplierDirectory(''),
                browseSupplierCatalog({
                    supplierOrgId: orgId,
                    pageNo: 0,
                    pageOffset: 100,
                }),
            ]);
            if (!isActive) return;
            if (dirResult.status === 'fulfilled') {
                const found = (dirResult.value ?? []).find(
                    (o) => o.id === orgId
                );
                if (found) {
                    setEntry(found);
                } else {
                    setNotFound(true);
                }
            } else {
                toast.error(
                    dirResult.reason instanceof Error
                        ? dirResult.reason.message
                        : 'Failed to load supplier info'
                );
                setNotFound(true);
            }
            if (browseResult.status === 'fulfilled') {
                setItems(browseResult.value?.content ?? []);
            } else {
                toast.error(
                    browseResult.reason instanceof Error
                        ? browseResult.reason.message
                        : 'Failed to load supplier products'
                );
                setItems([]);
            }
            void loadInviteState();
            setIsLoading(false);
        };
        load();
        return () => {
            isActive = false;
        };
    }, [supplierId, orgId]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const item of items) {
            if (item.category) set.add(item.category);
        }
        return Array.from(set).sort();
    }, [items]);

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    if (notFound || !entry) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
                <p className="text-muted-foreground">
                    Supplier not found in the directory.
                </p>
                <Button variant="outline" asChild>
                    <Link href="/retailer/partnership/supplier-market">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to discovery
                    </Link>
                </Button>
            </div>
        );
    }

    const location =
        [entry.city, entry.country].filter(Boolean).join(', ') || '—';

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="border-b bg-muted/40 p-4 md:p-6">
                    <Link href="/retailer/partnership/supplier-market">
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold">
                                    {entry.orgName ?? 'Unnamed supplier'}
                                </h1>
                                {entry.orgType ? (
                                    <Badge variant="outline">
                                        {entry.orgType}
                                    </Badge>
                                ) : null}
                                {entry.trustScore !== undefined &&
                                entry.trustScore !== null ? (
                                    <Badge
                                        variant="outline"
                                        className="flex items-center gap-1"
                                    >
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {entry.trustScore}
                                    </Badge>
                                ) : null}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {location}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Organization ID: {entry.id}
                            </p>
                        </div>
                        <Button
                            onClick={() => setInviteOpen(true)}
                            disabled={invitePending}
                            title={
                                invitePending
                                    ? 'An invitation to this organization is already pending'
                                    : undefined
                            }
                        >
                            <Send className="mr-1 h-4 w-4" />
                            {invitePending
                                ? 'Invitation Pending'
                                : 'Invite Supplier'}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 space-y-6 p-4 md:p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="p-4">
                            <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-base">
                                    Public products
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <p className="text-2xl font-bold">
                                    {items.length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="p-4">
                            <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-base">
                                    Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {categories.map((c) => (
                                            <Badge key={c} variant="outline">
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        —
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="p-4">
                            <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-base">
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <p className="text-sm font-medium">
                                    {location}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="p-4">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-lg">
                                Public products
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {items.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No public products yet.
                                </p>
                            ) : (
                                <div className="overflow-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>
                                                    Category → Family
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Price
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Updated</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, idx) => (
                                                <TableRow
                                                    key={
                                                        item.catalogId ??
                                                        item.id ??
                                                        `${entry.id}-${idx}`
                                                    }
                                                >
                                                    <TableCell className="font-medium">
                                                        {item.name ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {item.sku ??
                                                            item.code ??
                                                            '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.category ?? '—'}
                                                        {item.family
                                                            ? ` → ${item.family}`
                                                            : ''}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs">
                                                        {formatPrice(item)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.status ? (
                                                            <Badge variant="outline">
                                                                {item.status}
                                                            </Badge>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {formatDate(
                                                            item.updatedAt
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <PartnershipInvitationDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                fixedContext="RETAILER_SUPPLIER"
                invitedOrgId={Number.isFinite(orgId) ? orgId : undefined}
                invitedOrgName={entry?.orgName ?? undefined}
                onCreated={() => {
                    void loadInviteState();
                }}
            />
        </>
    );
};

export default SupplierDetailsPage;
