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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Money } from '@/components/money';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { formatYmd, parseYmd } from '@/lib/date-utils';
import { useQuickCreateIntent } from '@/lib/quick-create';
import {
	getSupplierPartnerships,
} from '@/lib/services/org-partnerships-service';
import {
	getDigitalAssets,
	getPriceTiers,
	getSupplierCatalogs,
	getVariants,
} from '@/lib/services/supplier-catalog-service';
import {
	convertQuotation,
	createQuotation,
	deleteQuotation,
	getQuotationById,
	getQuotations,
	transitionQuotation,
} from '@/lib/services/supplier-commercial-service';
import type { PaginatedResponse } from '@/types/paginated-response';
import type {
	ProductVariant,
	SupplierCatalog,
	SupplierDigitalAsset,
	SupplierPriceTier,
	SupplierQuotation,
} from '@/types/supplier';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function QuotationsPage() {
	const { toast } = useToast();
	const [data, setData] =
		useState<PaginatedResponse<SupplierQuotation> | null>(null);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);
	useQuickCreateIntent('supplier:quotation', () => setOpen(true));
	const [form, setForm] = useState({
		buyerOrgId: '',
		validFrom: '',
		validTo: '',
		terms: '',
		currency: 'USD',
	});
	type QuotationLine = {
		key: number;
		catalogId: string;
		variantId: string;
		assetIds: string[];
		quantity: string;
		unitPrice: string;
		description: string;
	};
	type CatalogRelated = {
		variants: ProductVariant[];
		tiers: SupplierPriceTier[];
		assets: SupplierDigitalAsset[];
	};
	const [lines, setLines] = useState<QuotationLine[]>([
		{
			key: 0,
			catalogId: '',
			variantId: '',
			assetIds: [],
			quantity: '',
			unitPrice: '',
			description: '',
		},
	]);
	const [lineSeq, setLineSeq] = useState(1);
	const [catalogs, setCatalogs] = useState<SupplierCatalog[]>([]);
	const [relatedByCatalog, setRelatedByCatalog] = useState<
		Record<number, CatalogRelated>
	>({});
	const [saving, setSaving] = useState(false);
	const [deleteBusy, setDeleteBusy] = useState(false);
	const [detail, setDetail] = useState<SupplierQuotation | null>(null);
	const [deleting, setDeleting] = useState<SupplierQuotation | null>(null);
	const [retailers, setRetailers] = useState<
		{ orgId: number; label: string }[]
	>([]);
	const { orgId } = useUserMetadata();
	const load = async () => {
		setLoading(true);
		try {
			const res = await getQuotations({ page: 0, size: 20 });
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
	// Retailers this supplier has a partnership with (for the Buyer dropdown).
	useEffect(() => {
		let active = true;
		const loadRetailers = async () => {
			try {
				const res = await getSupplierPartnerships();
				if (!active) return;
				const own = Number(orgId);
				const seen = new Map<number, string>();
				for (const p of res.content ?? []) {
					if (p.status === 'TERMINATED') continue;
					const isPrimary =
						Number.isFinite(own) &&
						p.primaryOrgId !== undefined &&
						Number(p.primaryOrgId) === own;
					const counterId = isPrimary
						? p.secondaryOrgId
						: p.primaryOrgId;
					if (counterId === undefined) continue;
					const id = Number(counterId);
					if (!Number.isFinite(id) || seen.has(id)) continue;
					const name = isPrimary
						? p.secondaryOrgName
						: p.primaryOrgName;
					seen.set(
						id,
						name ? `${name} (#${id})` : `Org #${id}`
					);
				}
				setRetailers(
					[...seen.entries()].map(([orgId, label]) => ({
						orgId,
						label,
					}))
				);
			} catch {
				// leave dropdown empty; global 500 toast already fired
			}
		};
		loadRetailers();
		return () => {
			active = false;
		};
	}, [orgId]);
	// Supplier's own catalogs for the line-item editor (loaded when dialog opens).
	useEffect(() => {
		if (!open) return;
		let active = true;
		const loadCatalogs = async () => {
			try {
				const res = await getSupplierCatalogs({
					page: 0,
					size: 100,
				});
				if (!active) return;
				setCatalogs(res.content ?? []);
			} catch {
				// silent per line: extra catalog data just won't show
			}
		};
		loadCatalogs();
		return () => {
			active = false;
		};
	}, [open]);
	const ensureRelated = async (catalogId: number) => {
		if (!Number.isFinite(catalogId)) return;
		if (relatedByCatalog[catalogId]) return;
		try {
			const [v, t, a] = await Promise.all([
				getVariants({ catalogId }).catch(() => null),
				getPriceTiers({ catalogId }).catch(() => null),
				getDigitalAssets({ catalogId }).catch(() => null),
			]);
			setRelatedByCatalog((prev) => {
				if (prev[catalogId]) return prev;
				return {
					...prev,
					[catalogId]: {
						variants: v?.content ?? [],
						tiers: t?.content ?? [],
						assets: a?.content ?? [],
					},
				};
			});
		} catch {
			// silent per line: just show nothing extra
		}
	};
	const updateLine = (index: number, patch: Partial<QuotationLine>) => {
		setLines((prev) =>
			prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
		);
	};
	const handleCatalogChange = (index: number, value: string) => {
		const catalog = catalogs.find((c) => String(c.catalogId) === value);
		updateLine(index, {
			catalogId: value,
			variantId: '',
			assetIds: [],
			description: catalog?.name ?? '',
			unitPrice:
				catalog?.basePrice !== undefined &&
					catalog?.basePrice !== null
					? String(catalog.basePrice)
					: '',
		});
		const id = Number(value);
		if (Number.isFinite(id) && value !== '') void ensureRelated(id);
	};
	const handleVariantChange = (index: number, variantValue: string) => {
		const line = lines[index];
		updateLine(index, { variantId: variantValue });
		if (!variantValue) {
			const catalog = catalogs.find(
				(c) => String(c.catalogId) === line?.catalogId
			);
			if (
				catalog?.basePrice !== undefined &&
				catalog?.basePrice !== null
			) {
				updateLine(index, {
					variantId: variantValue,
					unitPrice: String(catalog.basePrice),
				});
			}
			return;
		}
		const catalogId = Number(line?.catalogId);
		const related = Number.isFinite(catalogId)
			? relatedByCatalog[catalogId]
			: undefined;
		const variant = related?.variants.find(
			(v) => String(v.variantId) === variantValue
		);
		if (variant) {
			const catalog = catalogs.find(
				(c) => Number(c.catalogId) === Number(variant.catalogId)
			);
			const base = Number(catalog?.basePrice ?? 0);
			const adj = Number(variant.priceAdjustment ?? 0);
			updateLine(index, {
				variantId: variantValue,
				unitPrice: String(base + adj),
			});
		}
	};
	const handleUseTierPrice = (index: number, price: number) => {
		updateLine(index, { unitPrice: String(price) });
	};
	const addLine = () => {
		setLines((prev) => [
			...prev,
			{
				key: lineSeq,
				catalogId: '',
				variantId: '',
				assetIds: [],
				quantity: '',
				unitPrice: '',
				description: '',
			},
		]);
		setLineSeq((s) => s + 1);
	};
	const removeLine = (index: number) => {
		setLines((prev) =>
			prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
		);
	};
	const handleCreate = async () => {
		if (saving) return;
		setSaving(true);
		try {
			await createQuotation({
				buyerOrgId: form.buyerOrgId
					? Number(form.buyerOrgId)
					: undefined,
				validFrom: form.validFrom || undefined,
				validTo: form.validTo || undefined,
				terms: form.terms || undefined,
				currency: form.currency || 'USD',
				lineItems: lines.map((l) => ({
					...(l.catalogId
						? { catalogId: Number(l.catalogId) }
						: {}),
					...(l.assetIds.length
						? {
								digitalAssetIds: l.assetIds.map((a) =>
									Number(a)
								),
							}
						: {}),
					quantity: Number(l.quantity || 1),
					unitPrice: Number(l.unitPrice || 0),
					description: l.description || undefined,
				})),
			});
			toast({ title: 'Quotation created', variant: 'success' });
			setOpen(false);
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
	const transition = async (id: number, status: string) => {
		try {
			await transitionQuotation(id, status);
			toast({ title: `Moved to ${status}`, variant: 'success' });
			load();
		} catch (e: unknown) {
			toast({
				title: e instanceof Error ? e.message : String(e),
				variant: 'destructive',
			});
		}
	};
	const convert = async (id: number) => {
		try {
			const r = await convertQuotation(id);
			toast({
				title: `Converted to PO ${r.poNumber}`,
				variant: 'success',
			});
			load();
		} catch (e: unknown) {
			toast({
				title: e instanceof Error ? e.message : String(e),
				variant: 'destructive',
			});
		}
	};
	const openDetail = async (id: number) => {
		try {
			const q = await getQuotationById(id);
			setDetail(q);
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
			await deleteQuotation(deleting.quotationId);
			toast({ title: 'Quotation deleted', variant: 'success' });
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
					Quotations (Versioned, Validity, Terms, Convert to Order)
				</h1>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create Quotation
						</Button>
					</DialogTrigger>
					<DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-3xl">
						<DialogHeader>
							<DialogTitle>New Quotation</DialogTitle>
						</DialogHeader>
						<div className="grid gap-6">
							<div className="grid gap-2">
								<Label>Buyer (Retailer)</Label>
								{retailers.length === 0 ? (
									<p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
										There is no established partnership
										with any retailer yet. Accept a
										retailer invitation first to raise a
										quotation.
									</p>
								) : (
									<Select
										value={
											form.buyerOrgId
												? String(form.buyerOrgId)
												: ''
										}
										onValueChange={(v) =>
											setForm({
												...form,
												buyerOrgId: v,
											})
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select retailer" />
										</SelectTrigger>
										<SelectContent>
											{retailers.map((r) => (
												<SelectItem
													key={r.orgId}
													value={String(r.orgId)}
												>
													{r.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="grid gap-2">
									<Label>Valid From</Label>
									<DatePicker
										date={parseYmd(form.validFrom)}
										onDateChange={(d) =>
											setForm({
												...form,
												validFrom: formatYmd(d),
											})
										}
										placeholder="Pick start date"
									/>
								</div>
								<div className="grid gap-2">
									<Label>Valid To</Label>
									<DatePicker
										date={parseYmd(form.validTo)}
										onDateChange={(d) =>
											setForm({
												...form,
												validTo: formatYmd(d),
											})
										}
										placeholder="Pick end date"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="grid gap-2">
									<Label>Currency</Label>
									<Select
										value={form.currency}
										onValueChange={(v) =>
											setForm({
												...form,
												currency: v,
											})
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select currency" />
										</SelectTrigger>
										<SelectContent>
											{['USD', 'EUR', 'GBP', 'INR'].map(
												(c) => (
													<SelectItem
														key={c}
														value={c}
													>
														{c}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Terms</Label>
								<Textarea
									placeholder="e.g. Net 30, FOB destination"
									value={form.terms}
									onChange={(e) =>
										setForm({
											...form,
											terms: e.target.value,
										})
									}
								/>
							</div>
							<div className="grid gap-3">
								<div className="flex items-center justify-between">
									<Label>Line Items</Label>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={addLine}
									>
										<Plus className="mr-1 h-3 w-3" />
										Add line
									</Button>
								</div>
								{lines.map((line, index) => {
									const catalogIdNum = Number(line.catalogId);
									const related =
										Number.isFinite(catalogIdNum) &&
											line.catalogId !== ''
											? relatedByCatalog[catalogIdNum]
											: undefined;
									const selectedVariant =
										related?.variants.find(
											(v) =>
												String(v.variantId) ===
												line.variantId
										);
									const qty = Number(line.quantity || 0);
									const price = Number(line.unitPrice || 0);
									const total =
										Number.isFinite(qty) &&
											Number.isFinite(price)
											? qty * price
											: 0;
									return (
										<div
											key={line.key}
											className="grid gap-3 rounded-md border p-3"
										>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Line {index + 1}
												</span>
												<Button
													type="button"
													size="sm"
													variant="ghost"
													disabled={lines.length <= 1}
													onClick={() =>
														removeLine(index)
													}
												>
													Remove
												</Button>
											</div>
											<div className="grid gap-2">
												<Label>Catalog</Label>
												<Select
													value={line.catalogId}
													onValueChange={(v) =>
														handleCatalogChange(
															index,
															v
														)
													}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select catalog" />
													</SelectTrigger>
													<SelectContent>
														{catalogs.map((c) => (
															<SelectItem
																key={
																	c.catalogId
																}
																value={String(
																	c.catalogId
																)}
															>
																{c.name} (
																{c.code}) —{' '}
																{c.basePrice ??
																	'-'}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											{related && (
												<div className="grid gap-2">
													<Label>Variant</Label>
													<Select
														value={line.variantId}
														onValueChange={(v) =>
															handleVariantChange(
																index,
																v === 'none'
																	? ''
																	: v
															)
														}
													>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="No variant" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">
																No variant
															</SelectItem>
															{related.variants.map(
																(v) => (
																	<SelectItem
																		key={
																			v.variantId
																		}
																		value={String(
																			v.variantId
																		)}
																	>
																		{
																			v.variantType
																		}
																		:{' '}
																		{
																			v.variantValue
																		}
																		{v.skuSuffix
																			? ` (${v.skuSuffix})`
																			: ''}{' '}
																		—
																		stock{' '}
																		{v.quantityAvailable ??
																			'-'}
																	</SelectItem>
																)
															)}
														</SelectContent>
													</Select>
													{selectedVariant && (
														<p className="text-xs text-muted-foreground">
															{
																selectedVariant.variantType
															}
															:{' '}
															{
																selectedVariant.variantValue
															}
															{selectedVariant.skuSuffix
																? ` · SKU suffix ${selectedVariant.skuSuffix}`
																: ''}{' '}
															· Stock{' '}
															{selectedVariant.quantityAvailable ??
																'-'}
															{selectedVariant.priceAdjustment !==
																undefined &&
																` · Adj ${selectedVariant.priceAdjustment}`}
														</p>
													)}
												</div>
											)}
											<div className="grid grid-cols-3 gap-3">
												<div className="grid gap-2">
													<Label>Qty</Label>
													<Input
														placeholder="e.g. 100"
														value={line.quantity}
														onChange={(e) =>
															updateLine(index, {
																quantity:
																	e.target
																		.value,
															})
														}
													/>
												</div>
												<div className="grid gap-2">
													<Label>Unit Price</Label>
													<Input
														placeholder="e.g. 99.50"
														value={line.unitPrice}
														onChange={(e) =>
															updateLine(index, {
																unitPrice:
																	e.target
																		.value,
															})
														}
													/>
												</div>
												<div className="grid gap-2">
													<Label>Total</Label>
													<div className="flex h-9 items-center text-sm font-medium">
														{total.toFixed(2)}
													</div>
												</div>
											</div>
											<div className="grid gap-2">
												<Label>Description</Label>
												<Input
													placeholder="Line description"
													value={line.description}
													onChange={(e) =>
														updateLine(index, {
															description:
																e.target.value,
														})
													}
												/>
											</div>
											{related &&
												related.tiers.length > 0 && (
													<div className="grid gap-2">
														<Label>
															Price tiers
														</Label>
														<div className="overflow-x-auto rounded-md border">
															<table className="w-full text-xs">
																<thead>
																	<tr className="border-b bg-muted/50 text-left">
																		<th className="px-2 py-1 font-medium">
																			Tier
																		</th>
																		<th className="px-2 py-1 font-medium">
																			Qty
																		</th>
																		<th className="px-2 py-1 font-medium">
																			Unit
																			price
																		</th>
																		<th className="px-2 py-1" />
																	</tr>
																</thead>
																<tbody>
																	{related.tiers.map(
																		(
																			t
																		) => (
																			<tr
																				key={
																					t.tierId
																				}
																				className="border-b last:border-0"
																			>
																				<td className="px-2 py-1">
																					{t.tierName ??
																						`#${t.tierId}`}
																				</td>
																				<td className="px-2 py-1">
																					{t.minQuantity ??
																						'—'}{' '}
																					–{' '}
																					{t.maxQuantity ??
																						'∞'}
																				</td>
																				<td className="px-2 py-1">
																					{
																						t.unitPrice
																					}
																				</td>
																				<td className="px-2 py-1 text-right">
																					<Button
																						type="button"
																						size="sm"
																						variant="outline"
																						onClick={() =>
																							handleUseTierPrice(
																								index,
																								t.unitPrice
																							)
																						}
																					>
																						Use
																						price
																					</Button>
																				</td>
																			</tr>
																		)
																	)}
																</tbody>
															</table>
														</div>
													</div>
												)}
											{related &&
												related.assets.length > 0 && (() => {
													const allIds =
														related.assets.map(
															(a) =>
																String(
																	a.assetId
																)
														);
													const allChecked =
														allIds.length > 0 &&
														allIds.every((id) =>
															line.assetIds.includes(
																id
															)
														);
													const toggleAsset = (
														id: string
													) =>
														updateLine(index, {
															assetIds:
																line.assetIds.includes(
																	id
																)
																	? line.assetIds.filter(
																			(x) =>
																				x !==
																				id
																		)
																	: [
																			...line.assetIds,
																			id,
																		],
														});
													return (
														<div className="grid gap-2">
															<Label>
																Digital assets
																(
																{
																	line
																		.assetIds
																		.length
																}{' '}
																selected)
															</Label>
															<div className="flex items-center gap-2 rounded-md border px-3 py-2">
																<Checkbox
																	checked={
																		allChecked
																	}
																	onCheckedChange={() =>
																		updateLine(
																			index,
																			{
																				assetIds:
																					allChecked
																						? []
																						: [
																								...allIds,
																							],
																			}
																		)
																	}
																/>
																<span className="text-sm font-medium">
																	Select all
																</span>
															</div>
															<div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
																{related.assets.map(
																	(a) => {
																		const id =
																			String(
																				a.assetId
																			);
																		return (
																			<label
																				key={
																					a.assetId
																				}
																				className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
																			>
																				<Checkbox
																					checked={line.assetIds.includes(
																						id
																					)}
																					onCheckedChange={() =>
																						toggleAsset(
																							id
																						)
																					}
																				/>
																				<span>
																					{a.fileName ??
																						`Asset #${a.assetId}`}{' '}
																					<span className="text-muted-foreground">
																						(
																						{
																							a.assetType
																						}
																						)
																					</span>
																				</span>
																			</label>
																		);
																	}
																)}
															</div>
														</div>
													);
												})()}
										</div>
									);
								})}
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
					<CardTitle>Quotations</CardTitle>
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
									<TableHead>Number</TableHead>
									<TableHead>Buyer</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Version</TableHead>
									<TableHead>Validity</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.content?.map((q: SupplierQuotation) => (
									<TableRow key={q.quotationId}>
										<TableCell className="font-medium">
											<button
												className="underline underline-offset-2"
												onClick={() =>
													openDetail(q.quotationId)
												}
											>
												{q.quotationNumber}
											</button>
										</TableCell>
										<TableCell>
											{q.buyerOrgName ||
												q.buyerOrgId ||
												'-'}
										</TableCell>
										<TableCell>
											<Badge>{q.status}</Badge>
										</TableCell>
										<TableCell>
											v{q.versionNumber ?? 1}
										</TableCell>
										<TableCell className="text-xs whitespace-nowrap">
											{q.validFrom
												? new Date(
														q.validFrom
													).toLocaleDateString()
												: '-'}{' '}
											→{' '}
											{q.validTo
												? new Date(
														q.validTo
													).toLocaleDateString()
												: '-'}
										</TableCell>
										<TableCell>
											<Money
												amount={q.totalAmount}
												currency={q.currency}
											/>
										</TableCell>
										<TableCell className="flex flex-wrap gap-1">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													openDetail(q.quotationId)
												}
											>
												History
											</Button>
											{q.status === 'DRAFT' && (
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														transition(
															q.quotationId,
															'SENT'
														)
													}
												>
													Send
												</Button>
											)}
											{q.status === 'SENT' && (
												<Button
													size="sm"
													onClick={() =>
														transition(
															q.quotationId,
															'ACCEPTED'
														)
													}
												>
													Accept
												</Button>
											)}
											{(q.status === 'DRAFT' ||
												q.status === 'SENT') && (
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															transition(
																q.quotationId,
																'REJECTED'
															)
														}
													>
														Reject
													</Button>
												)}
											{q.status === 'SENT' && (
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														transition(
															q.quotationId,
															'EXPIRED'
														)
													}
												>
													Expire
												</Button>
											)}
											{q.status === 'ACCEPTED' && (
												<Button
													size="sm"
													onClick={() =>
														convert(q.quotationId)
													}
												>
													Convert to Order
												</Button>
											)}
											{q.status !== 'ACCEPTED' &&
												q.status !== 'CONVERTED' && (
													<Button
														size="sm"
														variant="destructive"
														onClick={() =>
															setDeleting(q)
														}
													>
														Delete
													</Button>
												)}
										</TableCell>
									</TableRow>
								))}
								{!data?.content?.length && (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center text-sm text-muted-foreground"
										>
											No quotations
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
			<Dialog
				open={detail !== null}
				onOpenChange={(v) => !v && setDetail(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Quotation {detail?.quotationNumber} (v
							{detail?.versionNumber ?? 1})
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-6">
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div className="grid gap-2">
								<Label>Status</Label>
								<div>
									<Badge>{detail?.status}</Badge>
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Parent Quotation</Label>
								<div>
									{(
										detail as SupplierQuotation & {
											parentQuotationId?: number;
										}
									)?.parentQuotationId ?? '-'}
								</div>
							</div>
						</div>
						<div className="grid gap-2">
							<Label>Line Items</Label>
							<div className="space-y-1 text-sm">
								{detail?.lineItems?.map((li, i) => (
									<div
										key={i}
										className="flex justify-between border-b py-1 last:border-0"
									>
										<span>
											Catalog {li.catalogId} ×{' '}
											{li.quantity}
											{(li.digitalAssetNames?.length ||
												li.digitalAssetName ||
												li.digitalAssetId !== undefined) && (
												<span className="text-xs text-muted-foreground">
													{' '}
													· Assets:{' '}
													{(li.digitalAssetNames ??
														[]
													).join(', ') ||
														(li.digitalAssetName ??
														(li.digitalAssetId !==
														undefined
															? `#${li.digitalAssetId}`
															: ''))}
												</span>
											)}
										</span>
										<span>
											${li.unitPrice} = ${li.totalPrice}
										</span>
									</div>
								))}
								{!detail?.lineItems?.length && (
									<div className="text-sm text-muted-foreground">
										No line items
									</div>
								)}
							</div>
						</div>
						<div className="grid gap-2">
							<Label>Terms</Label>
							<div className="text-sm">
								{detail?.terms || '-'}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<AlertDialog
				open={deleting !== null}
				onOpenChange={(v) => !v && setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete quotation?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete quotation &ldquo;
							{deleting?.quotationNumber}&rdquo;. Accepted or
							converted quotations cannot be deleted.
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
		</div>
	);
}
