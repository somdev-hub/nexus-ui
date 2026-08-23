"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
    <nav
        role="navigation"
        aria-label="pagination"
        data-slot="pagination"
        className={cn("mx-auto flex w-full justify-center", className)}
        {...props}
    />
);
Pagination.displayName = "Pagination";

const PaginationContent = ({ className, ...props }: React.ComponentProps<"ul">) => (
    <ul
        data-slot="pagination-content"
        className={cn("flex flex-row items-center gap-1", className)}
        {...props}
    />
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = ({ className, ...props }: React.ComponentProps<"li">) => (
    <li
        data-slot="pagination-item"
        className={cn("", className)}
        {...props}
    />
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
    isActive?: boolean;
    size?: "default" | "sm" | "lg";
    disabled?: boolean;
} & Omit<React.ComponentProps<"a">, "disabled">;

const PaginationLink = ({
    className,
    isActive,
    size = "default",
    disabled,
    ...props
}: PaginationLinkProps) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        if (props.onClick) {
            props.onClick(e);
        }
    };

    return (
        <a
            aria-current={isActive ? "page" : undefined}
            aria-disabled={disabled}
            data-slot="pagination-link"
            data-active={isActive}
            data-disabled={disabled}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                disabled && "pointer-events-none opacity-50",
                isActive && "bg-primary text-primary-foreground shadow-sm",
                size === "default" && "h-9 px-4 py-2",
                size === "sm" && "h-8 px-3 text-xs",
                size === "lg" && "h-10 px-6 text-base",
                !isActive && !disabled && "hover:bg-accent hover:text-accent-foreground",
                className
            )}
            onClick={handleClick}
            {...props}
        />
    );
};
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
    className,
    disabled,
    ...props
}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="Go to previous page"
        size="default"
        disabled={disabled}
        className={cn("gap-1 px-2.5", className)}
        {...props}
    >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
    </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
    className,
    disabled,
    ...props
}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="Go to next page"
        size="default"
        disabled={disabled}
        className={cn("gap-1 px-2.5", className)}
        {...props}
    >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
    </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
    className,
    ...props
}: React.ComponentProps<"span">) => (
    <span
        aria-hidden
        data-slot="pagination-ellipsis"
        className={cn("flex h-9 w-9 items-center justify-center", className)}
        {...props}
    >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More pages</span>
    </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
};
