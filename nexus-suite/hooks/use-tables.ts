'use client';

import * as React from 'react';
import {
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    type Row,
    type RowSelectionState,
    type SortingState,
    type Updater,
    type VisibilityState,
} from '@tanstack/react-table';

/**
 * Default page size used when a table does not specify one.
 */
export const DEFAULT_TABLE_PAGE_SIZE = 10;

export interface UseTablesOptions<TData> {
    /** The rows to display in the table. */
    data: TData[];
    /** Column definitions for the table (sorting + actions aware). */
    columns: ColumnDef<TData>[];
    /** Initial page index (0 based). Defaults to 0. */
    pageIndex?: number;
    /** Initial page size. Defaults to {@link DEFAULT_TABLE_PAGE_SIZE}. */
    pageSize?: number;
    /** Initial sorting state. */
    sorting?: SortingState;
    /** Initial row selection state. */
    rowSelection?: RowSelectionState;
    /** Initial column visibility state. */
    columnVisibility?: VisibilityState;
    /** Initial column filters state. */
    columnFilters?: ColumnFiltersState;
    /** Initial global text filter value (controlled via the table instance). */
    globalFilter?: string;
    /** Enables pagination. Defaults to true (pagination by default). */
    enablePagination?: boolean;
    /** Enables sorting. Defaults to true. */
    enableSorting?: boolean;
    /** Enables row selection. Defaults to false. */
    enableRowSelection?: boolean;
    /** Stable row id resolver. */
    getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
    /**
     * Use manual (server-side) pagination. When true, `data` must already be
     * the current page and `pageCount` must be supplied.
     */
    manualPagination?: boolean;
    /** Total number of pages (manual pagination only). */
    pageCount?: number;
    /** Controlled pagination state. */
    pagination?: PaginationState;
    /** Called with the next pagination state whenever it changes. */
    onPaginationChange?: (pagination: PaginationState) => void;
}

/**
 * Centralized table interface.
 *
 * Wraps the TanStack table (`useReactTable`) into a single, opinionated
 * table state hook: sorting + pagination (by default) are managed here and
 * the fully configured table instance is returned for rendering.
 */
export function useTables<TData>({
    data,
    columns,
    pageSize = DEFAULT_TABLE_PAGE_SIZE,
    pageIndex = 0,
    sorting,
    rowSelection,
    columnVisibility,
    columnFilters,
    globalFilter,
    enablePagination = true,
    enableSorting = true,
    enableRowSelection = false,
    getRowId,
    manualPagination = false,
    pageCount,
    pagination,
    onPaginationChange,
}: UseTablesOptions<TData>) {
    const [sortingState, setSorting] = React.useState<SortingState>(
        sorting ?? []
    );
    const [paginationState, setPagination] = React.useState<PaginationState>({
        pageIndex,
        pageSize,
    });
    const activePagination = pagination ?? paginationState;

    const handlePaginationChange = React.useCallback(
        (updater: Updater<PaginationState>) => {
            const next =
                typeof updater === 'function'
                    ? updater(activePagination)
                    : updater;
            if (pagination === undefined) {
                setPagination(next);
            }
            onPaginationChange?.(next);
        },
        [activePagination, pagination, onPaginationChange]
    );
    const [rowSelectionState, setRowSelection] = React.useState<RowSelectionState>(
        rowSelection ?? {}
    );
    const [columnVisibilityState, setColumnVisibility] =
        React.useState<VisibilityState>(columnVisibility ?? {});
    const [columnFiltersState, setColumnFilters] =
        React.useState<ColumnFiltersState>(columnFilters ?? []);
    const [globalFilterState, setGlobalFilter] =
        React.useState<string>(globalFilter ?? '');

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting: enableSorting ? sortingState : [],
            pagination: enablePagination
                ? activePagination
                : { pageIndex: 0, pageSize: DEFAULT_TABLE_PAGE_SIZE },
            rowSelection: rowSelectionState,
            columnVisibility: columnVisibilityState,
            columnFilters: columnFiltersState,
            globalFilter: globalFilterState,
        },
        onSortingChange: enableSorting ? setSorting : () => {},
        onPaginationChange: enablePagination
            ? handlePaginationChange
            : () => {},
        manualPagination,
        pageCount: manualPagination ? pageCount : undefined,
        onRowSelectionChange: setRowSelection,
        enableRowSelection,
        getRowId,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: manualPagination
            ? undefined
            : getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return table;
}
