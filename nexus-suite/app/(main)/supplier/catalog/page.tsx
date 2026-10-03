'use client';
import { useEffect, useState } from 'react';
import { Archive, Check, Loader2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { SupplierCatalog } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    getSupplierCatalogs,
    createSupplierCatalog,
    updateSupplierCatalog,
    transitionCatalogStatus,
    deleteSupplierCatalog,
} from '@/lib/services/supplier-catalog-service';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';

const ACCESS_LEVELS = ['PUBLIC', 'PRIVATE', 'PARTNER_ONLY'];

const emptyForm = {
    name: '',
    code: '',
    category: '',
    family: '',
    sku: '',
    basePrice: '',
    unitOfMeasure: '',
    currency: 'USD',
    description: '',
    attributes: '',
    specifications: '',
    accessLevel: 'PRIVATE',
    allowedPartnerOrgIds: '',
};

export default function SupplierCatalogPage() {
    const { toast } = useToast();
    const [data, setData] = useState<PaginatedResponse<SupplierCatalog> | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:catalog', () => setOpen(true));
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState<SupplierCatalog | null>(null);
    const [editForm, setEditForm] = useState(emptyForm);
    const [deleting, setDeleting] = useState<SupplierCatalog | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getSupplierCatalogs({
                page: 0,
                size: 20,
                search: search || undefined,
                status: status === 'all' ? undefined : status,
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

    const handleCreate = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createSupplierCatalog({
                name: form.name,
                code: form.code,
                category: form.category || undefined,
                family: form.family || undefined,
                sku: form.sku || undefined,
                basePrice: form.basePrice ? Number(form.basePrice) : undefined,
                unitOfMeasure: form.unitOfMeasure || undefined,
                currency: form.currency || 'USD',
                description: form.description || undefined,
                attributes: form.attributes || undefined,
                specifications: form.specifications || undefined,
                accessLevel: form.accessLevel,
                allowedPartnerOrgIds:
                    form.accessLevel === 'PARTNER_ONLY' &&
                    form.allowedPartnerOrgIds
                        ? form.allowedPartnerOrgIds
                        : undefined,
            });
            toast({ title: 'Catalog created', variant: 'success' });
            setOpen(false);
            setForm(emptyForm);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (c: SupplierCatalog) => {
        setEditing(c);
        setEditForm({
            name: c.name ?? '',
            code: c.code ?? '',
            category: c.category ?? '',
            family: c.family ?? '',
            sku: c.sku ?? '',
            basePrice:
                c.basePrice !== undefined && c.basePrice !== null
                    ? String(c.basePrice)
                    : '',
            currency: c.currency ?? 'USD',
            unitOfMeasure: c.unitOfMeasure ?? '',
            description: c.description ?? '',
            attributes: c.attributes ?? '',
            specifications: c.specifications ?? '',
            accessLevel: c.accessLevel ?? 'PRIVATE',
            allowedPartnerOrgIds: '',
        });
    };

    const handleEdit = async () => {
        if (!editing || saving) return;
        setSaving(true);
        try {
            await updateSupplierCatalog(editing.catalogId, {
                name: editForm.name,
                code: editForm.code,
                category: editForm.category || undefined,
                family: editForm.family || undefined,
                sku: editForm.sku || undefined,
                basePrice: editForm.basePrice
                    ? Number(editForm.basePrice)
                    : undefined,
                unitOfMeasure: editForm.unitOfMeasure || undefined,
                currency: editForm.currency || undefined,
                description: editForm.description || undefined,
                attributes: editForm.attributes || undefined,
                specifications: editForm.specifications || undefined,
                accessLevel: editForm.accessLevel,
                allowedPartnerOrgIds:
                    editForm.accessLevel === 'PARTNER_ONLY' &&
                    editForm.allowedPartnerOrgIds
                        ? editForm.allowedPartnerOrgIds
                        : undefined,
            });
            toast({ title: 'Catalog updated', variant: 'success' });
            setEditing(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const transition = async (
        id: number,
        newStatus: string,
        accessLevel?: string
    ) => {
        try {
            await transitionCatalogStatus(
                id,
                newStatus,
                accessLevel ? { accessLevel } : undefined
            );
            toast({ title: `Moved to ${newStatus}`, variant: 'success' });
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!deleting || deleteBusy) return;
        setDeleteBusy(true);
        try {
            await deleteSupplierCatalog(deleting.catalogId);
            toast({ title: 'Catalog deleted', variant: 'success' });
            setDeleting(null);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        } finally {
            setDeleteBusy(false);
        }
    };

    const renderFormFields = (
        value: typeof emptyForm,
        setValue: (v: typeof emptyForm) => void
    ) => (
        <>
            <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                    placeholder="e.g. Hydraulic Pump X200"
                    value={value.name}
                    onChange={(e) =>
                        setValue({ ...value, name: e.target.value })
                    }
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Code</Label>
                    <Input
                        placeholder="e.g. HYD-PMP-200"
                        value={value.code}
                        onChange={(e) =>
                            setValue({ ...value, code: e.target.value })
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>SKU</Label>
                    <Input
                        placeholder="e.g. SKU-88231"
                        value={value.sku}
                        onChange={(e) =>
                            setValue({ ...value, sku: e.target.value })
                        }
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Category</Label>
                    <Input
                        value={value.category}
                        onChange={(e) =>
                            setValue({ ...value, category: e.target.value })
                        }
                        placeholder="Electronics"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Family</Label>
                    <Input
                        value={value.family}
                        onChange={(e) =>
                            setValue({ ...value, family: e.target.value })
                        }
                        placeholder="Smartphones"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Base Price</Label>
                    <Input
                        type="number"
                        placeholder="e.g. 1499.00"
                        value={value.basePrice}
                        onChange={(e) =>
                            setValue({ ...value, basePrice: e.target.value })
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Currency</Label>
                    <Input
                        placeholder="e.g. USD"
                        value={value.currency}
                        onChange={(e) =>
                            setValue({ ...value, currency: e.target.value })
                        }
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <Label>Unit of Measure</Label>
                <Input
                    placeholder="e.g. KG, PCS, LTR, MTR"
                    value={value.unitOfMeasure}
                    onChange={(e) =>
                        setValue({
                            ...value,
                            unitOfMeasure: e.target.value,
                        })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Access Level</Label>
                <Select
                    value={value.accessLevel}
                    onValueChange={(v) =>
                        setValue({ ...value, accessLevel: v })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ACCESS_LEVELS.map((a) => (
                            <SelectItem key={a} value={a}>
                                {a === 'PARTNER_ONLY' ? 'Partner-only' : a}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {value.accessLevel === 'PARTNER_ONLY' && (
                <div className="grid gap-2">
                    <Label>Allowed Partner Org IDs (comma-separated)</Label>
                    <Input
                        placeholder="e.g. 12, 34"
                        value={value.allowedPartnerOrgIds}
                        onChange={(e) =>
                            setValue({
                                ...value,
                                allowedPartnerOrgIds: e.target.value,
                            })
                        }
                    />
                </div>
            )}
            <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                    placeholder="e.g. Heavy-duty hydraulic pump for industrial use"
                    value={value.description}
                    onChange={(e) =>
                        setValue({ ...value, description: e.target.value })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Attributes (JSON)</Label>
                <Textarea
                    placeholder='e.g. {"color": "red", "weight": "2kg"}'
                    value={value.attributes}
                    onChange={(e) =>
                        setValue({ ...value, attributes: e.target.value })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label>Specifications (JSON)</Label>
                <Textarea
                    placeholder='e.g. {"power": "5kW", "voltage": "220V"}'
                    value={value.specifications}
                    onChange={(e) =>
                        setValue({ ...value, specifications: e.target.value })
                    }
                />
            </div>
        </>
    );

    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Catalog (Category → Family → SKU)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>New Catalog Product</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            {renderFormFields(form, setForm)}
                            <Button onClick={handleCreate} disabled={saving}>
                                {saving && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {saving ? 'Creating…' : 'Create'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Dialog
                open={editing !== null}
                onOpenChange={(v) => !v && setEditing(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Catalog Product</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6">
                        {renderFormFields(editForm, setEditForm)}
                        <Button onClick={handleEdit} disabled={saving}>
                            {saving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={deleting !== null}
                onOpenChange={(v) => !v && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete catalog item?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &ldquo;
                            {deleting?.name}&rdquo;. Published items must be
                            archived first.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteBusy}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteBusy}
                        >
                            {deleteBusy && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {deleteBusy ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle className="flex gap-2">
                        <Input
                            placeholder="Search name/code/sku"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="DRAFT">DRAFT</SelectItem>
                                <SelectItem value="PUBLISHED">
                                    PUBLISHED
                                </SelectItem>
                                <SelectItem value="ARCHIVED">
                                    ARCHIVED
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardTitle>
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Hierarchy</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map((c: SupplierCatalog) => (
                                    <TableRow key={c.catalogId}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {c.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {c.code} • {c.sku}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {c.category} → {c.family} → {c.sku}
                                        </TableCell>
                                        <TableCell>
                                            {c.basePrice
                                                ? `$${c.basePrice}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    c.status === 'PUBLISHED'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {c.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {c.accessLevel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEdit(c)}
                                                >
                                                    <Pencil className="mr-1 h-3 w-3" />
                                                    Edit
                                                </Button>
                                                {c.status === 'DRAFT' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            transition(
                                                                c.catalogId,
                                                                'PUBLISHED',
                                                                c.accessLevel ||
                                                                    'PRIVATE'
                                                            )
                                                        }
                                                    >
                                                        <Check className="mr-1 h-3 w-3" />
                                                        Publish
                                                    </Button>
                                                )}
                                                {c.status === 'PUBLISHED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            transition(
                                                                c.catalogId,
                                                                'DRAFT'
                                                            )
                                                        }
                                                    >
                                                        <RotateCcw className="mr-1 h-3 w-3" />
                                                        Unpublish
                                                    </Button>
                                                )}
                                                {c.status !== 'ARCHIVED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            transition(
                                                                c.catalogId,
                                                                'ARCHIVED'
                                                            )
                                                        }
                                                    >
                                                        <Archive className="mr-1 h-3 w-3" />
                                                        Archive
                                                    </Button>
                                                )}
                                                {c.status === 'ARCHIVED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            transition(
                                                                c.catalogId,
                                                                'DRAFT'
                                                            )
                                                        }
                                                    >
                                                        <RotateCcw className="mr-1 h-3 w-3" />
                                                        Restore
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setDeleting(c)
                                                    }
                                                >
                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No catalog items
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
