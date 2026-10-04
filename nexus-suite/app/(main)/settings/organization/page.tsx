'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import {
    CURRENCIES,
    DEFAULT_CURRENCY,
    getDisplayCurrency,
    normalizeCurrency,
    setDisplayCurrency,
} from '@/lib/currency';
import {
    getOrganizationDetails,
    updateOrganizationCurrency,
} from '@/lib/services/organization-service';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function OrganizationSettingsPage() {
	const { orgId } = useUserMetadata();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [orgName, setOrgName] = useState('');
	const [orgType, setOrgType] = useState('');
	const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);

	useEffect(() => {
		let active = true;
		const load = async () => {
			if (!orgId) {
				setLoading(false);
				return;
			}
			setLoading(true);
			try {
				const org = await getOrganizationDetails(orgId);
				if (!active) return;
				setOrgName(org.orgName ?? '');
				setOrgType(org.orgType ?? '');
				const current = normalizeCurrency(
					org.defaultCurrency ?? getDisplayCurrency()
				);
				setCurrency(current);
				setDisplayCurrency(current);
			} catch (err: unknown) {
				if (!active) return;
				toast.error(
					err instanceof Error
						? err.message
						: 'Failed to load organization settings'
				);
			} finally {
				if (active) setLoading(false);
			}
		};
		load();
		return () => {
			active = false;
		};
	}, [orgId]);

	const handleSave = async () => {
		if (!orgId || saving) return;
		setSaving(true);
		try {
			await updateOrganizationCurrency(orgId, currency);
			setDisplayCurrency(currency);
			toast.success('Default currency updated');
		} catch (err: unknown) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Failed to update default currency'
			);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
				<div className="w-full  space-y-6">
					<div>
						<h2 className="text-lg font-semibold">
							Organization Settings
						</h2>
						<p className="text-sm text-muted-foreground">
							{orgName}
							{orgType ? ` · ${orgType}` : ''}
						</p>
					</div>
					<Card className="p-4 gap-2">
						<CardHeader className="p-0">
							<CardTitle>Default Currency</CardTitle>
						</CardHeader>
						<CardContent className="p-0 space-y-4">
							<p className="text-sm text-muted-foreground">
								Amounts across the suite are shown converted
								to this currency (live exchange rates). Each
								record keeps its own currency; this only
								changes how values are displayed for your
								organization.
							</p>
							<Select
								value={currency}
								onValueChange={setCurrency}
							>
								<SelectTrigger className="w-full max-w-xs">
									<SelectValue placeholder="Select currency" />
								</SelectTrigger>
								<SelectContent>
									{CURRENCIES.map((c) => (
										<SelectItem
											key={c.code}
											value={c.code}
										>
											{c.code} — {c.label} ({c.symbol})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								onClick={handleSave}
								disabled={saving || !orgId}
							>
								{saving && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{saving ? 'Saving…' : 'Save'}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
