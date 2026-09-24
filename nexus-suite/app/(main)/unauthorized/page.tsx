"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import Link from "next/link";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { getDashboardPathForOrgType } from "@/lib/services/organization-service";

export default function UnauthorizedPage() {
  const { orgType } = useUserMetadata();
  const dashboard = getDashboardPathForOrgType(orgType);
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your current role or organization type ({orgType || "unknown"}) doesn't have access to this section. Please
            contact an administrator if you believe this is a mistake.
          </p>
          <Button asChild className="w-full">
            <Link href={dashboard}>Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
