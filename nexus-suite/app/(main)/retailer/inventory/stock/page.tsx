'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Money } from '@/components/money';
import { getStocks, adjustStock, getReorderSuggestions, getInventoryValuation } from '@/lib/services/stock-service';
import { getWarehouses, setProductionCapacity, type Warehouse } from '@/lib/services/warehouses-service';
import apiClient from '@/lib/api-client';
import type { Stock } from '@/types/stock';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function StockPage() {
	const [stocks, setStocks] = useState<Stock[]>([]);
	const [allStocks, setAllStocks] = useState<Stock[]>([]);
	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [wCapacity, setWCapacity] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [totalValue, setTotalValue] = useState<number>(0);
	const [adjustOpen, setAdjustOpen] = useState<number | null>(null);
	const [adjusting, setAdjusting] = useState(false);
	const [adjustForm, setAdjustForm] = useState({
		quantity: '',
		reason: '',
		referenceType: 'MANUAL',
		referenceId: '0',
	});
	const [filter, setFilter] = useState<{
		belowReorderPoint?: boolean;
		warehouseId?: number;
	}>({});
	const [search, setSearch] = useState('');
	const [suggestions, setSuggestions] = useState<Stock[]>([]);
	const [page, setPage] = useState(0);
	const [size, setSize] = useState(20);
	const [totalPages, setTotalPages] = useState(0);
	const [reorderPage, setReorderPage] = useState(0);
	const [reorderTotalPages, setReorderTotalPages] = useState(0);
	const [consignments, setConsignments] = useState<any[]>([]);
	const [vmis, setVmis] = useState<any[]>([]);

	const load = useCallback(async () => {
		setIsLoading(true);
		try {
			const [stockRes, valuation, reorder, whs, cons, vmi] = await Promise.all([
				getStocks({ pageNo: page, pageOffset: size, ...filter }),
				getInventoryValuation().catch(() => null),
				getReorderSuggestions(reorderPage, size).catch(() => ({ content: [], totalPages: 0 })),
				getWarehouses().catch(() => []),
				apiClient.get<any>('/iam/core/retailer/consignment/all').then((r) => (Array.isArray(r.data) ? r.data : (r.data.content ?? []))).catch(() => []),
				apiClient.get<any>('/iam/core/retailer/vmi/all').then((r) => (Array.isArray(r.data) ? r.data : (r.data.content ?? []))).catch(() => []),
			]);
			const list = stockRes.content ?? [];
			setStocks(list);
			setAllStocks(list);
			setSuggestions(reorder.content ?? []);
			setReorderTotalPages(reorder.totalPages ?? 0);
			setWarehouses(whs);
			setConsignments(cons);
			setVmis(vmi);
			setTotalPages(stockRes.totalPages ?? 0);
			if (valuation && valuation.totalValue != null)
				setTotalValue(Number(valuation.totalValue));
			else setTotalValue(0);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to load stock');
		} finally {
			setIsLoading(false);
		}
	}, [filter, page, size, reorderPage]);

	const handleAdjust = async (stockId: number) => {
		if (!adjustForm.quantity || !adjustForm.reason) {
			toast.error('Quantity and reason are required');
			return;
		}
		setAdjusting(true);
		try {
			await adjustStock(stockId, {
				quantity: Number(adjustForm.quantity),
				reason: adjustForm.reason,
				referenceType: adjustForm.referenceType || 'MANUAL',
				referenceId: Number(adjustForm.referenceId) || 0,
			});
			toast.success('Stock adjusted');
			setAdjustOpen(null);
			setAdjustForm({ quantity: '', reason: '', referenceType: 'MANUAL', referenceId: '0' });
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to adjust');
		} finally {
			setAdjusting(false);
		}
	};

	const setAdjust = (k: keyof typeof adjustForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setAdjustForm((f) => ({ ...f, [k]: e.target.value }));

	useEffect(() => {
		load();
	}, [load]);

	const filtered = stocks.filter(
		(s) =>
			!search ||
			(s.materialName ?? '').toLowerCase().includes(search.toLowerCase()) ||
			(s.materialCode ?? '').toLowerCase().includes(search.toLowerCase())
	);

	if (isLoading)
		return (
			<div className="p-6 space-y-4">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-100 w-full" />
			</div>
		);

	return (
		<div className="flex flex-1 flex-col p-6 gap-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold">Stock Inventory</h1>
					<p className="text-muted-foreground">Multi-warehouse inventory</p>
				</div>
				<div className="flex gap-2">
					<Badge variant="outline">
						Total Value: <Money amount={totalValue ?? 0} currency={stocks[0]?.currency} />
					</Badge>
					<Button variant="outline" onClick={load}>Refresh</Button>
				</div>
			</div>

			<Tabs defaultValue="stock">
				<TabsList>
					<TabsTrigger value="stock">Stock</TabsTrigger>
					<TabsTrigger value="warehouses">Warehouses</TabsTrigger>
					<TabsTrigger value="reorder">Reorder</TabsTrigger>
					<TabsTrigger value="consignment">Consignment</TabsTrigger>
					<TabsTrigger value="vmi">VMI</TabsTrigger>
				</TabsList>

				<TabsContent value="stock" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-4">
						<Card className="p-4 gap-2">
							<CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Total SKUs</CardTitle></CardHeader>
							<CardContent className="p-0"><p className="text-2xl font-bold">{stocks.length}</p></CardContent>
						</Card>
						<Card className="p-4 gap-2">
							<CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Below Reorder</CardTitle></CardHeader>
							<CardContent className="p-0"><p className="text-2xl font-bold text-orange-600">{stocks.filter((s) => s.belowReorderPoint).length}</p></CardContent>
						</Card>
						<Card className="p-4 gap-2">
							<CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Below Min</CardTitle></CardHeader>
							<CardContent className="p-0"><p className="text-2xl font-bold text-red-600">{stocks.filter((s) => s.atOrBelowMinLevel).length}</p></CardContent>
						</Card>
						<Card className="p-4 gap-2">
							<CardHeader className="p-0"><CardTitle className="text-sm text-muted-foreground">Valuation</CardTitle></CardHeader>
							<CardContent className="p-0"><p className="text-2xl font-bold"><Money amount={totalValue ?? 0} currency={stocks[0]?.currency} /></p></CardContent>
						</Card>
					</div>
					<div className="flex gap-4">
						<Input placeholder="Search material..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
						<Select onValueChange={(v) => setFilter((f) => ({ ...f, belowReorderPoint: v === 'below' ? true : undefined }))}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Filter" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="below">Below Reorder</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="rounded-lg border overflow-hidden">
						<Table>
							<TableHeader className="bg-muted">
								<TableRow>
									<TableHead>Material</TableHead>
									<TableHead>Warehouse</TableHead>
									<TableHead className="text-right">On Hand</TableHead>
									<TableHead className="text-right">Available</TableHead>
									<TableHead className="text-right">Reserved</TableHead>
									<TableHead>Valuation</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((s) => (
									<TableRow key={s.stockId}>
										<TableCell>
											<div className="font-medium">{s.materialName ?? '—'}</div>
											<div className="text-xs text-muted-foreground">{s.materialCode ?? '—'}</div>
										</TableCell>
										<TableCell>
											{s.warehouseCode ?? '—'}
											<div className="text-xs text-muted-foreground">{s.warehouseLocation ?? ''}</div>
										</TableCell>
										<TableCell className="text-right">{(s.quantityOnHand ?? 0).toString()}</TableCell>
										<TableCell className="text-right font-medium">{(s.quantityAvailable ?? 0).toString()}</TableCell>
										<TableCell className="text-right">{(s.quantityReserved ?? 0).toString()}</TableCell>
										<TableCell>
											<Money amount={s.totalValue ?? 0} currency={s.currency} />
											<div className="text-xs">{s.valuationMethod ?? '—'}</div>
										</TableCell>
										<TableCell>
											{s.belowReorderPoint && <Badge className="bg-orange-100 text-orange-800 mr-1">Reorder</Badge>}
											{s.atOrBelowMinLevel && <Badge className="bg-red-100 text-red-800">Low</Badge>}
											{!s.belowReorderPoint && !s.atOrBelowMinLevel && <Badge variant="outline">OK</Badge>}
										</TableCell>
										<TableCell>
											<Dialog open={adjustOpen === s.stockId} onOpenChange={(v) => setAdjustOpen(v ? s.stockId : null)}>
												<DialogTrigger asChild>
													<Button variant="outline" size="sm">Adjust</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Adjust Stock — {s.materialCode}</DialogTitle>
													</DialogHeader>
													<div className="grid gap-6">
														<div className="grid gap-2">
															<Label>Quantity</Label>
															<Input type="number" placeholder="e.g. 10 (positive) or -5" value={adjustForm.quantity} onChange={setAdjust('quantity')} />
														</div>
														<div className="grid gap-2">
															<Label>Reason</Label>
															<Textarea placeholder="e.g. Cycle count correction" value={adjustForm.reason} onChange={setAdjust('reason')} />
														</div>
														<div className="grid grid-cols-2 gap-3">
															<div className="grid gap-2">
																<Label>Reference Type</Label>
																<Input placeholder="e.g. MANUAL" value={adjustForm.referenceType} onChange={setAdjust('referenceType')} />
															</div>
															<div className="grid gap-2">
																<Label>Reference ID</Label>
																<Input placeholder="e.g. 0" value={adjustForm.referenceId} onChange={setAdjust('referenceId')} />
															</div>
														</div>
														<Button onClick={() => handleAdjust(s.stockId)} disabled={adjusting}>{adjusting ? 'Adjusting...' : 'Apply Adjustment'}</Button>
													</div>
												</DialogContent>
											</Dialog>
										</TableCell>
									</TableRow>
								))}
								{filtered.length === 0 && (
									<TableRow>
										<TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No stock found</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex items-center justify-between">
						<Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
						<span className="text-sm">Page {page + 1} of {Math.max(1, totalPages)}</span>
						<Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
					</div>
				</TabsContent>

				<TabsContent value="warehouses" className="space-y-4">
					<Card className="p-4 gap-2">
						<CardContent className="p-0">
							<div className="flex justify-end w-full pb-4 items-center">
								<CardHeader className="p-0 flex-1"><CardTitle>Warehouses & Capacity</CardTitle></CardHeader>
								<div className="flex justify-end w-full flex-1">
									{warehouses.filter((w) => w.warehouseType === 'PRODUCTION').map((w) => (
										<div key={w.warehouseId} className="flex flex-col gap-2">
											<span className="text-sm font-medium">Production capacity:</span>
											<div className="flex gap-4">
												<Input type="number" value={wCapacity || String(w.capacity ?? w.storageCapacity ?? 0)} onChange={(e) => setWCapacity(e.target.value)} className="w-32" />
												<Button onClick={async () => { try { await setProductionCapacity(Number(wCapacity) || 0); toast.success('Capacity updated'); load(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } }}>Save</Button>
											</div>
										</div>
									))}
								</div>
							</div>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
								{(() => {
									const prod = warehouses.find((w) => w.warehouseType === 'PRODUCTION');
									const reserves = warehouses
										.filter((w) => w.warehouseType === 'RESERVE')
										.sort((a, b) => (a.fillOrder ?? 0) - (b.fillOrder ?? 0))
										.slice(0, 3);
									const display = prod ? [prod, ...reserves] : warehouses.slice(0, 4);
									return display.map((w) => (
										<Card key={w.warehouseId} className="p-4 gap-2 border shadow-sm">
											<CardHeader className="p-0">
												<CardTitle className="text-base flex items-center justify-between">
													<span>{w.code}</span>
													<span className="text-xs font-normal text-muted-foreground">{w.warehouseType}</span>
												</CardTitle>
											</CardHeader>
											<CardContent className="p-0 space-y-2 text-sm">
												<div className="text-muted-foreground">{w.location}</div>
												<div className="flex justify-between"><span>Capacity</span><span className="font-medium">{w.capacity ?? w.storageCapacity ?? 0}</span></div>
												<div className="flex justify-between"><span>Utilization</span><span className="font-medium">{w.currentUtilization ?? 0}</span></div>
												{w.warehouseType === 'RESERVE' && <div className="flex justify-between"><span>Multiplier</span><span className="font-medium">×{w.capacityMultiplier} (auto)</span></div>}
											</CardContent>
										</Card>
									))
								})()}
								{warehouses.length === 0 && <p className="text-sm text-muted-foreground">No warehouses</p>}
							</div>
						</CardContent>
					</Card>
					<div className="space-y-4">
						<h2 className="text-lg font-semibold">Warehouse Stock</h2>
						{Object.values(allStocks.reduce((acc, s) => {
							if (!acc[s.warehouseId]) acc[s.warehouseId] = { warehouseId: s.warehouseId, warehouseCode: s.warehouseCode, warehouseLocation: s.warehouseLocation, items: [] as Stock[] };
							acc[s.warehouseId].items.push(s);
							return acc;
						}, {} as Record<number, { warehouseId: number; warehouseCode: string; warehouseLocation: string; items: Stock[] }>)).map((w) => (
							<Card key={w.warehouseId} className="p-3 gap-2">
								<CardHeader className="p-0">
									<CardTitle className="text-sm">{w.warehouseCode ?? w.warehouseId} {w.warehouseLocation ? `— ${w.warehouseLocation}` : ''}</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									<Table>
										<TableHeader className="bg-muted">
											<TableRow>
												<TableHead>Material</TableHead>
												<TableHead className="text-right">On Hand</TableHead>
												<TableHead className="text-right">Available</TableHead>
												<TableHead className="text-right">Reserved</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{w.items.map((s) => (
												<TableRow key={s.stockId}>
													<TableCell>
														<div className="font-medium">{s.materialName ?? '—'}</div>
														<div className="text-xs text-muted-foreground">{s.materialCode ?? ''}</div>
													</TableCell>
													<TableCell className="text-right">{s.quantityOnHand ?? 0}</TableCell>
													<TableCell className="text-right">{s.quantityAvailable ?? 0}</TableCell>
													<TableCell className="text-right">{s.quantityReserved ?? 0}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="reorder" className="space-y-4">
					<Card className="p-4 gap-2">
						<CardHeader className="p-0 flex flex-row items-center justify-between">
							<CardTitle>Reorder Suggestions ({suggestions.length})</CardTitle>
							<Link href="/retailer/purchase-orders/add"><Button size="sm">Create PO</Button></Link>
						</CardHeader>
						<CardContent className="p-0">
							{suggestions.length === 0 ? (
								<p className="text-sm text-muted-foreground">No items below reorder point.</p>
							) : (
								<div className="rounded-lg border overflow-hidden">
									<Table>
										<TableHeader className="bg-muted">
											<TableRow>
												<TableHead>Material</TableHead>
												<TableHead>Warehouse</TableHead>
												<TableHead className="text-right">Available</TableHead>
												<TableHead className="text-right">Reorder Qty</TableHead>
												<TableHead>Action</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{suggestions.map((s) => (
												<TableRow key={s.stockId}>
													<TableCell>
														<div className="font-medium">{s.materialName ?? '—'}</div>
														<div className="text-xs text-muted-foreground">{s.materialCode ?? '—'}</div>
													</TableCell>
													<TableCell>{s.warehouseCode ?? s.warehouseId}</TableCell>
													<TableCell className="text-right">{(s.quantityAvailable ?? 0).toString()}</TableCell>
													<TableCell className="text-right">{(s.reorderQuantity ?? 0).toString()}</TableCell>
													<TableCell>
														<Link href="/retailer/purchase-orders/add"><Button variant="outline" size="sm">Create PO</Button></Link>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
							<div className="flex items-center justify-between mt-2">
								<Button variant="outline" size="sm" disabled={reorderPage <= 0} onClick={() => setReorderPage((p) => Math.max(0, p - 1))}>Previous</Button>
								<span className="text-sm">Page {reorderPage + 1} of {Math.max(1, reorderTotalPages)}</span>
								<Button variant="outline" size="sm" disabled={reorderPage + 1 >= reorderTotalPages} onClick={() => setReorderPage((p) => p + 1)}>Next</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="consignment" className="space-y-4">
					<Card className="p-4 gap-2">
						<CardHeader className="p-0"><CardTitle>Consignment Stock (Retailer)</CardTitle></CardHeader>
						<CardContent>
							<Table>
								<TableHeader className="bg-muted">
									<TableRow>
										<TableHead>Material</TableHead>
										<TableHead>Supplier</TableHead>
										<TableHead>Warehouse</TableHead>
										<TableHead className="text-right">On Hand</TableHead>
										<TableHead className="text-right">Available</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{consignments.map((r) => (
										<TableRow key={r.consignmentId}>
											<TableCell>{r.material?.name ?? r.material?.materialName ?? '—'}</TableCell>
											<TableCell>{r.supplierOrg?.businessName ?? r.supplierOrg?.name ?? '—'}</TableCell>
											<TableCell>{r.warehouse?.code ?? r.warehouse?.warehouseCode ?? '—'}</TableCell>
											<TableCell className="text-right">{r.quantityOnHand ?? 0}</TableCell>
											<TableCell className="text-right">{r.quantityAvailable ?? 0}</TableCell>
										</TableRow>
									))}
									{consignments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8">No consignment stock</TableCell></TableRow>}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="vmi" className="space-y-4">
					<Card className="p-4 gap-2">
						<CardHeader className="p-0"><CardTitle>VMI (Retailer)</CardTitle></CardHeader>
						<CardContent>
							<Table>
								<TableHeader className="bg-muted">
									<TableRow>
										<TableHead>Material</TableHead>
										<TableHead>Supplier</TableHead>
										<TableHead>Warehouse</TableHead>
										<TableHead className="text-right">Min</TableHead>
										<TableHead className="text-right">Max</TableHead>
										<TableHead className="text-right">Reorder Point</TableHead>
										<TableHead>Auto Replenish</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{vmis.map((r) => (
										<TableRow key={r.vmiId}>
											<TableCell>{r.material?.name ?? r.material?.materialName ?? '—'}</TableCell>
											<TableCell>{r.supplierOrg?.businessName ?? r.supplierOrg?.name ?? '—'}</TableCell>
											<TableCell>{r.warehouse?.code ?? r.warehouse?.warehouseCode ?? '—'}</TableCell>
											<TableCell className="text-right">{r.minLevel ?? 0}</TableCell>
											<TableCell className="text-right">{r.maxLevel ?? 0}</TableCell>
											<TableCell className="text-right">{r.reorderPoint ?? 0}</TableCell>
											<TableCell>{r.autoReplenish ? 'Yes' : 'No'}</TableCell>
										</TableRow>
									))}
									{vmis.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8">No VMI configs</TableCell></TableRow>}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}