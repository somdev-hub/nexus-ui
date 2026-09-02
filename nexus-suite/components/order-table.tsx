"use client";

import * as React from "react";
import {
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconCircleCheckFilled,
	IconDotsVertical,
	IconLayoutColumns,
	IconLoader,
	IconPlus,
	IconTrendingUp,
	IconEye,
	IconEdit,
	IconTrash
} from "@tabler/icons-react";
import {
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type Row,
	type SortingState,
	type VisibilityState
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Order } from "@/types/orders";

interface OrderTableProps {
	orders: Order[];
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
	DRAFT: "secondary",
	PENDING: "outline",
	CONFIRMED: "default",
	SHIPPED: "default",
	DELIVERED: "default",
	CANCELLED: "destructive",
	PARTIALLY_DELIVERED: "outline",
};

export function OrderTable({ orders }: OrderTableProps) {
	const isMobile = useIsMobile();
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [globalFilter, setGlobalFilter] = React.useState("");

	const columns: ColumnDef<Order>[] = React.useMemo(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={
								table.getIsAllPageRowsSelected() ||
								(table.getIsSomePageRowsSelected() && "indeterminate")
							}
							onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
							aria-label="Select all"
						/>
					</div>
				),
				cell: ({ row }) => (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={row.getIsSelected()}
							onCheckedChange={(value) => row.toggleSelected(!!value)}
							aria-label="Select row"
						/>
					</div>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "orderNumber",
				header: "Order Number",
				cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("orderNumber")}</div>,
			},
			{
				accessorKey: "supplierOrgName",
				header: "Supplier",
				cell: ({ row }) => <div className="font-medium">{row.getValue("supplierOrgName")}</div>,
			},
			{
				accessorKey: "orderDate",
				header: "Order Date",
				cell: ({ row }) => (
					<div>
						{new Date(row.getValue("orderDate")).toLocaleDateString()}
					</div>
				),
			},
			{
				accessorKey: "expectedDeliveryDate",
				header: "Expected Delivery",
				cell: ({ row }) => (
					<div>
						{new Date(row.getValue("expectedDeliveryDate")).toLocaleDateString()}
					</div>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => {
					const status = row.getValue("status") as string;
					return (
						<Badge variant={statusColors[status] || "outline"}>
							{status}
						</Badge>
					);
				},
			},
			{
				accessorKey: "totalAmount",
				header: "Total Amount",
				cell: ({ row }) => (
					<div className="font-mono tabular-nums">
						${(row.getValue("totalAmount") as number).toFixed(2)} {row.original.currency}
					</div>
				),
			},
			{
				accessorKey: "paymentTerms",
				header: "Payment Terms",
				cell: ({ row }) => <div>{row.getValue("paymentTerms")}</div>,
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<IconEye className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<IconEdit className="h-4 w-4" />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<IconDotsVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>View Details</DropdownMenuItem>
								<DropdownMenuItem>Edit</DropdownMenuItem>
								<DropdownMenuItem>Duplicate</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="text-red-600">Cancel Order</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				),
				enableSorting: false,
				enableHiding: false,
			},
		],
		[]
	);

	const table = useReactTable({
		data: orders,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div className="w-full">
			<div className="flex items-center gap-4 mb-4">
				<Input
					placeholder="Search orders..."
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-xs"
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<IconLayoutColumns className="mr-2 h-4 w-4" />
							Columns
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => (
								<DropdownMenuCheckboxItem
									key={column.id}
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No orders found.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
				<div className="border-t p-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</span>
						<Select
							value={table.getState().pagination.pageSize.toString()}
							onValueChange={(value) =>
								table.setPageSize(Number(value))
							}
						>
							<SelectTrigger className="w-[70px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="20">20</SelectItem>
								<SelectItem value="30">30</SelectItem>
								<SelectItem value="40">40</SelectItem>
								<SelectItem value="50">50</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<IconChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<IconChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}