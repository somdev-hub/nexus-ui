'use client';

import * as React from 'react';
import { flexRender } from '@tanstack/react-table';
import type {
    Column,
    Row,
    Table as TanstackTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { IconDotsVertical } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { TablePagination } from '@/components/ui/table-pagination';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CentralizedDataTableProps<TData extends object> {
    /** TanStack table instance created with the `useTables` hook. */
    table: TanstackTable<TData>;
    /** Optional toolbar rendered above the table (filters, exports, …). */
    toolbar?: React.ReactNode;
    /** Message rendered when the table has no rows. */
    emptyMessage?: string;
    /** Rows per page options for the page size dropdown. */
    pageSizeOptions?: number[];
    /** Set to true to hide the pagination footer. */
    hidePagination?: boolean;
}

/**
 * Detects whether a column holds numeric values (numbers or numeric
 * strings), based on the first available row. Used to limit the
 * sort affordance to numeric columns only.
 */
function isNumericColumn(
    column: Column<unknown, unknown>,
    rows: Row<unknown>[]
): boolean {
    const firstRow = rows[0];
    if (!firstRow || !column.accessorFn) {
        return false;
    }
    const rawValue = column.accessorFn(
        firstRow.original,
        firstRow.index
    );
    const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    return !Number.isNaN(numeric) && rawValue !== null && rawValue !== '';
}

/**
 * Renders the unified sort indicator for numeric columns: a single
 * up/down icon when unsorted, an up icon for ascending and a down
 * icon for descending.
 */
function SortIndicator({ sortState }: { sortState: false | 'asc' | 'desc' }) {
    if (sortState === 'desc') {
        return <ArrowDown className="h-3.5 w-3.5" />;
    }
    if (sortState === 'asc') {
        return <ArrowUp className="h-3.5 w-3.5" />;
    }
    return <ArrowUpDown className="h-3.5 w-3.5" />;
}

/**
 * Action item rendered inside a row-level dropdown menu.
 */
export interface TableRowActionItem<TData = unknown> {
    label: string;
    icon?: React.ElementType;
    onClick?: (row: TData) => void;
    destructive?: boolean;
}

/**
 * Row actions rendered through a menu icon (kebab/dots button) + dropdown
 * menu. Use this inside an `actions` column cell instead of plain action buttons.
 */
export function TableRowActions<TData>({
    actions,
}: {
    row: TData;
    actions: TableRowActionItem<TData>[];
}) {
    return (
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
                {actions.map((action, index) => (
                    <React.Fragment key={index}>
                        <DropdownMenuItem
                            variant={action.destructive ? 'destructive' : 'default'}
                        >
                            {action.icon ? (
                                <action.icon className="mr-2 h-4 w-4" />
                            ) : null}
                            {action.label}
                        </DropdownMenuItem>
                        {action.destructive ? <DropdownMenuSeparator /> : null}
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function CentralizedDataTable<TData extends object>({
    table,
    toolbar,
    emptyMessage = 'No results.',
    pageSizeOptions = [10, 20, 30, 40, 50],
    hidePagination = false,
}: CentralizedDataTableProps<TData>) {
    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const pageCount = table.getPageCount();
    const rows = table.getRowModel().rows;
    const visibleColumnCount = table.getVisibleLeafColumns().length;

    return (
        <div className="flex w-full flex-col gap-4">
            {toolbar}

            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    if (header.isPlaceholder) {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            />
                                        );
                                    }

                                    const column = header.column;
                                    const sortToggle =
                                        column.getToggleSortingHandler();
                                    const sortState = column.getIsSorted();
                                    const canSort =
                                        column.getCanSort() &&
                                        isNumericColumn(
                                            column as unknown as Column<
                                                unknown,
                                                unknown
                                            >,
                                            rows as unknown as Row<unknown>[]
                                        );

                                    const renderHeaderContent = () => {
                                        const headerDef = column.columnDef;
                                        if (typeof headerDef.header === 'function') {
                                            return flexRender(
                                                headerDef.header,
                                                header.getContext()
                                            );
                                        }
                                        return (
                                            <>
                                                {String(
                                                    headerDef.header ?? column.id
                                                )}
                                            </>
                                        );
                                    };

                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={
                                                canSort
                                                    ? 'cursor-pointer select-none'
                                                    : undefined
                                            }
                                        >
                                            {canSort ? (
                                                <div className="group flex items-center gap-0.5">
                                                    {renderHeaderContent()}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground ${
                                                            sortState === 'asc' ||
                                                            sortState === 'desc'
                                                                ? 'opacity-100'
                                                                : 'opacity-0 group-hover:opacity-100'
                                                        }`}
                                                        onClick={sortToggle}
                                                        aria-label={`Sort by ${String(
                                                            column.columnDef.header ?? column.id
                                                        )}`}
                                                    >
                                                        <SortIndicator
                                                            sortState={sortState}
                                                        />
                                                    </Button>
                                                </div>
                                            ) : (
                                                renderHeaderContent()
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {rows.length > 0 ? (
                            rows.map((row) => (
                                <TableRow key={row.id}>
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
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={Math.max(visibleColumnCount, 1)}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {!hidePagination && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-1 items-center text-sm font-medium">
                        Page {pageIndex + 1} of {Math.max(pageCount, 1)}
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <TablePagination
                            pageIndex={pageIndex}
                            pageCount={Math.max(pageCount, 1)}
                            canPreviousPage={table.getCanPreviousPage()}
                            canNextPage={table.getCanNextPage()}
                            onPageChange={(index) => table.setPageIndex(index)}
                            onPreviousPage={() => table.previousPage()}
                            onNextPage={() => table.nextPage()}
                            onFirstPage={() => table.setPageIndex(0)}
                            onLastPage={() =>
                                table.setPageIndex(Math.max(pageCount - 1, 0))
                            }
                        />
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2">
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label
                                htmlFor="rows-per-page"
                                className="shrink-0 text-sm font-medium whitespace-nowrap"
                            >
                                Rows per page
                            </Label>
                            <Select
                                value={`${pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="w-full"
                                    id="rows-per-page"
                                >
                                    <SelectValue placeholder={`${pageSize}`} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {pageSizeOptions.map((option) => (
                                        <SelectItem key={option} value={`${option}`}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
