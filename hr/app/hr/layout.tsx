"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function RouteLoadingBar() {
	const [isNavigating, setIsNavigating] = useState(true);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsNavigating(false);
		}, 400);

		return () => clearTimeout(timeout);
	}, []);

	if (!isNavigating) {
		return null;
	}

	return (
		<div className="fixed inset-x-0 top-0 z-50 h-1">
			<div
				className="h-full w-full bg-blue-500/90"
				style={{
					animation: "loading-bar 1.2s ease-in-out infinite",
				}}
			/>
		</div>
	);
}

export default function HRLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<RouteLoadingBar key={pathname} />
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
