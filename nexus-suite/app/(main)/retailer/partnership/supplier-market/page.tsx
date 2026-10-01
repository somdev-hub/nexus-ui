'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Building2,
    ChevronDown,
    ChevronRight,
    MapPin,
    Package,
    Search,
    Send,
    Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnershipInvitationDialog } from '@/components/partnership-invitation-dialog';
import {
    browseSupplierCatalog,
    getSupplierDirectory,
    type SupplierBrowseItem,
    type SupplierDirectoryEntry,
} from '@/lib/services/supplier-market-service';
import { getRetailerSentInvitations } from '@/lib/services/partnership-invitations-service';

interface SupplierDiscoveryRow {
    entry: SupplierDirectoryEntry;
    items: SupplierBrowseItem[];
    productCount: number;
    categories: string[];
    lastUpdated: string | null;
}

function itemTime(value?: string): number {
    if (!value) return 0;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}

function formatPrice(item: SupplierBrowseItem): string {
    const price = item.basePrice ?? null;
    if (price === null || price === undefined) return '—';
    const currency = item.currency ?? '';
    return `${price}${currency ? ` ${currency}` : ''}`;
}

const SupplierMarketPage = () => {
    const [directory, setDirectory] = useState<SupplierDirectoryEntry[]>([]);
    const [browseItems, setBrowseItems] = useState<SupplierBrowseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteOrgId, setInviteOrgId] = useState<number | undefined>(
        undefined
    );
    const [inviteOrgName, setInviteOrgName] = useState<string | undefined>(
        undefined
    );
    // Org ids with an outstanding PENDING invitation from us. Card Invite
    // buttons stay disabled for these until accepted/rejected.
    const [pendingOrgIds, setPendingOrgIds] = useState<Set<number>>(new Set());

    const loadSentInvitations = async () => {
        try {
            const res = await getRetailerSentInvitations({
                pageNo: 0,
                pageOffset: 100,
            });
            const pending = new Set<number>();
            for (const inv of res.content ?? []) {
                if (String(inv.status ?? '').toUpperCase() !== 'PENDING')
                    continue;
                const org = inv.invitedOrg ?? inv.invitedOrgId ?? undefined;
                const id = Number(org);
                if (Number.isFinite(id) && id > 0) pending.add(id);
            }
            setPendingOrgIds(pending);
        } catch {
            // Non-fatal: the dialog enforces the same rule server-side.
        }
    };

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            // Parallel fetch: org directory (all suppliers) + public catalog
            // browse. Joined client-side below by org id.
            const [dirResult, browseResult] = await Promise.allSettled([
                getSupplierDirectory(''),
                browseSupplierCatalog({ pageNo: 0, pageOffset: 100 }),
            ]);
            if (isActive) {
                void loadSentInvitations();
            }
            if (!isActive) return;
            if (dirResult.status === 'fulfilled') {
                setDirectory(dirResult.value ?? []);
            } else {
                toast.error(
                    dirResult.reason instanceof Error
                        ? dirResult.reason.message
                        : 'Failed to load supplier directory'
                );
            }
            if (browseResult.status === 'fulfilled') {
                setBrowseItems(browseResult.value?.content ?? []);
            } else {
                toast.error(
                    browseResult.reason instanceof Error
                        ? browseResult.reason.message
                        : 'Failed to load supplier catalog'
                );
            }
            if (
                dirResult.status === 'rejected' &&
                browseResult.status === 'rejected'
            ) {
                setLoadError('Failed to load supplier discovery data.');
            }
            setIsLoading(false);
        };
        load();
        return () => {
            isActive = false;
        };
    }, []);

    const rows: SupplierDiscoveryRow[] = useMemo(() => {
        const bySupplier = new Map<number, SupplierBrowseItem[]>();
        for (const item of browseItems) {
            const key = item.supplierOrgId ?? -1;
            if (key < 0) continue;
            const list = bySupplier.get(key) ?? [];
            list.push(item);
            bySupplier.set(key, list);
        }
        const mapped: SupplierDiscoveryRow[] = directory.map((entry) => {
            const items = bySupplier.get(entry.id) ?? [];
            const categories = Array.from(
                new Set(
                    items
                        .map((i) => i.category ?? '')
                        .filter((c) => c.length > 0)
                )
            ).sort();
            const times = items
                .map((i) => itemTime(i.updatedAt))
                .filter((t) => t > 0);
            const maxTime = times.length > 0 ? Math.max(...times) : 0;
            const latest = items.find(
                (i) => itemTime(i.updatedAt) === maxTime
            )?.updatedAt;
            return {
                entry,
                items,
                productCount: items.length,
                categories,
                lastUpdated: maxTime > 0 ? (latest ?? null) : null,
            };
        });
        // Recency placeholder: suppliers with items first ordered by max
        // updatedAt DESC; item-less suppliers last (alphabetical). Replace with
        // recommendation ranking once recommendations land.
        mapped.sort((a, b) => {
            const aHas = a.items.length > 0;
            const bHas = b.items.length > 0;
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            if (aHas && bHas) {
                const diff =
                    itemTime(b.lastUpdated ?? undefined) -
                    itemTime(a.lastUpdated ?? undefined);
                if (diff !== 0) return diff;
            }
            return (a.entry.orgName ?? '').localeCompare(b.entry.orgName ?? '');
        });
        return mapped;
    }, [directory, browseItems]);

    const allCategories = useMemo(() => {
        const set = new Set<string>();
        for (const item of browseItems) {
            if (item.category) set.add(item.category);
        }
        return Array.from(set).sort();
    }, [browseItems]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((row) => {
            if (
                categoryFilter !== 'ALL' &&
                !row.items.some((i) => (i.category ?? '') === categoryFilter)
            ) {
                return false;
            }
            if (!q) return true;
            const nameHit = (row.entry.orgName ?? '').toLowerCase().includes(q);
            if (nameHit) return true;
            return row.items.some(
                (i) =>
                    (i.name ?? '').toLowerCase().includes(q) ||
                    (i.sku ?? '').toLowerCase().includes(q) ||
                    (i.category ?? '').toLowerCase().includes(q)
            );
        });
    }, [rows, search, categoryFilter]);

    const toggleExpanded = (orgId: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(orgId)) {
                next.delete(orgId);
            } else {
                next.add(orgId);
            }
            return next;
        });
    };

    const openInvite = (orgId: number, orgName?: string) => {
        setInviteOrgId(orgId);
        setInviteOrgName(orgName);
        setInviteOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
                <p className="text-muted-foreground">{loadError}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 gap-2 p-4 md:gap-6 md:p-6">
                    <div className="w-full space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Supplier Discovery
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Browse suppliers and their public products —
                                    invite in one click, no manual org-ID
                                    typing.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-8 sm:w-64"
                                        placeholder="Search name, SKU, category…"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                    />
                                </div>
                                <Select
                                    value={categoryFilter}
                                    onValueChange={setCategoryFilter}
                                >
                                    <SelectTrigger className="sm:w-48">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All categories
                                        </SelectItem>
                                        {allCategories.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline">
                                {filtered.length} suppliers
                            </Badge>
                            <Badge variant="outline">
                                {browseItems.length} public products
                            </Badge>
                        </div>

                        {filtered.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    No suppliers match your search.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {filtered.map((row) => {
                                    const entry = row.entry;
                                    const orgId = entry.id;
                                    const isOpen = expanded.has(orgId);
                                    const location =
                                        [entry.city, entry.country]
                                            .filter(Boolean)
                                            .join(', ') || '—';
                                    return (
                                        <Card
                                            key={orgId}
                                            className="flex flex-col p-4 gap-2"
                                        >
                                            <CardHeader className="p-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base">
                                                                {entry.orgName ??
                                                                    'Unnamed supplier'}
                                                            </CardTitle>
                                                            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {location}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {entry.trustScore !==
                                                        undefined &&
                                                    entry.trustScore !==
                                                        null ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            {entry.trustScore}
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex flex-1 flex-col gap-3 p-0">
                                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                                    <Badge variant="secondary">
                                                        <Package className="mr-1 h-3 w-3" />
                                                        {row.productCount}{' '}
                                                        {row.productCount === 1
                                                            ? 'product'
                                                            : 'products'}
                                                    </Badge>
                                                    <span className="text-muted-foreground">
                                                        Updated:{' '}
                                                        {formatDate(
                                                            row.lastUpdated
                                                        )}
                                                    </span>
                                                </div>
                                                {row.categories.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {row.categories.map(
                                                            (c) => (
                                                                <Badge
                                                                    key={c}
                                                                    variant="outline"
                                                                >
                                                                    {c}
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                ) : null}

                                                {row.items.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        No public products yet.
                                                    </p>
                                                ) : (
                                                    <div className="rounded-md border">
                                                        <button
                                                            type="button"
                                                            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
                                                            onClick={() =>
                                                                toggleExpanded(
                                                                    orgId
                                                                )
                                                            }
                                                        >
                                                            <span>
                                                                {isOpen
                                                                    ? 'Hide products'
                                                                    : `Show products (${row.items.length})`}
                                                            </span>
                                                            {isOpen ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                        {isOpen ? (
                                                            <div className="divide-y border-t">
                                                                {row.items.map(
                                                                    (
                                                                        item,
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                item.catalogId ??
                                                                                item.id ??
                                                                                `${orgId}-${idx}`
                                                                            }
                                                                            className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="truncate font-medium">
                                                                                    {item.name ??
                                                                                        'Unnamed product'}
                                                                                </p>
                                                                                <p className="truncate text-xs text-muted-foreground">
                                                                                    {item.sku ??
                                                                                        item.code ??
                                                                                        '—'}
                                                                                    {
                                                                                        ' · '
                                                                                    }
                                                                                    {item.category ??
                                                                                        '—'}
                                                                                    {item.family
                                                                                        ? ` → ${item.family}`
                                                                                        : ''}
                                                                                </p>
                                                                            </div>
                                                                            <span className="shrink-0 font-mono text-xs">
                                                                                {formatPrice(
                                                                                    item
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )}

                                                <div className="mt-auto flex gap-2 pt-1">
                                                    {pendingOrgIds.has(
                                                        orgId
                                                    ) ? (
                                                        <Button
                                                            size="sm"
                                                            disabled
                                                        >
                                                            <Send className="mr-1 h-3.5 w-3.5" />
                                                            Invitation Pending
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                openInvite(
                                                                    orgId,
                                                                    entry.orgName ??
                                                                        undefined
                                                                )
                                                            }
                                                        >
                                                            <Send className="mr-1 h-3.5 w-3.5" />
                                                            Invite
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/retailer/partnership/supplier-market/${orgId}`}
                                                        >
                                                            View details
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <PartnershipInvitationDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                fixedContext="RETAILER_SUPPLIER"
                invitedOrgId={inviteOrgId}
                invitedOrgName={inviteOrgName}
                onCreated={() => {
                    void loadSentInvitations();
                }}
            />
        </>
    );
};

export default SupplierMarketPage;
