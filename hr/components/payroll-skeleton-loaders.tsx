import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders skeleton placeholder cards for metrics
 * @param count - Number of skeleton cards to render (default: 4)
 */
export function SkeletonMetricsCards({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`skeleton-card-${i}`} className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/**
 * Renders skeleton placeholder for charts
 */
export function SkeletonCharts() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`skeleton-chart-${i}`} className="p-4">
            <CardHeader className="p-0">
              <Skeleton className="h-4 w-32 mb-4" />
            </CardHeader>
            <CardContent className="p-0">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <Card className="p-4">
            <CardHeader className="p-0">
              <Skeleton className="h-4 w-32 mb-4" />
            </CardHeader>
            <CardContent className="p-0">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">
          <Card className="p-4">
            <CardHeader className="p-0">
              <Skeleton className="h-4 w-32 mb-4" />
            </CardHeader>
            <CardContent className="p-0">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
