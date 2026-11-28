'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

export function ProfileSkeleton() {
    return (
        <div className="p-4 md:p-6 space-y-8">
            {/* Header skeleton */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Hero card skeleton */}
            <Card className="mb-4 p-4 gap-2">
                <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
                        <div className="relative mb-4 shrink-0 lg:mb-0">
                            <Skeleton className="h-32 w-32 rounded-full" />
                            <Skeleton
                                className="absolute bottom-0 right-0 h-10 w-10 rounded-full"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="mb-2 flex items-baseline gap-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-24" />
                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs skeleton */}
            <div className="w-full">
                <Skeleton className="h-10 w-full" />
            </div>

            {/* Tab content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
