"use client";

import * as React from "react";
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
	type VisibilityState,
} from "@tanstack/react-table";
import {
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconCircleCheckFilled,
	IconDotsVertical,
	IconEdit,
	IconLayoutColumns,
	IconLoader,
	IconPlus,
	IconTrash,
	IconTrendingUp,
	IconFileText,
	IconClock,
	IconAlertCircle,
	IconCheck,
	IconX,
	IconFile,
	IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";

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
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "./ui/field";
import Link from "next/link";
import { format } from "date-fns";

interface SupplierContract {
	contractId: number;
	contractNumber: string;
	supplierId: number;
	supplierName: string;
	retailerOrgId: number;
	retailerOrgName: string;
	title: string;
	description: string;
	startDate: string;
	endDate: string;
	status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING_APPROVAL";
	autoRenewal: boolean;
	renewalPeriodDays: number;
	paymentTerms: string;
	currency: string;
	totalValue: number;
	documentId?: number;
	documentUrl?: string;
	documentName?: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
}

const statusConfig: Record<
	SupplierContract["status"],
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success"; icon: React.ReactNode }
> = {
	DRAFT: { label: "Draft", variant: "secondary", icon: <IconFileText className="h-3 w-3" /> },
	PENDING_APPROVAL: { label: "Pending Approval", variant: "outline", icon: <IconClock className="h-3 w-3" /> },
	ACTIVE: { label: "Active", variant: "default", icon: <IconCircleCheckFilled className="h-3 w-3 fill-green-500" /> },
	EXPIRED: { label: "Expired", variant: "destructive", icon: <IconAlertCircle className="h-3 w-3" /> },
	TERMINATED: { label: "Terminated", variant: "destructive", icon: <IconX className="h-3 w-3" /> },
};

const columns: ColumnDef<SupplierContract>[] = [
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
		accessorKey: "contractNumber",
		header: "Contract Number",
		cell: ({ row }) => (
			<div className="font-medium font-mono text-sm">{row.original.contractNumber}</div>
		),
		enableHiding: false,
	},
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.title}</div>
		),
	},
	{
		accessorKey: "supplierName",
		header: "Supplier",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.supplierName}</div>
		),
	},
	{
		accessorKey: "startDate",
		header: "Start Date",
		cell: ({ row }) => (
			<div className="text-sm">
				{row.original.startDate ? format(new Date(row.original.startDate), "MMM dd, yyyy") : "—"}
			</div>
		),
	},
	{
		accessorKey: "endDate",
		header: "End Date",
		cell: ({ row }) => (
			<div className="text-sm">
				{row.original.endDate ? format(new Date(row.original.endDate), "MMM dd, yyyy") : "—"}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const config = statusConfig[row.original.status];
			return (
				<Badge variant={config.variant} className="gap-1.5">
					{config.icon}
					{config.label}
				</Badge>
			);
		},
	},
	{
		accessorKey: "totalValue",
		header: () => <div className="w-full text-right">Total Value</div>,
		cell: ({ row }) => (
			<div className="text-right font-mono font-medium">
				{row.original.currency} {row.original.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
			</div>
		),
	},
	{
		accessorKey: "autoRenewal",
		header: "Auto Renewal",
		cell: ({ row }) => (
			<Badge variant={row.original.autoRenewal ? "default" : "secondary"} className="gap-1.5">
				{row.original.autoRenewal ? (
					<>
						<IconRefresh className="h-3 w-3" />
						Yes ({row.original.renewalPeriodDays} days)
					</>
				) : (
					<IconX className="h-3 w-3" />
				)}
			</Badge>
		),
	},
	{
		accessorKey: "paymentTerms",
		header: "Payment Terms",
		cell: ({ row }) => row.original.paymentTerms || "—",
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
						size="icon"
					>
						<IconDotsVertical />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-40">
					<DropdownMenuItem asChild>
						<Link href={`/retailer/supplier-contracts/${row.original.contractId}`}>
							<IconFileText className="mr-2 h-4 w-4" />
							View Details
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href={`/retailer/supplier-contracts/${row.original.contractId}/edit`}>
							<IconEdit className="mr-2 h-4 w-4" />
							Edit
						</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{row.original.documentUrl && (
						<DropdownMenuItem asChild>
							<a href={row.original.documentUrl} target="_blank" rel="noopener noreferrer">
								<IconFile className="mr-2 h-4 w-4" />
								View Document
							</a>
						</DropdownMenuItem>
					)}
					{row.original.status === "DRAFT" && (
						<DropdownMenuItem asChild>
							<Link href={`/retailer/supplier-contracts/${row.original.contractId}/submit`}>
								<IconTrendingUp className="mr-2 h-4 w-4" />
								Submit for Approval
							</Link>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem variant="destructive">
						<IconTrash className="mr-2 h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];

export function SupplierContractTable({
	supplierContracts: initialData,
}: {
	supplierContracts: SupplierContract[];
}) {
	const [data, setData] = React.useState(() => initialData);
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.contractId.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between px-4 lg:px-6">
				<Label htmlFor="view-selector" className="sr-only">
					View
				</Label>
				<Select defaultValue="outline">
					<SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
						<SelectValue placeholder="Select a view" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="outline">Table View</SelectItem>
						<SelectItem value="cards">Card View</SelectItem>
					</SelectContent>
				</Select>

				<div className="flex items-center gap-2">
					<Field>
						<Input
							placeholder="Search contracts..."
							className="h-8 w-full md:w-64 lg:w-80"
							value={table.getColumn("contractNumber")?.getFilterValue() as string}
							onChange={(e) => table.getColumn("contractNumber")?.setFilterValue(e.target.value)}
						/>
					</Field>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<IconLayoutColumns />
								<span className="hidden lg:inline">Customize Columns</span>
								<span className="lg:hidden">Columns</span>
								<IconChevronDown />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{table
								.getAllColumns()
								.filter(
									(column) =>
										typeof column.accessorFn !== "undefined" && column.getCanHide()
								)
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) => column.toggleVisibility(!!value)}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
					<Button variant="outline" size="sm" asChild>
						<Link href="/retailer/supplier-contracts/add">
							<IconPlus />
							<span className="hidden lg:inline">Create Contract</span>
						</Link>
					</Button>
				</div>
			</div>
			<TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody className="**:data-[slot=table-cell]:first:w-8">
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										No supplier contracts found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue placeholder={table.getState().pagination.pageSize} />
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</TabsContent>
			<TabsContent value="cards" className="flex flex-col px-4 lg:px-6">
				<div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
					<div className="flex items-center justify-center h-full text-muted-foreground">
						Card view coming soon
					</div>
				</div>
			</TabsContent>
		</Tabs>
	);
}