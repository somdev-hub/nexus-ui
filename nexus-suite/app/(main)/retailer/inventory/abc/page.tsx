'use client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAbcAnalysis } from '@/lib/services/stock-service';
import type { AbcAnalysis, AbcItem } from '@/types/stock';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Money } from '@/components/finances/money';
import type { ColumnDef } from '@tanstack/react-table';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables, DEFAULT_TABLE_PAGE_SIZE } from '@/hooks/use-tables';

const CAT_COLOR: Record<string, string> = {
	A: 'bg-green-100 text-green-800',
	B: 'bg-yellow-100 text-yellow-800',
	C: 'bg-red-100 text-red-800',
};

export default function AbcPage() {
	const [data, setData] = useState<AbcAnalysis | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [category, setCategory] = useState<string>('');

	const load = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await getAbcAnalysis(category || undefined);
			setData(res);
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : 'Failed to load ABC analysis'
			);
		} finally {
			setIsLoading(false);
		}
	}, [category]);

	useEffect(() => {
		load();
	}, [load]);

	const items = data?.items ?? [];

	const abcColumns: ColumnDef<AbcItem>[] = [
		{
			id: 'material',
			header: 'Material',
			accessorFn: (row) => row.materialName ?? '',
			cell: ({ row }) => (
				<div>
					<div className="font-medium">
						{row.original.materialName ?? '—'}
					</div>
					<div className="text-xs text-muted-foreground">
						{row.original.materialCode ?? '—'} · WH{' '}
						{row.original.warehouseId ?? '—'}
					</div>
				</div>
			),
			enableHiding: false,
		},
		{
			accessorKey: 'quantityOnHand',
			header: () => <div className="w-full text-right">Qty On Hand</div>,
			cell: ({ row }) => (
				<div className="text-right">
					{(row.original.quantityOnHand ?? 0).toString()}
				</div>
			),
		},
		{
			accessorKey: 'unitCost',
			header: () => <div className="w-full text-right">Unit Cost</div>,
			cell: ({ row }) => (
				<div className="text-right">
					<Money
						amount={row.original.unitCost ?? 0}
						currency={
							(row.original as { currency?: string }).currency
						}
					/>
				</div>
			),
		},
		{
			accessorKey: 'annualValue',
			header: () => <div className="w-full text-right">Annual Value</div>,
			cell: ({ row }) => (
				<div className="text-right font-medium">
					<Money
						amount={row.original.annualValue ?? 0}
						currency={
							(row.original as { currency?: string }).currency
						}
					/>
				</div>
			),
		},
		{
			accessorKey: 'cumulativePercentage',
			header: () => (
				<div className="w-full text-right">Cumulative %</div>
			),
			cell: ({ row }) => (
				<div className="text-right">
					{row.original.cumulativePercentage ?? 0}%
				</div>
			),
		},
		{
			accessorKey: 'abcCategory',
			header: 'Category',
			cell: ({ row }) => (
				<Badge
					className={
						CAT_COLOR[row.original.abcCategory as string] ??
						'bg-gray-100'
					}
				>
					{row.original.abcCategory ?? '—'}
				</Badge>
			),
		},
	];

	const abcTable = useTables<AbcItem>({
		data: items,
		columns: abcColumns,
		pageSize: DEFAULT_TABLE_PAGE_SIZE,
		sorting: [],
		columnVisibility: {},
		columnFilters: [],
		getRowId: (row) => row.stockId.toString(),
	});

	if (isLoading)
		return (
			<div className="p-6 space-y-4">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-100 w-full" />
			</div>
		);
	if (!data) return <div className="p-6 text-muted-foreground">No data</div>;

	return (
		<div className="flex flex-1 flex-col p-6 gap-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold">ABC Analysis</h1>
					<p className="text-muted-foreground">
						Value/velocity prioritization · FR-RET-012
					</p>
				</div>
				<div className="">
					<Select value={category} onValueChange={setCategory}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="All Categories" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All</SelectItem>
							<SelectItem value="A">Category A</SelectItem>
							<SelectItem value="B">Category B</SelectItem>
							<SelectItem value="C">Category C</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-4">
				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle className="text-sm text-muted-foreground">
							Total Value
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<p className="text-2xl font-bold">
							<Money
								amount={data.summary.totalInventoryValue ?? 0}
								currency={data.items?.[0]?.currency}
							/>
						</p>
					</CardContent>
				</Card>
				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle className="text-sm text-muted-foreground">
							A (≤80%)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<p className="text-2xl font-bold">
							{data.summary.categoryACount ?? 0} items
						</p>
						<p className="text-xs text-muted-foreground">
							<Money
								amount={data.summary.categoryAValue ?? 0}
								currency={data.items?.[0]?.currency}
							/>{' '}
							· {data.summary.categoryAPercentage ?? 0}%
						</p>
					</CardContent>
				</Card>
				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle className="text-sm text-muted-foreground">
							B (≤95%)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<p className="text-2xl font-bold">
							{data.summary.categoryBCount ?? 0} items
						</p>
						<p className="text-xs text-muted-foreground">
							<Money
								amount={data.summary.categoryBValue ?? 0}
								currency={data.items?.[0]?.currency}
							/>{' '}
							· {data.summary.categoryBPercentage ?? 0}%
						</p>
					</CardContent>
				</Card>
				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle className="text-sm text-muted-foreground">
							C (Rest)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<p className="text-2xl font-bold">
							{data.summary.categoryCCount ?? 0} items
						</p>
						<p className="text-xs text-muted-foreground">
							<Money
								amount={data.summary.categoryCValue ?? 0}
								currency={data.items?.[0]?.currency}
							/>{' '}
							· {data.summary.categoryCPercentage ?? 0}%
						</p>
					</CardContent>
				</Card>
			</div>
			<div className="pt-1">
				<CentralizedDataTable
					table={abcTable}
					emptyMessage="No items"
				/>
			</div>
		</div>
	);
}
