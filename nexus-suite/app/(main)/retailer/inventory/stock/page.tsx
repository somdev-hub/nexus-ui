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
import { Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Money } from '@/components/money';
import { getStocks, adjustStock, getReorderSuggestions, getInventoryValuation, getRetailerConsignments, getRetailerVmis, consumeConsignment, returnConsignment, receiveConsignment } from '@/lib/services/stock-service';
import { getWarehouses, setProductionCapacity, type Warehouse } from '@/lib/services/warehouses-service';
import type { ConsignmentStock, VmiConfig } from '@/types/supplier';
import type { Stock } from '@/types/stock';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';

/** Per-page fetch: one larger batch so the centralized tables paginate client-side. */
const STOCK_PAGE_SIZE = 100;

/** Sub-list of a single warehouse's stock — own table instance (grouped view). */
function WarehouseStockList({ stocks }: { stocks: Stock[] }) {
	const columns: ColumnDef<Stock>[] = [
		{
			id: 'material',
			header: 'Material',
			accessorFn: (row) => row.materialName ?? '',
			cell: ({ row }) => (
				<div>
					<div className="font-medium">{row.original.materialName ?? '—'}</div>
					<div className="text-xs text-muted-foreground">{row.original.materialCode ?? ''}</div>
				</div>
			),
			enableHiding: false,
		},
		{
			accessorKey: 'quantityOnHand',
			header: () => <div className="w-full text-right">On Hand</div>,
			cell: ({ row }) => <div className="text-right">{row.original.quantityOnHand ?? 0}</div>,
		},
		{
			accessorKey: 'quantityAvailable',
			header: () => <div className="w-full text-right">Available</div>,
			cell: ({ row }) => <div className="text-right">{row.original.quantityAvailable ?? 0}</div>,
		},
		{
			accessorKey: 'quantityReserved',
			header: () => <div className="w-full text-right">Reserved</div>,
			cell: ({ row }) => <div className="text-right">{row.original.quantityReserved ?? 0}</div>,
		},
	];

	const table = useTables<Stock>({
		data: stocks,
		columns,
		enablePagination: false,
		getRowId: (row) => row.stockId.toString(),
	});

	return (
		<CentralizedDataTable
			table={table}
			hidePagination
			emptyMessage="No stock in this warehouse"
		/>
	);
}

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
	const [consignments, setConsignments] = useState<ConsignmentStock[]>([]);
	const [vmis, setVmis] = useState<VmiConfig[]>([]);
	const [consignmentAction, setConsignmentAction] = useState<{ c: ConsignmentStock; type: 'receive' | 'consume' | 'return' } | null>(null);
	const [consignmentQty, setConsignmentQty] = useState('');
	const [consignmentSubmitting, setConsignmentSubmitting] = useState(false);

	const load = useCallback(async () => {
		setIsLoading(true);
		try {
			const [stockRes, valuation, reorder, whs, cons, vmi] = await Promise.all([
				getStocks({ pageNo: 0, pageOffset: STOCK_PAGE_SIZE, ...filter }),
				getInventoryValuation().catch(() => null),
				// One larger batch for the centralized (client-side paged) table.
				getReorderSuggestions(0, STOCK_PAGE_SIZE).catch(() => ({ content: [] })),
				getWarehouses().catch(() => []),
				getRetailerConsignments().catch(() => []),
				getRetailerVmis().catch(() => []),
			]);
			const list = stockRes.content ?? [];
			setStocks(list);
			setAllStocks(list);
			setSuggestions(reorder.content ?? []);
			setWarehouses(whs);
			setConsignments(cons);
			setVmis(vmi);
			if (valuation && valuation.totalValue != null)
				setTotalValue(Number(valuation.totalValue));
			else setTotalValue(0);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to load stock');
		} finally {
			setIsLoading(false);
		}
	}, [filter]);

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

	const filtered = useMemo(
		() =>
			stocks.filter(
				(s) =>
					(s.quantityOnHand ?? 0) > 0 &&
					(!search ||
						(s.materialName ?? '').toLowerCase().includes(search.toLowerCase()) ||
						(s.materialCode ?? '').toLowerCase().includes(search.toLowerCase()))
			),
		[stocks, search]
	);

	const stockColumns: ColumnDef<Stock>[] = [
		{
			id: 'material',
			header: 'Material',
			accessorFn: (row) => row.materialName ?? '',
			cell: ({ row }) => (
				<div>
					<div className="font-medium">{row.original.materialName ?? '—'}</div>
					<div className="text-xs text-muted-foreground">{row.original.materialCode ?? '—'}</div>
				</div>
			),
			enableHiding: false,
		},
		{
			id: 'warehouse',
			header: 'Warehouse',
			accessorFn: (row) => row.warehouseCode ?? '',
			cell: ({ row }) => (
				<div>
					{row.original.warehouseCode ?? '—'}
					<div className="text-xs text-muted-foreground">{row.original.warehouseLocation ?? ''}</div>
				</div>
			),
		},
		{
			accessorKey: 'quantityOnHand',
			header: () => <div className="w-full text-right">On Hand</div>,
			cell: ({ row }) => <div className="text-right">{(row.original.quantityOnHand ?? 0).toString()}</div>,
		},
		{
			accessorKey: 'quantityAvailable',
			header: () => <div className="w-full text-right">Available</div>,
			cell: ({ row }) => <div className="text-right font-medium">{(row.original.quantityAvailable ?? 0).toString()}</div>,
		},
		{
			accessorKey: 'quantityReserved',
			header: () => <div className="w-full text-right">Reserved</div>,
			cell: ({ row }) => <div className="text-right">{(row.original.quantityReserved ?? 0).toString()}</div>,
		},
		{
			accessorKey: 'totalValue',
			header: 'Valuation',
			cell: ({ row }) => (
				<div>
					<Money amount={row.original.totalValue ?? 0} currency={row.original.currency} />
					<div className="text-xs">{row.original.valuationMethod ?? '—'}</div>
				</div>
			),
		},
		{
			id: 'status',
			header: 'Status',
			accessorFn: (row) => (row.belowReorderPoint || row.atOrBelowMinLevel ? 1 : 0),
			cell: ({ row }) => (
				<div>
					{row.original.belowReorderPoint && <Badge className="bg-orange-100 text-orange-800 mr-1">Reorder</Badge>}
					{row.original.atOrBelowMinLevel && <Badge className="bg-red-100 text-red-800">Low</Badge>}
					{!row.original.belowReorderPoint && !row.original.atOrBelowMinLevel && <Badge variant="outline">OK</Badge>}
				</div>
			),
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="text-muted-foreground size-8">
							<IconDotsVertical />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem onSelect={() => setAdjustOpen(row.original.stockId)}>
							Adjust
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	const stockTable = useTables<Stock>({
		data: filtered,
		columns: stockColumns,
		pageSize: DEFAULT_TABLE_PAGE_SIZE,
		sorting: [],
		columnVisibility: {},
		columnFilters: [],
		getRowId: (row) => row.stockId.toString(),
	});

	const reorderColumns: ColumnDef<Stock>[] = [
		{
			id: 'material',
			header: 'Material',
			accessorFn: (row) => row.materialName ?? '',
			cell: ({ row }) => (
				<div>
					<div className="font-medium">{row.original.materialName ?? '—'}</div>
					<div className="text-xs text-muted-foreground">{row.original.materialCode ?? '—'}</div>
				</div>
			),
			enableHiding: false,
		},
		{
			id: 'warehouse',
			header: 'Warehouse',
			accessorFn: (row) => row.warehouseCode ?? '',
			cell: ({ row }) => <div>{row.original.warehouseCode ?? row.original.warehouseId}</div>,
		},
		{
			accessorKey: 'quantityAvailable',
			header: () => <div className="w-full text-right">Available</div>,
			cell: ({ row }) => <div className="text-right">{(row.original.quantityAvailable ?? 0).toString()}</div>,
		},
		{
			accessorKey: 'reorderQuantity',
			header: () => <div className="w-full text-right">Reorder Qty</div>,
			cell: ({ row }) => <div className="text-right">{(row.original.reorderQuantity ?? 0).toString()}</div>,
		},
		{
			id: 'actions',
			header: 'Action',
			cell: () => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="text-muted-foreground size-8">
							<IconDotsVertical />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link href="/retailer/purchase-orders/add">Create PO</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	const reorderTable = useTables<Stock>({
		data: suggestions,
		columns: reorderColumns,
		pageSize: DEFAULT_TABLE_PAGE_SIZE,
		sorting: [],
		columnVisibility: {},
		columnFilters: [],
		getRowId: (row) => row.stockId.toString(),
	});

	const consignmentColumns: ColumnDef<ConsignmentStock>[] = [
		{
			id: 'material',
			header: 'Material',
			accessorFn: (row) => row.materialName ?? row.catalogName ?? '',
			cell: ({ row }) => <div>{row.original.materialName ?? row.original.catalogName ?? '—'}</div>,
			enableHiding: false,
		},
		{
			accessorKey: 'supplierOrgName',
			header: 'Supplier',
			cell: ({ row }) => <div>{row.original.supplierOrgName ?? '—'}</div>,
		},
		{
			accessorKey: 'catalogName',
			header: 'Catalog',
			cell: ({ row }) => <div>{row.original.catalogName ?? '—'}</div>,
		},
		{
			accessorKey: 'variantValue',
			header: 'Variant',
			cell: ({ row }) => <div>{row.original.variantValue ?? '—'}</div>,
		},
		{
			id: 'priceTier',
			header: 'Price Tier',
			accessorFn: (row) => row.priceTierName ?? '',
			cell: ({ row }) => (
				<div>{row.original.priceTierName ?? row.original.priceTierId ?? '—'}</div>
			),
		},
		{
			accessorKey: 'quantityOnHand',
			header: () => <div className="w-full text-right">On Hand</div>,
			cell: ({ row }) => <div className="text-right">{row.original.quantityOnHand ?? 0}</div>,
		},
		{
			accessorKey: 'quantityAvailable',
			header: () => <div className="w-full text-right">Available</div>,
			cell: ({ row }) => <div className="text-right">{row.original.quantityAvailable ?? 0}</div>,
		},
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: ({ row }) => (
				<div className="whitespace-nowrap">
					{row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '—'}
				</div>
			),
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="text-muted-foreground size-8">
							<IconDotsVertical />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem
							onSelect={() => { setConsignmentAction({ c: row.original, type: 'receive' }); setConsignmentQty(''); }}
						>
							Receive
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => { setConsignmentAction({ c: row.original, type: 'consume' }); setConsignmentQty(''); }}
						>
							Consume
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => { setConsignmentAction({ c: row.original, type: 'return' }); setConsignmentQty(''); }}
						>
							Return
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	const consignmentTable = useTables<ConsignmentStock>({
		data: consignments,
		columns: consignmentColumns,
		pageSize: DEFAULT_TABLE_PAGE_SIZE,
		sorting: [],
		columnVisibility: {},
		columnFilters: [],
		getRowId: (row) => row.consignmentId.toString(),
	});

	const vmiColumns: ColumnDef<VmiConfig>[] = [
		{
			id: 'material',
			header: 'Material',
			accessorFn: (row) => row.materialName ?? '',
			cell: ({ row }) => <div>{row.original.materialName ?? '—'}</div>,
			enableHiding: false,
		},
		{
			accessorKey: 'supplierOrgName',
			header: 'Supplier',
			cell: ({ row }) => <div>{row.original.supplierOrgName ?? '—'}</div>,
		},
		{
			id: 'catalog',
			header: 'Catalog',
			accessorFn: (row) => row.catalogName ?? '',
			cell: ({ row }) => <div>{row.original.catalogName ?? row.original.catalogId ?? '—'}</div>,
		},
		{
			id: 'variant',
			header: 'Variant',
			accessorFn: (row) => row.variantValue ?? '',
			cell: ({ row }) => <div>{row.original.variantValue ?? row.original.variantId ?? '—'}</div>,
		},
		{
			id: 'priceTier',
			header: 'Price Tier',
			accessorFn: (row) => row.priceTierName ?? '',
			cell: ({ row }) => (
				<div>{row.original.priceTierName ?? row.original.priceTierId ?? '—'}</div>
			),
		},
		{
			accessorKey: 'minLevel',
			header: () => <div className="w-full text-right">Min</div>,
			cell: ({ row }) => <div className="text-right">{row.original.minLevel ?? 0}</div>,
		},
		{
			accessorKey: 'maxLevel',
			header: () => <div className="w-full text-right">Max</div>,
			cell: ({ row }) => <div className="text-right">{row.original.maxLevel ?? 0}</div>,
		},
		{
			accessorKey: 'reorderPoint',
			header: () => <div className="w-full text-right">Reorder Point</div>,
			cell: ({ row }) => <div className="text-right">{row.original.reorderPoint ?? 0}</div>,
		},
		{
			id: 'autoReplenish',
			header: 'Auto Replenish',
			accessorFn: (row) => (row.autoReplenish ? 'Yes' : 'No'),
			cell: ({ row }) => <div>{row.original.autoReplenish ? 'Yes' : 'No'}</div>,
		},
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: ({ row }) => (
				<div className="whitespace-nowrap">
					{row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '—'}
				</div>
			),
		},
	];

	const vmiTable = useTables<VmiConfig>({
		data: vmis,
		columns: vmiColumns,
		pageSize: DEFAULT_TABLE_PAGE_SIZE,
		sorting: [],
		columnVisibility: {},
		columnFilters: [],
		getRowId: (row) => row.vmiId.toString(),
	});

	// Stock row picked by the shared Adjust dialog (id saved from the row action).
	const adjustTarget = stocks.find((s) => s.stockId === adjustOpen) ?? null;

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
				<CentralizedDataTable
					table={stockTable}
					emptyMessage="No stock found"
				/>
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
												<div className="flex justify-between"><span>Utilization</span><span className="font-medium">{w.currentUtilization ?? 0} / {w.capacity ?? w.storageCapacity ?? 0}</span></div>
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
						<WarehouseStockList stocks={w.items} />
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
							<CentralizedDataTable
								table={reorderTable}
								emptyMessage="No items below reorder point"
							/>
						)}
					</CardContent>
				</Card>
			</TabsContent>

				<TabsContent value="consignment" className="space-y-4">
					<Card className="p-4 gap-2">
						<CardHeader className="p-0"><CardTitle>Consignment Stock (Retailer)</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<CentralizedDataTable
							table={consignmentTable}
							emptyMessage="No consignment stock"
						/>
					</CardContent>
					</Card>

					<Dialog open={!!consignmentAction} onOpenChange={(v) => !v && setConsignmentAction(null)}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{consignmentAction?.type === 'receive' && 'Receive Consignment'}
									{consignmentAction?.type === 'consume' && 'Consume Consignment'}
									{consignmentAction?.type === 'return' && 'Return Consignment'}
								</DialogTitle>
							</DialogHeader>
							<div className="grid gap-4">
								<div className="grid gap-2">
									<Label>Quantity</Label>
									<Input type="number" value={consignmentQty} onChange={(e) => setConsignmentQty(e.target.value)} />
								</div>
								<Button disabled={consignmentSubmitting} onClick={async () => {
									const q = Number(consignmentQty);
									if (!q || !consignmentAction) return;
									setConsignmentSubmitting(true);
									try {
										if (consignmentAction.type === 'receive') await receiveConsignment(consignmentAction.c.consignmentId, q);
										if (consignmentAction.type === 'consume') await consumeConsignment(consignmentAction.c.consignmentId, q);
										if (consignmentAction.type === 'return') await returnConsignment(consignmentAction.c.consignmentId, q);
										toast.success('Done');
										setConsignmentAction(null);
										load();
									} catch (e) {
										toast.error(e instanceof Error ? e.message : 'Failed');
									} finally {
										setConsignmentSubmitting(false);
									}
								}}>
									{consignmentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Apply
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</TabsContent>

				<TabsContent value="vmi" className="space-y-4">
					<Card className="p-4 gap-2">
						<CardHeader className="p-0"><CardTitle>VMI (Retailer)</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<CentralizedDataTable
							table={vmiTable}
							emptyMessage="No VMI configs"
						/>
					</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={adjustOpen !== null} onOpenChange={(v) => !v && setAdjustOpen(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Adjust Stock — {adjustTarget?.materialCode ?? ''}
						</DialogTitle>
					</DialogHeader>
					{adjustTarget && (
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
							<Button onClick={() => handleAdjust(adjustTarget.stockId)} disabled={adjusting}>{adjusting ? 'Adjusting...' : 'Apply Adjustment'}</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}