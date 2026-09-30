'use client';

import { Button } from '@/components/ui/button';
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
} from '@tabler/icons-react';

interface TablePaginationProps {
    pageIndex: number;
    pageCount: number;
    canPreviousPage: boolean;
    canNextPage: boolean;
    onPageChange: (index: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    /** Show first/last (|‹ ›|) buttons. Defaults to true. */
    showFirstLast?: boolean;
    onFirstPage?: () => void;
    onLastPage?: () => void;
}

type PageToken = number | 'ellipsis-start' | 'ellipsis-end';

function getPageTokens(current: number, total: number): PageToken[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i);
    }
    const window = new Set<number>([
        0,
        total - 1,
        current - 1,
        current,
        current + 1,
    ]);
    const pages = [...window]
        .filter((p) => p >= 0 && p < total)
        .sort((a, b) => a - b);
    const tokens: PageToken[] = [];
    let prev = -1;
    for (const p of pages) {
        if (prev !== -1 && p - prev > 1) {
            tokens.push(prev === 0 ? 'ellipsis-start' : 'ellipsis-end');
        }
        tokens.push(p);
        prev = p;
    }
    return tokens;
}

export function TablePagination({
    pageIndex,
    pageCount,
    canPreviousPage,
    canNextPage,
    onPageChange,
    onPreviousPage,
    onNextPage,
    showFirstLast = true,
    onFirstPage,
    onLastPage,
}: TablePaginationProps) {
    if (pageCount <= 0) return null;

    return (
        <div className="flex items-center gap-1">
            {showFirstLast && onFirstPage && (
                <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={onFirstPage}
                    disabled={!canPreviousPage}
                >
                    <span className="sr-only">Go to first page</span>
                    <IconChevronsLeft />
                </Button>
            )}
            <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={onPreviousPage}
                disabled={!canPreviousPage}
                aria-label="Go to previous page"
            >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
            </Button>
            {getPageTokens(pageIndex, pageCount).map((token) =>
                typeof token === 'number' ? (
                    <Button
                        key={token}
                        variant={token === pageIndex ? 'default' : 'outline'}
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(token)}
                        disabled={token === pageIndex}
                        aria-label={`Go to page ${token + 1}`}
                        aria-current={token === pageIndex ? 'page' : undefined}
                    >
                        {token + 1}
                    </Button>
                ) : (
                    <span
                        key={token}
                        className="text-muted-foreground px-1 text-sm"
                        aria-hidden="true"
                    >
                        …
                    </span>
                )
            )}
            <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={onNextPage}
                disabled={!canNextPage}
                aria-label="Go to next page"
            >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
            </Button>
            {showFirstLast && onLastPage && (
                <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={onLastPage}
                    disabled={!canNextPage}
                >
                    <span className="sr-only">Go to last page</span>
                    <IconChevronsRight />
                </Button>
            )}
        </div>
    );
}
