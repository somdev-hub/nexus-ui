'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/finances/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getLogisticsDashboard } from '@/lib/services/logistics-ops-service';
import { getMyShipmentBoard } from '@/lib/services/logistics-ops-service';
import type { LogisticsDashboard } from '@/types/logistics-ops';
import type { LoadBoardShipment } from '@/types/logistics-ops';
import { CentralizedDataTable } from '@/components/centralized-data-table';
import { useTables } from '@/hooks/use-tables';
import type { ColumnDef } from '@tanstack/react-table';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
	IconTruck,
	IconPackage,
	IconChartBar,
	IconDatabase,
} from '@tabler/icons-react';

interface ShipmentRow {
	id: number;
	number: string;
	mode: string;
	status: string;
	fromOrg: string;
	toOrg: string;
	driverAllocated: string;
	date: string;
}

const formatDate = (value?: string | null) => {
	if (!value) return '—';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString();
};

export default function LogisticsDashboardPage() {
	const { toast } = useToast();
	const [dashboard, setDashboard] = useState<LogisticsDashboard | null>(null);
	const [shipments, setShipments] = useState<LoadBoardShipment[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				const [d, s] = await Promise.all([
					getLogisticsDashboard().catch(() => null),
					getMyShipmentBoard({ page: 0, size: 10 }).catch(() => null),
				]);
				if (!active) return;
				setDashboard(d);
				setShipments(s?.content ?? []);
			} catch (e: unknown) {
				toast({
					title:
						e instanceof Error
							? e.message
							: String(e) || 'Failed to load dashboard',
					variant: 'destructive',
				});
			} finally {
				if (active) setLoading(false);
			}
		};
		load();
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const shipmentRows: ShipmentRow[] = shipments.map((sh, i) => ({
		id: i + 1,
		number: sh.shipmentNumber || `SH-${sh.shipmentId}`,
		status: sh.status || '—',
		mode: sh.shipmentMode || sh.routeMode || sh.mode || '—',
		fromOrg: sh.supplierOrgName || sh.logisticsOrgName || '—',
		toOrg: sh.retailerOrgName || sh.deliveryLocation || '—',
		driverAllocated: sh.carrierName || sh.logisticsOrgName || '—',
		date: formatDate(sh.createdAt || sh.pickupDate),
	}));
	const shipmentColumns: ColumnDef<ShipmentRow>[] = [
		{ accessorKey: 'number', header: 'Shipment Number' },
		{ accessorKey: 'mode', header: 'Mode' },
		{ accessorKey: 'status', header: 'Status' },
		{ accessorKey: 'fromOrg', header: 'From Org' },
		{ accessorKey: 'toOrg', header: 'To Org' },
		{ accessorKey: 'driverAllocated', header: 'Driver Allocated' },
		{ accessorKey: 'date', header: 'Date' },
	];
	const shipmentTable = useTables<ShipmentRow>({
		data: shipmentRows,
		columns: shipmentColumns,
		pageSize: 5,
		getRowId: (row) => `ship-${row.id}`,
	});

	const statusCounts = shipments.reduce<Record<string, number>>((acc, sh) => {
		const key = sh.status || 'Unknown';
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});
	const statusChartData = Object.entries(statusCounts).map(([status, count], i) => ({
		status,
		count,
		fill: `var(--chart-${(i % 5) + 1})`,
	}));

	if (loading) {
		return (
			<div className="flex flex-1 flex-col gap-4 p-4">
				<div className="grid gap-4 md:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
				<Skeleton className="h-64" />
			</div>
		);
	}

	const stats = [
		{
			title: 'Total Shipments',
			value: dashboard?.totalShipments ?? 0,
			desc: `${dashboard?.deliveredShipments ?? 0} delivered`,
			icon: IconTruck,
			href: '/logistics/shipments',
		},
		{
			title: 'Total Revenue',
			value: <Money amount={dashboard?.totalRevenue ?? 0} />,
			desc: 'from completed shipments',
			icon: IconChartBar,
			href: '/logistics/analytics',
		},
		{
			title: 'Fleet Assets',
			value: dashboard?.totalAssets ?? 0,
			desc: `${dashboard?.availableAssets ?? 0} available`,
			icon: IconDatabase,
			href: '/logistics/fleet',
		},
		{
			title: 'Equipment Utilization',
			value: dashboard?.equipmentUtilization != null
				? `${(dashboard.equipmentUtilization * 100).toFixed(1)}%`
				: '-',
			desc: 'fleet utilization',
			icon: IconPackage,
			href: '/logistics/fleet',
		},
	];

	const utilization =
		dashboard?.equipmentUtilization != null
			? `${(dashboard.equipmentUtilization * 100).toFixed(1)}%`
			: '-';

	return (
		<div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">
						Logistics Dashboard
					</h1>
					<p className="text-sm text-muted-foreground">
						Load board, fleet, execution and settlement at a glance
					</p>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline" size="sm">
						<Link href="/logistics/load-board">
							<Plus className="mr-2 h-4 w-4" />
							Quote
						</Link>
					</Button>
					<Button asChild size="sm">
						<Link href="/logistics/shipments">
							<Plus className="mr-2 h-4 w-4" />
							Shipments
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((s) => (
					<Card className="p-4 gap-2" key={s.title}>
						<CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
							<CardTitle className="text-sm font-medium">
								{s.title}
							</CardTitle>
							<s.icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent className="p-0">
							<div className="text-2xl font-bold">{s.value}</div>
							<p className="text-xs text-muted-foreground">
								{s.desc}
							</p>
							<Button
								asChild
								variant="link"
								className="px-0 text-xs"
							>
								<Link href={s.href}>View details</Link>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle>Execution</CardTitle>
						<CardDescription>
							Delivery progress and fleet utilization
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 p-0">
						<div className="flex justify-between">
							<span className="text-sm">Delivered</span>
							<Badge>
								{dashboard?.deliveredShipments ?? 0} /{' '}
								{dashboard?.totalShipments ?? 0}
							</Badge>
						</div>
						<div className="flex justify-between">
							<span className="text-sm">
								Equipment Utilization
							</span>
							<Badge variant="outline">{utilization}</Badge>
						</div>
						<div className="flex justify-between">
							<span className="text-sm">Available Assets</span>
							<span className="text-sm font-medium">
								{dashboard?.availableAssets ?? 0}
							</span>
						</div>
						<Button
							asChild
							variant="outline"
							size="sm"
							className="w-full mt-2"
						>
							<Link href="/logistics/shipments">
								Go to Shipments
							</Link>
						</Button>
					</CardContent>
				</Card>
				<Card className="p-4 gap-2">
					<CardHeader className="p-0">
						<CardTitle>Settlement</CardTitle>
						<CardDescription>Revenue</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 p-0">
						<div className="flex justify-between">
							<span className="text-sm">Total Revenue</span>
							<span className="text-sm font-medium">
								<Money amount={dashboard?.totalRevenue ?? 0} />
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="p-4 gap-2">
				<CardHeader className="p-0">
					<CardTitle>Shipment Status</CardTitle>
					<CardDescription>
						Current shipment pipeline
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<ChartContainer
						config={(
							{ count: { label: 'Shipments', color: 'var(--chart-1)' } } satisfies ChartConfig
						)}
						className="h-56 w-full"
					>
						<BarChart data={statusChartData}>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="status" tickLine={false} axisLine={false} />
							<ChartTooltip content={<ChartTooltipContent />} />
							<Bar dataKey="count" radius={4} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<div className="">
				<CentralizedDataTable
					table={shipmentTable}
					emptyMessage="No shipments"
				/>
			</div>
		</div>
	);
}