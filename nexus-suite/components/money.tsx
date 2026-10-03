'use client';

import { useEffect, useState } from 'react';
import {
    convertAmount,
    formatMoney,
    getExchangeRates,
    normalizeCurrency,
    useDisplayCurrency,
} from '@/lib/currency';

/**
 * Money display: converts the amount from its own (row) currency into the
 * display currency (org default, USD fallback) using cached FX rates.
 * Falls back to the raw amount + code when rates are unavailable.
 */
export function Money({
    amount,
    currency,
    className,
}: {
    amount: number | string | null | undefined;
    currency?: string | null;
    className?: string;
}) {
    const [converted, setConverted] = useState<{
        key: string;
        text: string;
    } | null>(null);
    const from = normalizeCurrency(currency);
    const display = useDisplayCurrency();
    const key = `${amount}|${from}|${display}`;

    useEffect(() => {
        let active = true;
        if (display === from) return;
        getExchangeRates().then((rates) => {
            if (!active) return;
            const n = Number(amount);
            if (!Number.isFinite(n)) return;
            const out = convertAmount(n, from, display, rates);
            if (out !== null && active)
                setConverted({ key, text: formatMoney(out, display) });
        });
        return () => {
            active = false;
        };
    }, [amount, from, display, key]);

    if (amount === null || amount === undefined || amount === '') return <>—</>;
    const raw = formatMoney(amount, from);
    const shown =
        converted && converted.key === key ? converted.text : raw;
    return (
        <span
            className={className}
            title={shown !== raw ? `${raw} (converted)` : raw}
        >
            {shown}
        </span>
    );
}
