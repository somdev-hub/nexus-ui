import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="grid gap-2" aria-busy="true" aria-label="Loading">
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>
    );
}
