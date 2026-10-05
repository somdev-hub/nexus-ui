'use client';
import Link from 'next/link';
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Money } from '@/components/money';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useQuickCreateIntent } from '@/lib/quick-create';
import {
	getSupplierCatalogs,
} from '@/lib/services/supplier-catalog-service';
import {
	createQuotation,
	deleteQuotation,
	getQuotations,
	transitionQuotation,
	updateQuotation,
} from '@/lib/services/supplier-commercial-service';
import {
	buildQuotationPayload,
	emptyQuotationForm,
	fetchRetailerOptions,
	quotationToFormValues,
	QuotationForm,
	type QuotationFormValues,
	type QuotationRetailerOption,
} from '@/components/quotation-form';
import type { PaginatedResponse } from '@/types/paginated-response';
import type {
	SupplierCatalog,
	SupplierQuotation,
} from '@/types/supplier';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function QuotationsPage() {
	const { toast } = useToast();
	const [data, setData] =
		useState<PaginatedResponse<SupplierQuotation> | null>(null);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);
	useQuickCreateIntent('supplier:quotation', () => setOpen(true));
	const [catalogs, setCatalogs] = useState<SupplierCatalog[]>([]);
	const [saving, setSaving] = useState(false);
	const [deleteBusy, setDeleteBusy] = useState(false);
	const [deleting, setDeleting] = useState<SupplierQuotation | null>(null);
	const [editing, setEditing] = useState<SupplierQuotation | null>(null);
	const [retailers, setRetailers] = useState<QuotationRetailerOption[]>([]);
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
		const run = async () => {
			try {
				const options = await fetchRetailerOptions(orgId);
				if (!active) return;
				setRetailers(options);
			} catch {
				// leave dropdown empty; global 500 toast already fired
			}
		};
		run();
		return () => {
			active = false;
		};
	}, [orgId]);
	// Supplier's own catalogs for the line-item editor (loaded when a dialog opens).
	useEffect(() => {
		if (!open && !editing) return;
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
				// silent: extra catalog data just won't show
			}
		};
		loadCatalogs();
		return () => {
			active = false;
		};
	}, [open, editing]);
	const createInitial = useMemo(() => emptyQuotationForm(), []);
	const editInitial = useMemo(
		() => (editing ? quotationToFormValues(editing) : null),
		[editing]
	);
	const handleCreateSubmit = async (values: QuotationFormValues) => {
		if (saving) return;
		setSaving(true);
		try {
			await createQuotation(buildQuotationPayload(values));
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
	const handleUpdateSubmit = async (values: QuotationFormValues) => {
		if (!editing || saving) return;
		setSaving(true);
		try {
			await updateQuotation(
				editing.quotationId,
				buildQuotationPayload(values)
			);
			toast({ title: 'Quotation updated', variant: 'success' });
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
					Quotations (Versioned, Validity, Terms)
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
						<QuotationForm
							key="new"
							initial={createInitial}
							retailers={retailers}
							catalogs={catalogs}
							saving={saving}
							submitLabel="Create"
							savingLabel="Creating…"
							onSubmit={handleCreateSubmit}
						/>
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
									<TableHead>Created</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.content?.map((q: SupplierQuotation) => (
									<TableRow key={q.quotationId}>
									<TableCell className="font-medium">
										<Link
											className="underline underline-offset-2"
											href={`/supplier/quotations/${q.quotationId}`}
										>
											{q.quotationNumber}
										</Link>
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
										<TableCell className="text-xs whitespace-nowrap">
											{q.createdAt ? (
												<>
													<div>
														{new Date(
															q.createdAt
														).toLocaleDateString()}
													</div>
													<div className="text-muted-foreground">
														{new Date(
															q.createdAt
														).toLocaleTimeString(
															[],
															{
																hour: '2-digit',
																minute: '2-digit',
															}
														)}
													</div>
												</>
											) : (
												'-'
											)}
										</TableCell>
										<TableCell>
											<Money
												amount={q.totalAmount}
												currency={q.currency}
											/>
										</TableCell>
									<TableCell className="flex flex-wrap gap-1">
										<Button size="sm" variant="outline" asChild>
											<Link
												href={`/supplier/quotations/${q.quotationId}`}
											>
												View
											</Link>
										</Button>
											{q.status === 'DRAFT' && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => setEditing(q)}
												>
													Edit
												</Button>
											)}
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
											colSpan={8}
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
				open={editing !== null}
				onOpenChange={(v) => !v && setEditing(null)}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-3xl">
					<DialogHeader>
						<DialogTitle>
							Edit Quotation {editing?.quotationNumber} (v
							{editing?.versionNumber ?? 1})
						</DialogTitle>
					</DialogHeader>
					{editInitial && (
						<QuotationForm
							key={editing?.quotationId ?? 'edit'}
							initial={editInitial}
							retailers={retailers}
							catalogs={catalogs}
							saving={saving}
							submitLabel="Save changes"
							savingLabel="Saving…"
							onSubmit={handleUpdateSubmit}
						/>
					)}
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
