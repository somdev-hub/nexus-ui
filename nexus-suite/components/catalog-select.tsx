'use client';

import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getSupplierCatalogs } from '@/lib/services/supplier-catalog-service';
import type { SupplierCatalog } from '@/types/supplier';

/**
 * Dropdown of the supplier's own catalog items. Replaces manual
 * catalog-ID inputs everywhere in the supplier workspace.
 */
export function CatalogSelect({
    value,
    onChange,
    placeholder = 'Select catalog item',
    disabled = false,
}: {
    value?: string;
    onChange: (catalogId: string) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    const [items, setItems] = useState<SupplierCatalog[]>([]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const res = await getSupplierCatalogs({
                    page: 0,
                    size: 100,
                });
                if (active) setItems(res.content ?? []);
            } catch {
                // options stay empty; global 500 toast already fired
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);

    return (
        <Select
            value={value && value !== '' ? value : undefined}
            onValueChange={onChange}
            disabled={disabled}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {items.map((c) => (
                    <SelectItem key={c.catalogId} value={String(c.catalogId)}>
                        {c.name} ({c.code}
                        {c.basePrice !== undefined && c.basePrice !== null
                            ? ` — ${c.basePrice}`
                            : ''}
                        )
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
