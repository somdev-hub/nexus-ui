"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { getDashboardPathForOrgType, getOrganizationById } from "@/lib/services/organization-service";

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, isLoading, orgType, orgId } = useUserMetadata();
	const [resolvedOrgType, setResolvedOrgType] = useState<string | undefined>(orgType);
	const [resolving, setResolving] = useState(false);

	useEffect(() => { setResolvedOrgType(orgType); }, [orgType]);

	// If authenticated but orgType missing (stale session from before fix), fetch it before redirecting
	useEffect(() => {
		if (!isLoading && isAuthenticated && !resolvedOrgType && orgId && !resolving) {
			setResolving(true);
			getOrganizationById(orgId)
				.then((org) => {
					const t = (org as any)?.orgType ? String((org as any).orgType).toUpperCase() : undefined;
					if (t) {
						setResolvedOrgType(t);
						// Persist to localStorage so future loads don't need re-fetch
						try {
							const stored = localStorage.getItem("auth_user");
							if (stored) {
								const u = JSON.parse(stored);
								u.orgType = t;
								localStorage.setItem("auth_user", JSON.stringify(u));
							}
						} catch {}
					}
				})
				.catch(() => {})
				.finally(() => setResolving(false));
		}
	}, [isLoading, isAuthenticated, resolvedOrgType, orgId, resolving]);

	useEffect(() => {
		if (!isLoading && !resolving) {
			if (isAuthenticated) {
				// If still no orgType after fetch attempt, default will be retailer (safe fallback), but supplier will be resolved before this push
				router.push(getDashboardPathForOrgType(resolvedOrgType));
			} else {
				router.push("/login");
			}
		}
	}, [isAuthenticated, isLoading, resolving, resolvedOrgType, router]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="animate-pulse text-muted-foreground">Loading...</div>
		</div>
	);
}
