"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import GlobalConfig from "@/global.config";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({
  children,
  requiredRole
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip authentication checks when disableAuth is true
    if (GlobalConfig.wowoFeatures.disableAuth) {
      return;
    }

    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (!isLoading && requiredRole && user?.role !== requiredRole) {
      router.push("/unauthorized");
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (!isAuthenticated) return null;
  if (requiredRole && user?.role !== requiredRole) return null;

  return <>{children}</>;
}
