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
	type VisibilityState
} from "@tanstack/react-table";
import {
	IconChevronDown,
	IconChevronUp,
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
	IconBuildingStore,
	IconFileInvoice,
	IconClock,
	IconChecks,
	IconUsers,
	IconEye,
	IconDownload
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "./ui/field";

import type { Partnership } from "@/types/partnerships";

const getStatusColor = (status: string) => {
	switch (status) {
		case "ACTIVE":
			return "bg-green-500/10 text-green-500 border-green-500/20";
		case "PENDING":
			return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
		case "EXPIRED":
			return "bg-red-500/10 text-red-500 border-red-500/20";
		case "TERMINATED":
			return "bg-gray-500/10 text-gray-500 border-gray-500/20";
		case "REJECTED":
			return "bg-red-500/10 text-red-500 border-red-500/20";
		default:
			return "";
	}
};

const getPartnershipTypeColor = (type: string) => {
	switch (type) {
		case "SUPPLIER":
			return "bg-blue-500/10 text-blue-500 border-blue-500/20";
		case "LOGISTICS":
			return "bg-purple-500/10 text-purple-500 border-purple-500/20";
		case "DISTRIBUTOR":
			return "bg-orange-500/10 text-orange-500 border-orange-500/20";
		case "STRATEGIC":
			return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
		default:
			return "";
	}
};

const columns: ColumnDef<Partnership>[] = [
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
		enableHiding: false
	},
	{
		accessorKey: "partnershipNumber",
		header: "Partnership #",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.partnershipNumber}</div>
		),
		enableHiding: false
	},
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.title}</div>
		)
	},
	{
		accessorKey: "supplierOrgName",
		header: "Supplier",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.supplierOrgName}</div>
		)
	},
	{
		accessorKey: "partnershipType",
		header: "Type",
		cell: ({ row }) => (
			<Badge variant="outline" className={getPartnershipTypeColor(row.original.partnershipType)}>
				{row.original.partnershipType}
			</Badge>
		)
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge variant="outline" className={getStatusColor(row.original.status)}>
				{row.original.status}
			</Badge>
		)
	},
	{
		accessorKey: "startDate",
		header: "Start Date",
		cell: ({ row }) => row.original.startDate
	},
	{
		accessorKey: "endDate",
		header: "End Date",
		cell: ({ row }) => row.original.endDate || "—"
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
						<a href={`/retailer/partnership/${row.original.partnershipId}`}>
							<IconEye className="mr-2 h-4 w-4" />
							View Details
						</a>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<a href={`/retailer/partnership/${row.original.partnershipId}/edit`}>
							<IconEdit className="mr-2 h-4 w-4" />
							Edit
						</a>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{row.original.agreementDocumentId && (
						<DropdownMenuItem asChild>
							<a href={row.original.agreementDocumentUrl || "#"} target="_blank" rel="noopener noreferrer">
								<IconFileInvoice className="mr-2 h-4 w-4" />
								View Agreement
							</a>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem variant="destructive">
						<IconTrash className="mr-2 h-4 w-4" />
						Terminate
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		)
	}
];

export function PartnershipTable({
	partnerships: initialData
}: {
	partnerships: Partnership[];
}) {
	const [data, setData] = React.useState(() => initialData);
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10
	});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination
		},
		getRowId: (row) => row.partnershipId.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const isMobile = useIsMobile();

	return (
		<div className="w-full">
			<div className="relative overflow-auto">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									header.isPlaceholder ? null : (
										<TableHead
											key={header.id}
											className={header.column.getCanSort()
												? "cursor-pointer select-none"
												: ""}
											onClick={header.column.getToggleSortingHandler()}
											style={{
												width: header.column.getSize(),
												minWidth: header.column.getSize(),
											}}
										>
											<div className="flex items-center gap-1">
												{flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
												{{
													asc: <IconChevronUp className="size-4" />,
													desc: <IconChevronDown className="size-4" />,
												}[header.column.getIsSorted() as string] ?? null}
											</div>
										</TableHead>
									)
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											style={{
												width: cell.column.getSize(),
												minWidth: cell.column.getSize(),
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No partnerships found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="flex-1" />
				<div className="flex items-center space-x-2">
					<Select
						onValueChange={(value) =>
							table.setPageSize(Number(value))
						}
						value={table.getState().pagination.pageSize.toString()}
					>
						<SelectTrigger className="w-[70px]">
							<SelectValue placeholder="Page size" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10</SelectItem>
							<SelectItem value="20">20</SelectItem>
							<SelectItem value="30">30</SelectItem>
							<SelectItem value="40">40</SelectItem>
							<SelectItem value="50">50</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						aria-label="Previous page"
					>
						<IconChevronLeft className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						aria-label="Next page"
					>
						<IconChevronRight className="size-4" />
					</Button>
				</div>
				<div className="flex items-center space-x-2 text-sm text-muted-foreground">
					<span>
						Page{" "}
						<strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
						of{" "}
						<strong>{table.getPageCount()}</strong>
					</span>
				</div>
			</div>
		</div>
	);
}