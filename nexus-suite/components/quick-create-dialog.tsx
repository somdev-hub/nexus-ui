'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	AlertTriangle,
	BadgeCheck,
	BadgeDollarSign,
	Boxes,
	CalendarClock,
	ClipboardCheck,
	Factory,
	FileText,
	Gauge,
	Layers,
	Package,
	PackageCheck,
	PackagePlus,
	Receipt,
	ShoppingCart,
	Tag,
	TrendingUp,
	Truck,
	User,
	Wallet,
	Wrench,
	type LucideIcon,
} from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import {
	QUICK_CREATE_MENU_EVENT,
	setQuickCreateIntent,
} from '@/lib/quick-create';

// ─────────────────────────────────────────────────────────────
// QuickCreateDialog — portal-aware "what do you want to create?"
// menu opened from the sidebar Quick Create button.
//
// Each option either redirects to a dedicated creation page
// (intent omitted) or navigates to the owning list page carrying
// an intent that auto-opens that page's create dialog.
// ─────────────────────────────────────────────────────────────

interface QuickCreateOption {
	key: string;
	label: string;
	description: string;
	icon: LucideIcon;
	href: string;
	/** Dialog intent consumed by the target page; omit for pure redirects. */
	intent?: string;
}

const RETAILER_OPTIONS: QuickCreateOption[] = [
	{
		key: 'product',
		label: 'Product',
		description: 'Add to catalog',
		icon: PackagePlus,
		href: '/retailer/products/add',
	},
	{
		key: 'purchase-order',
		label: 'Purchase Order',
		description: 'Order from supplier',
		icon: ShoppingCart,
		href: '/retailer/purchase-orders',
	},
	{
		key: 'shipment',
		label: 'Shipment',
		description: 'Book inbound freight',
		icon: Truck,
		href: '/retailer/shipments/new',
	},
	{
		key: 'goods-receipt',
		label: 'Goods Receipt',
		description: 'Receive delivered goods',
		icon: ClipboardCheck,
		href: '/retailer/procurement/goods-receipts',
	},
	{
		key: 'invoice',
		label: 'Invoice',
		description: 'Record supplier invoice',
		icon: Receipt,
		href: '/retailer/procurement/invoices',
	},
	{
		key: 'appointment',
		label: 'Appointment',
		description: 'Book a delivery slot',
		icon: CalendarClock,
		href: '/retailer/logistics/delivery-appointments',
	},
];

const SUPPLIER_OPTIONS: QuickCreateOption[] = [
	{
		key: 'catalog-item',
		label: 'Catalog Item',
		description: 'Sellable product',
		icon: Package,
		href: '/supplier/catalog',
		intent: 'supplier:catalog',
	},
	{
		key: 'variant',
		label: 'Variant',
		description: 'Product variation',
		icon: Layers,
		href: '/supplier/variants',
		intent: 'supplier:variant',
	},
	{
		key: 'price-tier',
		label: 'Price Tier',
		description: 'Volume pricing',
		icon: Tag,
		href: '/supplier/pricing',
		intent: 'supplier:pricing',
	},
	{
		key: 'quotation',
		label: 'Quotation',
		description: 'Quote for buyer',
		icon: FileText,
		href: '/supplier/quotations',
		intent: 'supplier:quotation',
	},
	{
		key: 'capacity',
		label: 'Capacity Entry',
		description: 'Production window',
		icon: Factory,
		href: '/supplier/capacity',
		intent: 'supplier:capacity',
	},
	{
		key: 'forecast',
		label: 'Forecast',
		description: 'Demand projection',
		icon: TrendingUp,
		href: '/supplier/forecasts',
		intent: 'supplier:forecast',
	},
	{
		key: 'certificate',
		label: 'Quality Cert',
		description: 'Compliance document',
		icon: BadgeCheck,
		href: '/supplier/quality-certificates',
		intent: 'supplier:cert',
	},
];

const LOGISTICS_OPTIONS: QuickCreateOption[] = [
	{
		key: 'quote',
		label: 'Shipment Quote',
		description: 'Rate + surcharges',
		icon: FileText,
		href: '/logistics/load-board',
		intent: 'logistics:quote',
	},
	{
		key: 'asset',
		label: 'Fleet Asset',
		description: 'Truck / trailer',
		icon: Truck,
		href: '/logistics/fleet',
		intent: 'logistics:asset',
	},
	{
		key: 'driver',
		label: 'Driver',
		description: 'Driver profile',
		icon: User,
		href: '/logistics/fleet',
		intent: 'logistics:driver',
	},
	{
		key: 'maintenance',
		label: 'Maintenance',
		description: 'Service record',
		icon: Wrench,
		href: '/logistics/fleet',
		intent: 'logistics:maintenance',
	},
	{
		key: 'incident',
		label: 'Exception',
		description: 'Delay / damage',
		icon: AlertTriangle,
		href: '/logistics/shipments',
		intent: 'logistics:incident',
	},
	{
		key: 'pod',
		label: 'Proof of Delivery',
		description: 'Capture POD',
		icon: PackageCheck,
		href: '/logistics/shipments',
		intent: 'logistics:pod',
	},
	{
		key: 'group',
		label: 'Consolidation',
		description: 'Group shipments',
		icon: Boxes,
		href: '/logistics/routing',
		intent: 'logistics:group',
	},
	{
		key: 'capacity',
		label: 'Capacity',
		description: 'Lane forecast',
		icon: Gauge,
		href: '/logistics/routing',
		intent: 'logistics:capacity',
	},
	{
		key: 'rate',
		label: 'Freight Rate',
		description: 'Contract / spot',
		icon: BadgeDollarSign,
		href: '/logistics/financials',
		intent: 'logistics:rate',
	},
	{
		key: 'payable',
		label: 'Carrier Payable',
		description: 'Sub-carrier settlement',
		icon: Wallet,
		href: '/logistics/financials',
		intent: 'logistics:payable',
	},
];

function optionsFor(orgType: string | undefined): QuickCreateOption[] {
	switch ((orgType ?? '').toUpperCase()) {
		case 'SUPPLIER':
			return SUPPLIER_OPTIONS;
		case 'LOGISTICS':
			return LOGISTICS_OPTIONS;
		default:
			return RETAILER_OPTIONS;
	}
}

export default function QuickCreateDialog() {
	const router = useRouter();
	const { user } = useAuth();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');

	useEffect(() => {
		const handler = () => {
			setQuery('');
			setOpen(true);
		};
		window.addEventListener(QUICK_CREATE_MENU_EVENT, handler);
		return () => window.removeEventListener(QUICK_CREATE_MENU_EVENT, handler);
	}, []);

	const orgType = (user as { orgType?: unknown } | null)?.orgType
		? String((user as { orgType?: unknown }).orgType)
		: undefined;
	const options = useMemo(() => optionsFor(orgType), [orgType]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter((o) =>
			`${o.label} ${o.description}`.toLowerCase().includes(q)
		);
	}, [options, query]);

	const select = (option: QuickCreateOption) => {
		setOpen(false);
		if (option.intent) setQuickCreateIntent(option.intent);
		router.push(option.href);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="md:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Quick Create</DialogTitle>
					<DialogDescription>
						What do you want to create?
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<Input
						placeholder="Search actions…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						autoFocus
					/>
					<div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
						{filtered.map((option) => (
							<button
								key={option.key}
								type="button"
								onClick={() => select(option)}
								className="group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
							>
								<span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
									<option.icon className="h-4 w-4" />
								</span>
								<span>
									<span className="block text-sm font-medium">
										{option.label}
									</span>
									<span className="block text-xs text-muted-foreground">
										{option.description}
									</span>
								</span>
							</button>
						))}
						{filtered.length === 0 && (
							<p className="col-span-full py-4 text-center text-sm text-muted-foreground">
								No actions match “{query}”
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
