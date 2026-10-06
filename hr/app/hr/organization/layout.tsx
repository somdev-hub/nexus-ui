"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const TABS = [
	{ title: "Overview", href: "/hr/organization" },
	{ title: "Roles & Permissions", href: "/hr/organization/roles" },
	{ title: "Compensation", href: "/hr/organization/compensation" },
	{ title: "Org Profile", href: "/hr/organization/profile" },
	{ title: "Teams", href: "/hr/organization/teams" }
];

export default function OrganizationLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	return (
		<div className="p-6 space-y-6">
			<Toaster position="top-right" richColors />
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Organization Management
				</h1>
				<p className="text-muted-foreground mt-2">
					Manage departments, roles, compensation, profile and
					teams
				</p>
			</div>
			<div className="flex gap-2 flex-wrap">
				{TABS.map((t) => {
					const active = pathname === t.href;
					return (
						<Button
							key={t.href}
							size="sm"
							variant={active ? "default" : "outline"}
							asChild
						>
							<Link href={t.href}>{t.title}</Link>
						</Button>
					);
				})}
			</div>
			{children}
		</div>
	);
}
