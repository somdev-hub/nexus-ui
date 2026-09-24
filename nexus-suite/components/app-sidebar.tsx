"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import {
	IconChartBar,
	IconDashboard,
	IconDatabase,
	IconFileWord,
	IconFolder,
	IconInnerShadowTop,
	IconCirclePlusFilled,
	IconMail,
	IconDots,
	IconShare3,
	IconTrash,
	IconShoppingCart,
	IconPackage,
	IconTruck,
	IconLink,
	IconMessageCircle,
	IconEye,
	type Icon
} from "@tabler/icons-react";

import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from "@/components/ui/sidebar";
import Link from "next/link";

const retailerSections = [
		{
			id: "main",
			label: null,
			showHeader: true,
			showActions: false,
			items: [
				{ title: "Dashboard", url: "/retailer/dashboard", icon: IconDashboard },
				{ title: "Analytics", url: "/retailer/analytics", icon: IconChartBar }
			]
		},
		{
			id: "Products",
			label: "Products",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "All Products", url: "/retailer/products", icon: IconPackage },
				{ title: "Add Product", url: "/retailer/products/add", icon: IconCirclePlusFilled },
				{ title: "Board", url: "/retailer/products/board", icon: IconEye }
			]
		},
		{
			id: "procurement",
			label: "Procurement",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Purchase Orders", url: "/retailer/purchase-orders", icon: IconShoppingCart },
				{ title: "Goods Receipts", url: "/retailer/procurement/goods-receipts", icon: IconPackage },
				{ title: "Invoices", url: "/retailer/procurement/invoices", icon: IconFileWord },
				{ title: "Three-Way Match", url: "/retailer/procurement/three-way", icon: IconEye }
			]
		},
		{
			id: "inventory",
			label: "Inventory",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Materials", url: "/retailer/materials/inventory", icon: IconDatabase },
				{ title: "Stock", url: "/retailer/inventory/stock", icon: IconDatabase },
				{ title: "ABC Analysis", url: "/retailer/inventory/abc", icon: IconChartBar },
				{ title: "Movements", url: "/retailer/inventory/movements", icon: IconTruck }
			]
		},
		{
			id: "materials",
			label: "Materials Orders",
			showHeader: false,
			showActions: true,
			items: [{ title: "Material Orders", url: "/retailer/materials/orders", icon: IconShoppingCart }]
		},
		{
			id: "suppliers",
			label: "Suppliers",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Market", url: "/retailer/partnership/supplier-market", icon: IconLink },
				{ title: "Performance", url: "/retailer/suppliers/performance", icon: IconChartBar },
				{ title: "Risk Monitoring", url: "/retailer/suppliers/risk", icon: IconEye },
				{ title: "Contracts", url: "/retailer/supplier-contracts", icon: IconFileWord }
			]
		},
		{
			id: "logistics",
			label: "Logistics",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Shipments", url: "/retailer/shipments", icon: IconTruck },
				{ title: "Freight Invoices", url: "/retailer/logistics/freight-invoices", icon: IconFileWord },
				{ title: "Delivery Appointments", url: "/retailer/logistics/delivery-appointments", icon: IconPackage }
			]
		},
		{
			id: "partnerships",
			label: "Partnerships",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Partnership Management", url: "/retailer/partnership/management", icon: IconFileWord },
				{ title: "Logistics Market", url: "/retailer/partnership/logistic-market", icon: IconTruck },
				{ title: "Chats", url: "/retailer/partnership/chats", icon: IconMessageCircle }
			]
		}
	];

const supplierSections = [
		{
			id: "supplier-main",
			label: null,
			showHeader: true,
			showActions: false,
			items: [
				{ title: "Dashboard", url: "/supplier/dashboard", icon: IconDashboard },
				{ title: "Analytics", url: "/supplier/analytics", icon: IconChartBar }
			]
		},
		{
			id: "supplier-catalog",
			label: "Catalog",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Catalog", url: "/supplier/catalog", icon: IconPackage },
				{ title: "Variants", url: "/supplier/variants", icon: IconEye },
				{ title: "Price Tiers", url: "/supplier/pricing", icon: IconFileWord },
				{ title: "Digital Assets", url: "/supplier/digital-assets", icon: IconFolder }
			]
		},
		{
			id: "supplier-capacity",
			label: "Capacity & ATP",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Capacity Calendar", url: "/supplier/capacity", icon: IconDatabase },
				{ title: "ATP", url: "/supplier/atp", icon: IconChartBar }
			]
		},
		{
			id: "supplier-orders",
			label: "Fulfillment",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Orders", url: "/supplier/orders", icon: IconShoppingCart },
				{ title: "Quality Certs", url: "/supplier/quality-certificates", icon: IconFileWord }
			]
		},
		{
			id: "supplier-commercial",
			label: "Commercial",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Quotations", url: "/supplier/quotations", icon: IconFileWord },
				{ title: "Forecasts", url: "/supplier/forecasts", icon: IconShare3 },
				{ title: "Customers", url: "/supplier/customers", icon: IconEye },
				{ title: "Account Health", url: "/supplier/account-health", icon: IconChartBar }
			]
		},
		{
			id: "supplier-inventory",
			label: "Inventory",
			showHeader: false,
			showActions: true,
			items: [
				{ title: "Consignment", url: "/supplier/consignment", icon: IconDatabase },
				{ title: "VMI", url: "/supplier/vmi", icon: IconTruck }
			]
		},
		{
			id: "supplier-chats",
			label: "Collaboration",
			showHeader: false,
			showActions: true,
			items: [{ title: "Chats", url: "/supplier/partnership/chats", icon: IconMessageCircle }]
		}
	];

const data = {
	user: { name: "shadcn", email: "m@example.com", avatar: "/avatars/shadcn.jpg" },
	sidebarSections: retailerSections,
};

// Generic sidebar navigation section component
interface SidebarNavItem {
	title: string;
	url: string;
	icon?: Icon;
}

interface SidebarSection {
	id: string;
	label: string | null;
	showHeader: boolean;
	showActions: boolean;
	items: SidebarNavItem[];
}

interface SidebarNavSectionProps {
	section: SidebarSection;
}

function SidebarNavSection({ section }: SidebarNavSectionProps) {
	const { isMobile } = useSidebar();
	const pathname = usePathname();
	const router = useRouter();
	const [pendingUrl, setPendingUrl] = React.useState<string | null>(null);
	const { items, label, showHeader, showActions } = section;

	React.useEffect(() => {
		setPendingUrl(null);
	}, [pathname]);

	React.useEffect(() => {
		if (pendingUrl) {
			const t = setTimeout(() => setPendingUrl(null), 800);
			return () => clearTimeout(t);
		}
	}, [pendingUrl]);

	const isActive = (url: string) => {
		return pathname === url || pathname.startsWith(url + "/");
	};

	const isPending = (url: string) => pendingUrl === url;

	return (
		<SidebarGroup
			className={!showActions ? "" : "group-data-[collapsible=icon]:hidden"}
		>
			{showHeader && (
				<SidebarGroupContent className="flex flex-col gap-2 mb-2">
					<SidebarMenu>
						<SidebarMenuItem className="flex items-center gap-2">
							<SidebarMenuButton
								tooltip="Quick Create"
								className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
							>
								<IconCirclePlusFilled />
								<span>Quick Create</span>
							</SidebarMenuButton>
							<Button
								size="icon"
								className="size-8 group-data-[collapsible=icon]:opacity-0"
								variant="outline"
							>
								<IconMail />
								<span className="sr-only">Inbox</span>
							</Button>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			)}
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) => {
					const pending = isPending(item.url);
					return (
						<SidebarMenuItem key={item.title}>
							{showActions ? (
								<>
									<SidebarMenuButton asChild isActive={isActive(item.url)}>
										<Link href={item.url} prefetch onClick={() => setPendingUrl(item.url)}>
											{pending ? (
												<Loader2 className="animate-spin size-4" />
											) : (
												item.icon && <item.icon />
											)}
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<SidebarMenuAction
												showOnHover
												className="data-[state=open]:bg-accent rounded-sm"
											>
												<IconDots />
												<span className="sr-only">More</span>
											</SidebarMenuAction>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-24 rounded-lg"
											side={isMobile ? "bottom" : "right"}
											align={isMobile ? "end" : "start"}
										>
											<DropdownMenuItem>
												<IconFolder />
												<span>Open</span>
											</DropdownMenuItem>
											<DropdownMenuItem>
												<IconShare3 />
												<span>Share</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem variant="destructive">
												<IconTrash />
												<span>Delete</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</>
							) : (
								<Link href={item.url} onClick={() => setPendingUrl(item.url)}>
									<SidebarMenuButton
										tooltip={item.title}
										isActive={isActive(item.url)}
									>
										{pending ? (
											<Loader2 className="animate-spin size-4" />
										) : (
											item.icon && <item.icon />
										)}
										<span>{item.title}</span>
									</SidebarMenuButton>
								</Link>
							)}
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user, isAuthenticated } = useAuth();
	const orgType = (user as any)?.orgType ? String((user as any).orgType).toUpperCase() : undefined;

	// Choose sections based on orgType
	const allSections = orgType === "SUPPLIER" ? supplierSections : orgType === "LOGISTICS" ? [] : retailerSections;

	// Filter sidebar sections based on user role + orgType
	const filteredSections = isAuthenticated
		? allSections.filter((section) => {
			if (!user) return false;
			// Supplier sees all supplier sections regardless of role (simplified)
			if (orgType === "SUPPLIER") return true;
			// Retailer filtering as before
			const allRetailerSections = retailerSections.map(s => s.id);
			const roleAccess: Record<string, string[]> = {
				ROLE_ADMIN: allRetailerSections,
				ROLE_DIRECTOR: allRetailerSections,
				ROLE_PRODUCT_MANAGER: allRetailerSections,
				ROLE_ACCOUNT_MANAGER: allRetailerSections,
				ROLE_OPERATION_MANAGER: allRetailerSections,
				ROLE_WAREHOUSE_MANAGER: allRetailerSections,
				ROLE_FLEET_MANAGER: allRetailerSections,
				CLERK: allRetailerSections,
				DRIVER: allRetailerSections
			};
			return roleAccess[user.role]?.includes(section.id) ?? false;
		})
		: []; // Empty array if not authenticated

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:p-1.5!"
						>
							<Link href="/">
								<IconInnerShadowTop className="size-5!" />
								<span className="text-base font-semibold">Nexus Inc.</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{filteredSections.length > 0 ? (
					filteredSections.map((section) => (
						<SidebarNavSection key={section.id} section={section} />
					))
				) : (
					<div className="p-4 text-center text-sm text-muted-foreground">
						{!isAuthenticated
							? "Please log in to view menu items"
							: "No menu items available"}
					</div>
				)}
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={
						user
							? {
								name: user.name,
								email: user.role
									? user.role.replace("ROLE_", "").replaceAll("_", " ")
									: "No Role",
								avatar: user.avatar || "/avatars/default.jpg"
							}
							: data.user
					}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}
