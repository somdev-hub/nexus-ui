'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export default function DigitalAssetsPage() {
    const { toast } = useToast();
    const [data, setData] =
        useState<PaginatedResponse<SupplierDigitalAsset> | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        catalogId: '',
        assetType: 'DATASHEET',
        fileName: '',
    });
    const [file, setFile] = useState<File | null>(null);
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
        setSaving(true);
        try {
            const created = await createDigitalAsset({
                catalogId: Number(form.catalogId),
                assetType: form.assetType,
                fileName: form.fileName,
            });
            if (file) {
                try {
                    await uploadDigitalAssetFile(
                        created.assetId,
                        file
                    );
                } catch (uploadError) {
                    console.error(
                        'Failed to upload asset file:',
                        uploadError
                    );
                    toast({
                        title: 'Asset created, but file upload failed — retry from the table',
                        variant: 'destructive',
                    });
                }
            }
            toast({ title: 'Asset created', variant: 'success' });
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
    const handleDelete = async (id: number) => {
        try {
            await deleteDigitalAsset(id);
            toast({ title: 'Asset deleted', variant: 'success' });
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
                                <Label>File (JPG, PNG or PDF)</Label>
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
                                disabled={saving}
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
                                                {a.dmsDocumentUrl ? (
                                                    <a
                                                        href={
                                                            a.dmsDocumentUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline"
                                                    >
                                                        Open file
                                                    </a>
                                                ) : (
                                                    (a.dmsDocumentId || '-')
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(a.assetId)
                                                    }
                                                >
                                                    Delete
                                                </Button>
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
        </div>
    );
}
