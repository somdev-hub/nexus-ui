// Maps a notification's entity type and id to a frontend route.
//
// The backend never hardcodes a frontend path — it carries entityType and
// entityId and leaves the routing to the browser, so that a route can
// change without a backend release.
//
// Add an entry here whenever a new entity type becomes notifiable.
//
// The optional orgType parameter allows role-aware routing: a supplier
// receiving a notification about a goods receipt should land on the
// supplier invoices page, not the retailer goods-receipts page.

export type OrgType = "RETAILER" | "SUPPLIER" | "LOGISTICS" | string;

export function resolveNotificationRoute(
    entityType: string,
    entityId: number,
    orgType?: OrgType
): string {
    const isSupplier = orgType?.toUpperCase() === "SUPPLIER";
    const isLogistics = orgType?.toUpperCase() === "LOGISTICS";

    switch (entityType) {
        case "PURCHASE_ORDER":
            return isSupplier
                ? `/supplier/orders/${entityId}`
                : `/retailer/purchase-orders/${entityId}`;
        case "SHIPMENT":
            return isSupplier
                ? `/supplier/shipments/${entityId}`
                : isLogistics
                ? `/logistics/shipments/${entityId}`
                : `/retailer/shipments/${entityId}`;
        case "INVOICE":
            return isSupplier
                ? `/supplier/invoices`
                : `/retailer/procurement/invoices/${entityId}`;
        case "GOODS_RECEIPT":
            return isSupplier
                ? `/supplier/invoices`
                : `/retailer/procurement/goods-receipts/${entityId}`;
        case "SUPPLIER_QUOTATION":
            return isSupplier
                ? `/supplier/quotations/${entityId}`
                : `/retailer/quotations/${entityId}`;
        case "PARTNERSHIP":
            return isSupplier
                ? `/supplier/partnership/management`
                : `/retailer/partnerships/${entityId}`;
        case "PAYMENT":
            return `/retailer/payments/${entityId}`;
        default:
            return `/`;
    }
}