"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/lib/services/products-service";
import { getMaterials } from "@/lib/services/materials-service";
import { getOrders } from "@/lib/services/orders-service";
import { getPartnerships } from "@/lib/services/partnerships-service";
import { getPurchaseOrders } from "@/lib/services/purchase-orders-service";
import { getSupplierContracts } from "@/lib/services/supplier-contracts-service";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type DashboardData = {
  products: Awaited<ReturnType<typeof getProducts>>;
  materials: Awaited<ReturnType<typeof getMaterials>>;
  orders: Awaited<ReturnType<typeof getOrders>>;
  partnerships: Awaited<ReturnType<typeof getPartnerships>>;
};

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch in parallel - same as HR pattern (useEffect + Promise.all in client)
        // This avoids ERR_INVALID_URL that happens when using apiClient (baseURL: "/api/proxy")
        // inside a Server Component. On server, axios needs absolute URL; on client,
        // relative URL works because browser resolves it against window.location.origin
        // and withCredentials forwards HttpOnly cookies to /api/proxy.
        const [products, materials, orders, partnerships] = await Promise.all([
          getProducts({ pageNo: 0, pageOffset: 5 }),
          getMaterials({ pageNo: 0, pageOffset: 5 }),
          getOrders({ pageNo: 0, pageOffset: 5 }),
          getPartnerships({ pageNo: 0, pageOffset: 5 }),
          // Keep additional fetches for warming cache but don't block render
          getPurchaseOrders({ pageNo: 0, pageOffset: 5 }).catch(() => null),
          getSupplierContracts({ pageNo: 0, pageOffset: 5 }).catch(() => null),
        ]);

        if (!isActive) return;
        setData({ products, materials, orders, partnerships });
      } catch (err: unknown) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
        toast.error(message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <div className="px-4 lg:px-6">
              <Skeleton className="h-[300px] w-full" />
            </div>
            <Skeleton className="h-[300px] w-full mx-4 lg:mx-6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">{error || "No data available"}</p>
      </div>
    );
  }

  const { products, materials, orders, partnerships } = data;

  const tableData = [
    ...products.content.slice(0, 3).map((p, i) => ({
      id: i + 1,
      header: p.productName,
      type: p.category,
      status: p.isActive ? "Active" : "Inactive",
      target: p.unitPrice.toString(),
      limit: p.minOrderQuantity.toString(),
      reviewer: p.brand || "N/A",
    })),
    ...materials.content.slice(0, 3).map((m, i) => ({
      id: i + 4,
      header: m.materialName,
      type: m.category,
      status: m.isActive ? "Active" : "Inactive",
      target: m.unitPrice.toString(),
      limit: m.minOrderQuantity.toString(),
      reviewer: m.unitOfMeasure || "N/A",
    })),
  ];

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards
              totalProducts={products.totalElements}
              totalMaterials={materials.totalElements}
              totalOrders={orders.totalElements}
              totalPartnerships={partnerships.totalElements}
            />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={tableData} />
          </div>
        </div>
      </div>
    </>
  );
}
