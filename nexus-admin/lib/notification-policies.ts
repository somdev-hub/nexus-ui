// Notification policy (rule) data layer.
// Fetches notification rules from IAM (which proxies to CMS).

export interface NotificationPolicyRule {
  policyId: number;
  eventType: string;
  previousStatus: string | null;
  newStatus: string;
  severity: string;
  addressing: string;
  addressTo: string;
  titleTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedPolicies {
  content: NotificationPolicyRule[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

const API_PATH = "/api/notifications/policies";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Encode the full path (including query params) so the proxy doesn't
  // split on '&' or '?' inside the path value.
  const fullPath = `${API_PATH}${endpoint}`;
  const url = `/api/proxy?path=${encodeURIComponent(fullPath)}`;
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.detail || body.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchPolicies(page = 0, size = 50, eventType?: string): Promise<PaginatedPolicies> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (eventType) params.set("eventType", eventType);
  return fetchApi<PaginatedPolicies>(`?${params}`);
}

export async function fetchPolicy(id: number): Promise<NotificationPolicyRule> {
  return fetchApi<NotificationPolicyRule>(`/${id}`);
}

export async function createPolicy(data: Partial<NotificationPolicyRule>): Promise<NotificationPolicyRule> {
  return fetchApi<NotificationPolicyRule>("", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePolicy(id: number, data: Partial<NotificationPolicyRule>): Promise<NotificationPolicyRule> {
  return fetchApi<NotificationPolicyRule>(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deactivatePolicy(id: number): Promise<NotificationPolicyRule> {
  return fetchApi<NotificationPolicyRule>(`/${id}`, { method: "DELETE" });
}

export async function fetchEventTypes(): Promise<string[]> {
  return fetchApi<string[]>("/event-types");
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE_ORDER_STATUS_CHANGED: "Purchase Order",
  QUOTATION_STATUS_CHANGED: "Quotation",
  PARTNERSHIP_STATUS_CHANGED: "Partnership",
  INVOICE_STATUS_CHANGED: "Invoice",
  PAYMENT_STATUS_CHANGED: "Payment",
  SHIPMENT_STATUS_CHANGED: "Shipment (Logistics)",
  GOODS_RECEIPT_STATUS_CHANGED: "Goods Receipt",
};

export const SEVERITY_OPTIONS = ["INFO", "WARNING", "CRITICAL", "ACTION_REQUIRED"];
export const ADDRESSING_OPTIONS = ["ORG", "USER", "AUTHORITY"];
export const ADDRESS_TO_OPTIONS = ["COUNTERPARTY", "ACTOR_ORG", "RETAILER", "SUPPLIER"];

export const PLACEHOLDERS: Record<string, string[]> = {
  PURCHASE_ORDER_STATUS_CHANGED: ["{poNumber}", "{supplierName}", "{expectedDeliveryDate}", "{confirmedDeliveryDate}", "{rejectionReason}", "{supplierNotes}"],
  QUOTATION_STATUS_CHANGED: ["{quotationNumber}"],
  PARTNERSHIP_STATUS_CHANGED: ["{primaryOrgName}", "{secondaryOrgName}", "{partnershipType}"],
  INVOICE_STATUS_CHANGED: ["{invoiceNumber}", "{totalAmount}"],
  SHIPMENT_STATUS_CHANGED: ["{shipmentNumber}", "{trackingNumber}", "{carrierName}"],
  GOODS_RECEIPT_STATUS_CHANGED: ["{grNumber}"],
  PAYMENT_STATUS_CHANGED: [],
};

export const ENTITY_STATUSES: Record<string, string[]> = {
  PURCHASE_ORDER_STATUS_CHANGED: ["DRAFT", "APPROVED", "SENT_TO_SUPPLIER", "ACKNOWLEDGED", "REJECTED", "CANCELLED", "PARTIALLY_RECEIVED", "RECEIVED", "AWAITING_PICKUP", "SHIPPED"],
  QUOTATION_STATUS_CHANGED: ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"],
  PARTNERSHIP_STATUS_CHANGED: ["DRAFT", "PENDING_REVIEW", "NEGOTIATING", "ACTIVE", "SUSPENDED", "TERMINATED", "REJECTED", "RENEWAL_PENDING"],
  INVOICE_STATUS_CHANGED: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PAID", "CANCELLED"],
  SHIPMENT_STATUS_CHANGED: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "BOOKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "PARTIALLY_DELIVERED", "EXCEPTION", "RESOLVED", "CANCELLED", "CLOSED"],
  GOODS_RECEIPT_STATUS_CHANGED: ["DRAFT", "RECEIVED", "PARTIALLY_RECEIVED", "SENT_TO_SUPPLIER", "RETURNED", "REJECTED", "CANCELLED"],
  PAYMENT_STATUS_CHANGED: ["INITIATED", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FAILED", "REVOKED", "REFUND_REQUESTED", "REFUNDED"],
};