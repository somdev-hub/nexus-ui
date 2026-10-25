'use client';
import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ProductionCapacity } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/paginated-response';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	getCapacities,
	createCapacity,
	updateCapacity,
	deleteCapacity,
} from '@/lib/services/supplier-capacity-service';
import {
	getSupplierCatalogs,
	getVariants,
} from '@/lib/services/supplier-catalog-service';
import type { SupplierCatalog, ProductVariant } from '@/types/supplier';
import { useToast } from '@/hooks/use-toast';
import { useQuickCreateIntent } from '@/lib/quick-create';
import { DatePicker } from '@/components/ui/date-picker';
import { formatYmd, parseYmd, isBeforeToday } from '@/lib/date-utils';

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
	const [data, setData] =
		useState<PaginatedResponse<ProductionCapacity> | null>(null);
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
	const load = async () => {
		setLoading(true);
		try {
			const res = await getCapacities({ page: 0, size: 20 });
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
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Catalog Item</TableHead>
									<TableHead>Period</TableHead>
									<TableHead>Shift</TableHead>
									<TableHead>Available</TableHead>
									<TableHead>Allocated</TableHead>
									<TableHead>Remaining</TableHead>
									<TableHead>Unit</TableHead>
									<TableHead>Notes</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.content?.map((c: ProductionCapacity) => (
									<TableRow key={c.capacityId}>
										<TableCell>
											<div className="space-y-1">
												<div>
													{c.catalogName ??
														c.productLine ??
														'-'}
												</div>
												{c.variantLabel && (
													<Badge
														variant="outline"
														className="text-xs"
													>
														{c.variantLabel}
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell className="text-xs whitespace-nowrap">
											{formatDatePart(c.periodStart)} →{' '}
											{formatDatePart(c.periodEnd)}
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{c.shift || '-'}
											</Badge>
										</TableCell>
										<TableCell>
											{c.availableCapacity}
										</TableCell>
										<TableCell>
											{c.allocatedCapacity}
										</TableCell>
										<TableCell className="font-medium">
											{c.remainingCapacity ??
												(c.availableCapacity ?? 0) -
												(c.allocatedCapacity ?? 0)}
										</TableCell>
										<TableCell>{c.unit || '-'}</TableCell>
										<TableCell className="max-w-40 truncate text-xs">
											{c.notes || '-'}
										</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button
													size="sm"
													variant="outline"
													onClick={() => openEdit(c)}
												>
													<Pencil className="mr-1 h-3 w-3" />
													Edit
												</Button>
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
											colSpan={9}
											className="text-center text-sm text-muted-foreground"
										>
											No capacity
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
