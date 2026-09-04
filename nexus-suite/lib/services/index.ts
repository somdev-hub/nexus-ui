// ─────────────────────────────────────────────────────────────
// Nexus Suite Services - Centralized Export
// ─────────────────────────────────────────────────────────────

// Auth
export * from "./auth-service";

// Core Domain Services
export * from "./products-service";
export * from "./materials-service";
export * from "./orders-service";
export * from "./partnerships-service";
export * from "./purchase-orders-service";
export * from "./supplier-contracts-service";
export * from "./suppliers-service";
export * from "./logistics-service";
export * from "./shipment-service";

// API Client
export { default as apiClient } from "@/lib/api-client";
