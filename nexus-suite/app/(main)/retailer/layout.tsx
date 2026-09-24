"use client";
import { ProtectedRoute } from "@/lib/protected-route";

export default function RetailerLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredOrgType="RETAILER">{children}</ProtectedRoute>;
}
