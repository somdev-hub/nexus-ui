"use client";
import { ProtectedRoute } from "@/lib/protected-route";

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredOrgType="SUPPLIER">{children}</ProtectedRoute>;
}
