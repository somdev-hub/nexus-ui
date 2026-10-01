'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { ProductVariant } from '@/types/supplier';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getVariants,
    createVariant,
    deleteVariant,
} from '@/lib/services/supplier-catalog-service';
import { getMaterials } from '@/lib/services/materials-service';
import type { Material } from '@/types/materials';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';

export default function VariantsPage() {
    const { toast } = useToast();
    const [data, setData] = useState<PaginatedResponse<ProductVariant> | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    useQuickCreateIntent('supplier:variant', () => setOpen(true));
    const [form, setForm] = useState({
        catalogId: '',
        variantType: 'SIZE',
        variantValue: '',
        skuSuffix: '',
        priceAdjustment: '',
        bomMaterialId: '',
    });
    const [materials, setMaterials] = useState<Material[]>([]);
    const load = async () => {
        setLoading(true);
        try {
            const [v, m] = await Promise.all([
                getVariants({ page: 0, size: 20 }),
                getMaterials({ pageNo: 0, pageOffset: 100 }).catch(() => null),
            ]);
            setData(v);
            if (m?.content) setMaterials(m.content);
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
    const handleCreate = async () => {
        try {
            await createVariant({
                catalogId: Number(form.catalogId),
                variantType: form.variantType,
                variantValue: form.variantValue,
                skuSuffix: form.skuSuffix || undefined,
                priceAdjustment: form.priceAdjustment
                    ? Number(form.priceAdjustment)
                    : 0,
                bomMaterialId: form.bomMaterialId
                    ? Number(form.bomMaterialId)
                    : undefined,
            });
            toast({ title: 'Variant created', variant: 'success' });
            setOpen(false);
            load();
        } catch (e: unknown) {
            toast({
                title: e instanceof Error ? e.message : String(e),
                variant: 'destructive',
            });
        }
    };
    const handleDelete = async (id: number) => {
        try {
            await deleteVariant(id);
            toast({ title: 'Variant deleted', variant: 'success' });
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
                    Product Variants (Size / Color / Configuration)
                </h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Variant
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Variant</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Catalog ID</Label>
                                <Input
                                    placeholder="e.g. 101"
                                    value={form.catalogId}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            catalogId: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.variantType}
                                    onValueChange={(v) =>
                                        setForm({ ...form, variantType: v })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SIZE">
                                            SIZE
                                        </SelectItem>
                                        <SelectItem value="COLOR">
                                            COLOR
                                        </SelectItem>
                                        <SelectItem value="CONFIGURATION">
                                            CONFIGURATION
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Value</Label>
                                <Input
                                    value={form.variantValue}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            variantValue: e.target.value,
                                        })
                                    }
                                    placeholder="Red / L / Config A"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>SKU Suffix</Label>
                                    <Input
                                        placeholder="e.g. -RED-XL"
                                        value={form.skuSuffix}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                skuSuffix: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Price Adj.</Label>
                                    <Input
                                        placeholder="e.g. 10.00"
                                        value={form.priceAdjustment}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                priceAdjustment: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>BOM Material</Label>
                                {materials.length ? (
                                    <Select
                                        value={form.bomMaterialId || 'none'}
                                        onValueChange={(v) =>
                                            setForm({
                                                ...form,
                                                bomMaterialId:
                                                    v === 'none' ? '' : v,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select material (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                None
                                            </SelectItem>
                                            {materials.map((m) => (
                                                <SelectItem
                                                    key={m.materialId}
                                                    value={String(m.materialId)}
                                                >
                                                    {m.materialName} (
                                                    {m.materialCode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="e.g. 45 (material ID)"
                                        value={form.bomMaterialId}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                bomMaterialId: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </div>
                            <Button onClick={handleCreate}>Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                    <CardTitle>Variants</CardTitle>
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
                                    <TableHead>Value</TableHead>
                                    <TableHead>SKU Suffix</TableHead>
                                    <TableHead>Price Adj.</TableHead>
                                    <TableHead>BOM</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.content?.map((v: ProductVariant) => (
                                    <TableRow key={v.variantId}>
                                        <TableCell>
                                            {v.catalogName || v.catalogId}
                                        </TableCell>
                                        <TableCell>
                                            <Badge>{v.variantType}</Badge>
                                        </TableCell>
                                        <TableCell>{v.variantValue}</TableCell>
                                        <TableCell>
                                            {v.skuSuffix || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {v.priceAdjustment}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {v.bomMaterialName ||
                                                v.bomMaterialId ||
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDelete(v.variantId)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!data?.content?.length && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-sm text-muted-foreground"
                                        >
                                            No variants
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
