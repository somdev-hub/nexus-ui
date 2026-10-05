'use client';
import { useEffect, useState } from 'react';
import { Eye, Loader2, Plus } from 'lucide-react';
import type { SupplierDigitalAsset } from '@/types/supplier';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CatalogSelect } from '@/components/catalog-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getDigitalAssets,
    createDigitalAsset,
    uploadDigitalAssetFile,
    deleteDigitalAsset,
} from '@/lib/services/supplier-catalog-service';
import {
    AssetPreviewDialog,
    type PreviewableAsset,
} from '@/components/asset-preview-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DigitalAssetsPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<SupplierDigitalAsset> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState<PreviewableAsset | null>(null);
    const [form, setForm] = useState({
        catalogId: '',
        assetType: 'DATASHEET',
        fileName: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [deleting, setDeleting] = useState<SupplierDigitalAsset | null>(
        null
    );
    const [deleteBusy, setDeleteBusy] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const res = await getDigitalAssets({ page: 0, size: 20 });
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
    }, []);
    const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

    const handleFileChange = (selected: File | null) => {
        if (!selected) {
            setFile(null);
            return;
        }
        const ext = selected.name.toLowerCase();
        const okType =
            ACCEPTED_TYPES.includes(selected.type) ||
            ext.endsWith('.jpg') ||
            ext.endsWith('.jpeg') ||
            ext.endsWith('.png') ||
            ext.endsWith('.pdf');
        if (!okType) {
            toast({
                title: 'Only JPG, PNG and PDF files are allowed',
                variant: 'destructive',
            });
            return;
        }
        setFile(selected);
        setForm((f) => ({ ...f, fileName: selected.name }));
    };

    const handleCreate = async () => {
        if (saving) return;
        if (!file) {
            toast({
                title: 'A file is required — please choose a JPG, PNG or PDF file',
                variant: 'destructive',
            });
            return;
        }
        setSaving(true);
        try {
            const created = await createDigitalAsset({
                catalogId: Number(form.catalogId),
                assetType: form.assetType,
                fileName: form.fileName,
            });
            try {
                await uploadDigitalAssetFile(created.assetId, file);
                toast({ title: 'Asset created', variant: 'success' });
            } catch (uploadError) {
                console.error(
                    'Failed to upload asset file:',
                    uploadError
                );
                const serverMessage = (
                    uploadError as {
                        response?: { data?: { message?: string } };
                    }
                )?.response?.data?.message;
                toast({
                    title:
                        serverMessage ??
                        (uploadError instanceof Error
                            ? uploadError.message
                            : 'File upload failed — asset was not saved, please try again'),
                    variant: 'destructive',
                });
            }
            setOpen(false);
            setFile(null);
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
    const handleDelete = async () => {
        if (!deleting || deleteBusy) return;
        setDeleteBusy(true);
        try {
            await deleteDigitalAsset(deleting.assetId);
            toast({ title: 'Asset deleted', variant: 'success' });
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
    return (
        <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    Digital Assets (Datasheet / Certifications / 3D)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Asset
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Digital Asset</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Catalog Item</Label>
                                <CatalogSelect
                                    value={form.catalogId}
                                    onChange={(v) =>
                                        setForm({
                                            ...form,
                                            catalogId: v,
                                        })
                                    }
                                    placeholder="Select catalog item"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.assetType}
                                    onValueChange={(v) =>
                                        setForm({ ...form, assetType: v })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DATASHEET">
                                            DATASHEET
                                        </SelectItem>
                                        <SelectItem value="CERTIFICATION">
                                            CERTIFICATION
                                        </SelectItem>
                                        <SelectItem value="COMPLIANCE">
                                            COMPLIANCE
                                        </SelectItem>
                                        <SelectItem value="MODEL_3D">
                                            MODEL_3D
                                        </SelectItem>
                                        <SelectItem value="COA">COA</SelectItem>
                                        <SelectItem value="COC">COC</SelectItem>
                                        <SelectItem value="TEST_REPORT">
                                            TEST_REPORT
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>File (JPG, PNG or PDF) *</Label>
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                    onChange={(e) =>
                                        handleFileChange(
                                            e.target.files?.[0] ?? null
                                        )
                                    }
                                />
                                {file && (
                                    <p className="text-xs text-muted-foreground">
                                        Selected: {file.name}
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={saving || !file}
                            >
                                {saving && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {saving ? 'Creating…' : 'Create'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Assets</CardTitle>
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
                                    <TableHead>Catalog</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>File</TableHead>
                                    <TableHead>DMS</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map(
                                    (a: SupplierDigitalAsset) => (
                                        <TableRow key={a.assetId}>
                                            <TableCell>
                                                {a.catalogName || a.catalogId}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{a.assetType}</Badge>
                                            </TableCell>
                                            <TableCell>{a.fileName}</TableCell>
                                            <TableCell className="text-xs">
                                                {a.dmsDocumentId || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={
                                                            !a.dmsDocumentUrl
                                                        }
                                                        title={
                                                            a.dmsDocumentUrl
                                                                ? 'Preview file'
                                                                : 'No file uploaded yet'
                                                        }
                                                        onClick={() =>
                                                            setPreview({
                                                                assetId:
                                                                    a.assetId,
                                                                name:
                                                                    a.fileName ??
                                                                    `Asset #${a.assetId}`,
                                                                url: a.dmsDocumentUrl,
                                                                type: a.assetType,
                                                            })
                                                        }
                                                    >
                                                        <Eye className="mr-1 h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            setDeleting(a)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No assets
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <AssetPreviewDialog
                asset={preview}
                onClose={() => setPreview(null)}
            />
            <AlertDialog
                open={deleting !== null}
                onOpenChange={(v) => !v && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &ldquo;
                            {deleting?.fileName ??
                                (deleting
                                    ? `Asset #${deleting.assetId}`
                                    : '')}
                            &rdquo;. Quotations referencing this asset will
                            keep their saved file links, but the asset
                            itself cannot be recovered.
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
                            {deleteBusy ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
