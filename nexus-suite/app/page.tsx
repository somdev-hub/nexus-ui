"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserMetadata } from "@/hooks/use-user-metadata";

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useUserMetadata();

	useEffect(() => {
		if (!isLoading) {
			if (isAuthenticated) {
				router.push("/retailer/dashboard");
			} else {
				router.push("/login");
			}
		}
	}, [isAuthenticated, isLoading, router]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="animate-pulse text-muted-foreground">Loading...</div>
		</div>
	);
}
