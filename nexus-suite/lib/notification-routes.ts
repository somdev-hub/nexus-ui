// Maps a notification's entity type and id to a frontend route.
//
// The backend never hardcodes a frontend path — it carries entityType and
// entityId and leaves the routing to the browser, so that a route can
// change without a backend release.
//
// Add an entry here whenever a new entity type becomes notifiable.

export function resolveNotificationRoute(
    entityType: string,
    entityId: number
): string {
    switch (entityType) {
        case 'PURCHASE_ORDER':
            return `/retailer/purchase-orders/${entityId}`;
        case 'SHIPMENT':
            return `/retailer/shipments/${entityId}`;
        case 'INVOICE':
            return `/retailer/procurement/invoices/${entityId}`;
        case 'GOODS_RECEIPT':
            return `/retailer/procurement/goods-receipts/${entityId}`;
        case 'SUPPLIER_QUOTATION':
            return `/retailer/quotations/${entityId}`;
        default:
            return `/`;
    }
}
