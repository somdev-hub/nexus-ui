'use client';

import {
    IconChevronDown,
    IconChevronUp,
    IconDotsVertical,
    IconEdit,
    IconEye,
    IconFileInvoice,
    IconTrash
} from '@tabler/icons-react';
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
    type SortingState,
    type VisibilityState
} from '@tanstack/react-table';
import * as React from 'react';
import { toast } from 'sonner';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TablePagination } from './ui/table-pagination';

import {
    PartnershipEditDialog,
    type PartnershipEditValues,
} from '@/components/partnership-edit-dialog';
import {
    getPartnershipById,
    updatePartnership,
    updatePartnershipStatus,
} from '@/lib/services/partnerships-service';
import type { Partnership } from '@/types/partnerships';

const getPartnershipDetailHref = (partnership: Partnership) =>
	partnership.partnershipType === 'LOGISTICS'
		? `/retailer/partnership/logistic-market/${partnership.partnershipId}`
		: `/retailer/partnership/supplier-market/${partnership.partnershipId}`;

const getStatusColor = (status: string) => {
	switch (status) {
		case 'ACTIVE':
			return 'bg-green-500/10 text-green-500 border-green-500/20';
		case 'PENDING':
			return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
		case 'EXPIRED':
			return 'bg-red-500/10 text-red-500 border-red-500/20';
		case 'TERMINATED':
			return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
		case 'REJECTED':
			return 'bg-red-500/10 text-red-500 border-red-500/20';
		default:
			return '';
	}
};

const getPartnershipTypeColor = (type: string) => {
	switch (type) {
		case 'SUPPLIER':
			return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
		case 'LOGISTICS':
			return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
		case 'DISTRIBUTOR':
			return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
		case 'STRATEGIC':
			return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
		default:
			return '';
	}
};

const buildColumns = (
	onTerminate: (partnership: Partnership) => void,
	onEdit: (partnership: Partnership) => void
): ColumnDef<Partnership>[] => [
		{
			id: 'select',
			accessorKey: 'select',
			header: ({ table }) => (
				<div className="flex items-center justify-center">
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && 'indeterminate')
						}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
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
			accessorKey: 'partnershipId',
			header: 'Partnership #',
			cell: ({ row }) => (
				<div className="font-medium">{row.original.partnershipId}</div>
			),
			enableHiding: false,
		},
		{
			accessorKey: 'secondaryOrgName',
			header: 'Partner Org',
			cell: ({ row }) => (
				<div className="font-medium">
					{row.original.secondaryOrgName ??
						row.original.primaryOrgName ??
						'—'}
				</div>
			),
		},
		{
			accessorKey: 'partnershipTerm',
			header: 'Terms',
			cell: ({ row }) => (
				<div className="text-sm text-muted-foreground max-w-50 truncate">
					{row.original.partnershipTerm ?? '—'}
				</div>
			),
		},
		{
			accessorKey: 'partnershipType',
			header: 'Type',
			cell: ({ row }) => (
				<Badge
					variant="outline"
					className={getPartnershipTypeColor(
						row.original.partnershipType ?? ''
					)}
				>
					{row.original.partnershipType ?? '—'}
				</Badge>
			),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => (
				<Badge
					variant="outline"
					className={getStatusColor(row.original.status)}
				>
					{row.original.status}
				</Badge>
			),
		},
		{
			accessorKey: 'startDate',
			header: 'Start Date',
			cell: ({ row }) =>
				row.original.startDate
					? new Date(row.original.startDate).toLocaleDateString()
					: '—',
		},
		{
			accessorKey: 'endDate',
			header: 'End Date',
			cell: ({ row }) =>
				row.original.endDate
					? new Date(row.original.endDate).toLocaleDateString()
					: '—',
		},
		{
			accessorKey: 'actions',
			header: 'Actions',
			id: 'actions',
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
							<a href={getPartnershipDetailHref(row.original)}>
								<IconEye className="mr-2 h-4 w-4" />
								View Details
							</a>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onEdit(row.original)}>
							<IconEdit className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						{row.original.agreementDocumentId && (
							<DropdownMenuItem asChild>
								<a
									href={row.original.agreementDocumentUrl || '#'}
									target="_blank"
									rel="noopener noreferrer"
								>
									<IconFileInvoice className="mr-2 h-4 w-4" />
									View Agreement
								</a>
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							variant="destructive"
							onClick={() => onTerminate(row.original)}
						>
							<IconTrash className="mr-2 h-4 w-4" />
							Terminate
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

export function PartnershipTable({
	partnerships: initialData,
	onPartnershipUpdated,
}: {
	partnerships: Partnership[];
	onPartnershipUpdated?: (partnership: Partnership) => void;
}) {
	const [data, setData] = React.useState(() => initialData);
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const [editing, setEditing] = React.useState<{
		id: number;
		initial: PartnershipEditValues;
	} | null>(null);

	const handleEdit = React.useCallback((partnership: Partnership) => {
		// Prefill from the backend record (row shape lacks term/discount).
		getPartnershipById(partnership.partnershipId)
			.then((detail) => {
				const raw = detail as unknown as Record<string, unknown>;
				setEditing({
					id: partnership.partnershipId,
					initial: {
						partnershipTerm:
							typeof raw['partnershipTerm'] === 'string'
								? (raw['partnershipTerm'] as string)
								: undefined,
						discountRate:
							typeof raw['discountRate'] === 'number'
								? (raw['discountRate'] as number)
								: undefined,
						endDate:
							typeof raw['endDate'] === 'string'
								? (raw['endDate'] as string)
								: undefined,
					},
				});
			})
			.catch(() => {
				// Fall back to a blank form rather than blocking the edit.
				toast.error('Could not load current terms — editing blank');
				setEditing({ id: partnership.partnershipId, initial: {} });
			});
	}, []);

	const [terminating, setTerminating] = React.useState<Partnership | null>(
		null
	);

	const handleTerminate = React.useCallback(async () => {
		if (!terminating) return;
		try {
			const updated = await updatePartnershipStatus(
				terminating.partnershipId,
				{ status: 'TERMINATED' }
			);
			setData((prev) =>
				prev.map((p) =>
					p.partnershipId === terminating.partnershipId
						? updated
						: p
				)
			);
			onPartnershipUpdated?.(updated);
			toast.success('Partnership terminated');
		} catch (error) {
			console.error('Failed to terminate partnership:', error);
			toast.error('Failed to terminate partnership');
		} finally {
			setTerminating(null);
		}
	}, [terminating, onPartnershipUpdated]);

	const requestTerminate = React.useCallback((partnership: Partnership) => {
		setTerminating(partnership);
	}, []);

	const columns = React.useMemo(
		() => buildColumns(requestTerminate, handleEdit),
		[requestTerminate, handleEdit]
	);

	const visibleData = React.useMemo(
		() => data.filter((p) => p.status !== 'TERMINATED'),
		[data]
	);

	const table = useReactTable({
		data: visibleData,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
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

	return (
		<div className="w-full">
			<div className="relative overflow-auto">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) =>
									header.isPlaceholder ? null : (
										<TableHead
											key={header.id}
											className={
												header.column.getCanSort()
													? 'cursor-pointer select-none'
													: ''
											}
											onClick={header.column.getToggleSortingHandler()}
											style={{
												width: header.column.getSize(),
												minWidth:
													header.column.getSize(),
											}}
										>
											<div className="flex items-center gap-1">
												{flexRender(
													header.column.columnDef
														.header,
													header.getContext()
												)}
												{{
													asc: (
														<IconChevronUp className="size-4" />
													),
													desc: (
														<IconChevronDown className="size-4" />
													),
												}[
													header.column.getIsSorted() as string
												] ?? null}
											</div>
										</TableHead>
									)
								)}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && 'selected'
									}
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
			<div className="flex items-center justify-between gap-4 py-4">
				<div className="flex flex-1 items-center text-sm text-muted-foreground">
					<span>
						Page{' '}
						<strong>
							{table.getState().pagination.pageIndex + 1}
						</strong>{' '}
						of <strong>{table.getPageCount()}</strong>
					</span>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<TablePagination
						pageIndex={table.getState().pagination.pageIndex}
						pageCount={table.getPageCount()}
						canPreviousPage={table.getCanPreviousPage()}
						canNextPage={table.getCanNextPage()}
						onPageChange={(index) => table.setPageIndex(index)}
						onPreviousPage={() => table.previousPage()}
						onNextPage={() => table.nextPage()}
						showFirstLast={false}
					/>
				</div>
				<div className="flex flex-1 items-center justify-end gap-2">
					<span className="hidden shrink-0 text-sm whitespace-nowrap text-muted-foreground sm:inline">
						Rows per page
					</span>
					<Select
						onValueChange={(value) =>
							table.setPageSize(Number(value))
						}
						value={table.getState().pagination.pageSize.toString()}
					>
						<SelectTrigger className="w-full">
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
				</div>
			</div>
			<PartnershipEditDialog
				open={editing !== null}
				onOpenChange={(v) => {
					if (!v) setEditing(null);
				}}
				initial={editing?.initial}
				onSave={async (values) => {
					if (!editing) return;
					await updatePartnership(editing.id, {
						termsAndConditions: values.partnershipTerm,
						discountRate: values.discountRate,
						endDate: values.endDate,
					});
					// Patch the visible end-date cell; terms live on detail.
					if (values.endDate !== undefined) {
						setData((prev) =>
							prev.map((p) =>
								p.partnershipId === editing.id
									? {
										...p,
										endDate: values.endDate as string,
									}
									: p
							)
						);
					}
				}}
			/>
			<AlertDialog
				open={terminating !== null}
				onOpenChange={(v) => !v && setTerminating(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Terminate partnership?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to terminate partnership{' '}
							#{terminating?.partnershipId}? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleTerminate}>
							Terminate
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
