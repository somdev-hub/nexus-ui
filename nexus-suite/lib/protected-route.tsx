"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import GlobalConfig from "@/global.config";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredOrgType?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredOrgType,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (GlobalConfig.wowoFeatures.auth === false) {
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (!isLoading && requiredRole && user?.role !== requiredRole) {
      router.push("/unauthorized");
    }
    if (!isLoading && requiredOrgType && (user as any)?.orgType) {
      const actual = String((user as any).orgType).toUpperCase();
      if (actual !== requiredOrgType.toUpperCase()) router.push("/unauthorized");
    }
  }, [isLoading, isAuthenticated, user, requiredRole, requiredOrgType, router]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (!isAuthenticated) return null;
  if (requiredRole && user?.role !== requiredRole) return null;
  if (requiredOrgType && (user as any)?.orgType && String((user as any).orgType).toUpperCase() !== requiredOrgType.toUpperCase()) return null;

  return <>{children}</>;
}
