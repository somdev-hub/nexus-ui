'use client';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Dialog,
    DialogContent,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useTables } from '@/hooks/use-tables';
import { formatYmd, isBeforeToday, parseYmd } from '@/lib/date-utils';
import { useQuickCreateIntent } from '@/lib/quick-create';
import {
    createCapacity,
    deleteCapacity,
    getCapacities,
    updateCapacity,
} from '@/lib/services/supplier-capacity-service';
import {
    getSupplierCatalogs,
    getVariants,
} from '@/lib/services/supplier-catalog-service';
import type { ProductionCapacity, ProductVariant, SupplierCatalog } from '@/types/supplier';
import type { ColumnDef } from '@tanstack/react-table';
import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react';
import { Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const emptyForm = {
	catalogId: '',
	variantId: '',
	productLine: '',
	periodStart: '',
	periodEnd: '',
	shift: '',
	availableCapacity: '',
	notes: '',
};

/** Row display for a date the API may deliver as a full ISO timestamp. */
const formatDatePart = (value?: string | null) => {
	const parsed = parseYmd(value);
	return parsed ? parsed.toLocaleDateString() : (value ?? '-');
};

export default function CapacityPage() {
	const { toast } = useToast();
	const [capacities, setCapacities] = useState<ProductionCapacity[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);
	useQuickCreateIntent('supplier:capacity', () => setOpen(true));
	const [form, setForm] = useState(emptyForm);
	const [editing, setEditing] = useState<ProductionCapacity | null>(null);
	const [editForm, setEditForm] = useState(emptyForm);
	const [deleting, setDeleting] = useState<ProductionCapacity | null>(null);
	const [saving, setSaving] = useState(false);
	const [deleteBusy, setDeleteBusy] = useState(false);
	// Catalog options + variants of the currently selected catalog item.
	const [catalogs, setCatalogs] = useState<SupplierCatalog[]>([]);
	const [variants, setVariants] = useState<ProductVariant[]>([]);
	const selectedCatalogId =
		editing !== null ? editForm.catalogId : form.catalogId;
	useEffect(() => {
		getSupplierCatalogs({ size: 200 })
			.then((res) => setCatalogs(res.content ?? []))
			.catch(() => setCatalogs([]));
	}, []);
	useEffect(() => {
		if (!selectedCatalogId) {
			setVariants([]);
			return;
		}
		let cancelled = false;
		getVariants({ catalogId: Number(selectedCatalogId), size: 100 })
			.then((res) => {
				if (!cancelled) setVariants(res.content ?? []);
			})
			.catch(() => setVariants([]));
		return () => {
			cancelled = true;
		};
	}, [selectedCatalogId]);
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getCapacities({ page: 0, size: 20 });
			setCapacities(res.content ?? []);
		} catch (e: unknown) {
			toast({
				title: e instanceof Error ? e.message : String(e),
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [toast]);
	useEffect(() => {
		load();
	}, [load]);
	const toPayload = (f: typeof emptyForm) => ({
		catalogId: f.catalogId ? Number(f.catalogId) : undefined,
		variantId: f.variantId ? Number(f.variantId) : undefined,
		productLine: f.productLine || undefined,
		periodStart: f.periodStart,
		periodEnd: f.periodEnd,
		shift: f.shift || undefined,
		availableCapacity: f.availableCapacity
			? Number(f.availableCapacity)
			: 0,
		notes: f.notes || undefined,
	});
	const handleCreate = async () => {
		if (saving) return;
		if (!form.catalogId) {
			toast({
				title: 'Select a catalog item for the capacity period',
				variant: 'destructive',
			});
			return;
		}
		setSaving(true);
		try {
			await createCapacity(toPayload(form));
			toast({ title: 'Capacity created', variant: 'success' });
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
	const openEdit = (c: ProductionCapacity) => {
		setEditing(c);
		setEditForm({
			catalogId: c.catalogId ? String(c.catalogId) : '',
			variantId: c.variantId ? String(c.variantId) : '',
			productLine: c.productLine ?? '',
			periodStart: c.periodStart ?? '',
			periodEnd: c.periodEnd ?? '',
			shift: c.shift ?? '',
			availableCapacity:
				c.availableCapacity !== undefined &&
					c.availableCapacity !== null
					? String(c.availableCapacity)
					: '',
			notes: c.notes ?? '',
		});
	};
	const handleEdit = async () => {
		if (!editing || saving) return;
		setSaving(true);
		try {
			await updateCapacity(editing.capacityId, toPayload(editForm));
			toast({ title: 'Capacity updated', variant: 'success' });
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
	const handleDelete = async () => {
		if (!deleting || deleteBusy) return;
		setDeleteBusy(true);
		try {
			await deleteCapacity(deleting.capacityId);
			toast({ title: 'Capacity deleted', variant: 'success' });
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
	const columns: ColumnDef<ProductionCapacity>[] = [
		{
			id: 'catalog',
			accessorFn: (row) => row.catalogName ?? row.productLine ?? '',
			header: 'Catalog Item',
			cell: ({ row }) => (
				<div className="space-y-1">
					<div>
						{row.original.catalogName ??
							row.original.productLine ??
							'-'}
					</div>
					{row.original.variantLabel && (
						<Badge variant="outline" className="text-xs">
							{row.original.variantLabel}
						</Badge>
					)}
				</div>
			),
		},
		{
			id: 'period',
			accessorFn: (row) => row.periodStart ?? '',
			header: 'Period',
			cell: ({ row }) => (
				<div className="text-xs whitespace-nowrap">
					{formatDatePart(row.original.periodStart)} →{' '}
					{formatDatePart(row.original.periodEnd)}
				</div>
			),
		},
		{
			accessorKey: 'shift',
			header: 'Shift',
			cell: ({ row }) => (
				<Badge variant="outline">{row.original.shift || '-'}</Badge>
			),
		},
		{
			accessorKey: 'availableCapacity',
			header: () => <div className="w-full text-right">Available</div>,
			cell: ({ row }) => (
				<div className="font-mono text-right">
					{row.original.availableCapacity ?? 0}
				</div>
			),
		},
		{
			accessorKey: 'allocatedCapacity',
			header: () => <div className="w-full text-right">Allocated</div>,
			cell: ({ row }) => (
				<div className="font-mono text-right">
					{row.original.allocatedCapacity ?? 0}
				</div>
			),
		},
		{
			id: 'remainingCapacity',
			accessorFn: (row) =>
				row.remainingCapacity ??
				(row.availableCapacity ?? 0) - (row.allocatedCapacity ?? 0),
			header: () => <div className="w-full text-right">Remaining</div>,
			cell: ({ row }) => (
				<div className="font-mono font-medium text-right">
					{row.original.remainingCapacity ??
						(row.original.availableCapacity ?? 0) -
							(row.original.allocatedCapacity ?? 0)}
				</div>
			),
		},
		{
			accessorKey: 'unit',
			header: 'Unit',
			cell: ({ row }) => row.original.unit || '-',
		},
		{
			accessorKey: 'notes',
			header: 'Notes',
			cell: ({ row }) => (
				<div className="max-w-40 truncate text-xs">
					{row.original.notes || '-'}
				</div>
			),
		},
		{
			id: 'actions',
			header: 'Action',
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
						>
							<IconDotsVertical />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem onClick={() => openEdit(row.original)}>
							<IconEdit className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setDeleting(row.original)}
						>
							<IconTrash className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];
	const table = useTables<ProductionCapacity>({
		data: capacities,
		columns,
		getRowId: (row, index) =>
			row.capacityId !== undefined
				? String(row.capacityId)
				: String(index),
	});
	const renderFields = (
		value: typeof emptyForm,
		setValue: (v: typeof emptyForm) => void
	) => (
		<>
			<div className="grid grid-cols-2 gap-3">
				<div className="grid gap-2">
					<Label>Catalog Item</Label>
					<Select
						value={value.catalogId}
						onValueChange={(v) =>
							setValue({ ...value, catalogId: v, variantId: '' })
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select a catalog item" />
						</SelectTrigger>
						<SelectContent>
							{catalogs.map((c) => (
								<SelectItem
									key={c.catalogId}
									value={String(c.catalogId)}
								>
									{c.name}
								</SelectItem>
							))}
							{!catalogs.length && (
								<div className="px-2 py-1.5 text-sm text-muted-foreground">
									No catalog items
								</div>
							)}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<Label>Variant (optional)</Label>
					<Select
						value={value.variantId || 'ALL'}
						onValueChange={(v) =>
							setValue({ ...value, variantId: v === 'ALL' ? '' : v })
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="All variants" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All variants</SelectItem>
							{variants.map((v) => (
								<SelectItem key={v.variantId} value={String(v.variantId)}>
									{v.variantValue} ({v.variantType})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="grid gap-2">
					<Label>Period Start</Label>
					<DatePicker
						date={parseYmd(value.periodStart)}
						onDateChange={(d) =>
							setValue({
								...value,
								periodStart: formatYmd(d),
							})
						}
						disabled={isBeforeToday}
						placeholder="Pick start date"
					/>
				</div>
				<div className="grid gap-2">
					<Label>Period End</Label>
					<DatePicker
						date={parseYmd(value.periodEnd)}
						onDateChange={(d) =>
							setValue({ ...value, periodEnd: formatYmd(d) })
						}
						disabled={isBeforeToday}
						placeholder="Pick end date"
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="grid gap-2">
					<Label>Shift</Label>
					<Input
						value={value.shift}
						onChange={(e) =>
							setValue({ ...value, shift: e.target.value })
						}
						placeholder="MORNING"
					/>
				</div>
				<div className="grid gap-2">
					<Label>Available</Label>
					<Input
						type="number"
						placeholder="e.g. 1000"
						value={value.availableCapacity}
						onChange={(e) =>
							setValue({
								...value,
								availableCapacity: e.target.value,
							})
						}
					/>
				</div>
			</div>
			<div className="grid gap-2">
				<Label>Notes</Label>
				<Textarea
					placeholder="e.g. Overtime shift included"
					value={value.notes}
					onChange={(e) =>
						setValue({ ...value, notes: e.target.value })
					}
				/>
			</div>
		</>
	);
	return (
		<div className="p-4 lg:p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">
					Capacity Calendar (Period / Product Line / Shift)
				</h1>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Capacity
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Capacity</DialogTitle>
						</DialogHeader>
						<div className="grid gap-6">
							{renderFields(form, setForm)}
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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Capacity</DialogTitle>
					</DialogHeader>
					<div className="grid gap-6">
						{renderFields(editForm, setEditForm)}
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
						<AlertDialogTitle>Delete capacity?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the capacity period for
							&ldquo;{deleting?.catalogName ??
								deleting?.productLine}&rdquo; (
							{formatDatePart(deleting?.periodStart)} →{' '}
							{formatDatePart(deleting?.periodEnd)}).
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
					<CardTitle>Capacity Periods</CardTitle>
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
						<CentralizedDataTable
							table={table}
							emptyMessage="No capacity"
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
