import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────
// Central currency system.
// - Amounts are stored in their own currency (row currency).
// - Display currency defaults to USD; an organization can pick its own
//   default in Organization Settings (persisted server-side + mirrored to
//   localStorage so reads are synchronous).
// - Conversion uses the free, keyless open.er-api.com rates (24h cache).
// ─────────────────────────────────────────────────────────────

export const DEFAULT_CURRENCY = 'USD';

export interface CurrencyOption {
    code: string;
    symbol: string;
    label: string;
}

export const CURRENCIES: CurrencyOption[] = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
];

const DISPLAY_KEY = 'nexus:display-currency';
const RATES_KEY = 'nexus:fx-rates';
const RATES_TTL_MS = 24 * 60 * 60 * 1000;
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';

export function normalizeCurrency(code?: string | null): string {
    const upper = (code ?? '').trim().toUpperCase();
    return CURRENCIES.some((c) => c.code === upper) ? upper : DEFAULT_CURRENCY;
}

export function getDisplayCurrency(): string {
    if (typeof window === 'undefined') return DEFAULT_CURRENCY;
    try {
        return normalizeCurrency(localStorage.getItem(DISPLAY_KEY));
    } catch {
        return DEFAULT_CURRENCY;
    }
}

export function setDisplayCurrency(code: string): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(DISPLAY_KEY, normalizeCurrency(code));
        window.dispatchEvent(new Event('nexus:currency-change'));
    } catch {
        // ignore storage errors
    }
}

export function useDisplayCurrency(): string {
    const [currency, setCurrency] = useState<string>(getDisplayCurrency);
    useEffect(() => {
        const refresh = () => setCurrency(getDisplayCurrency());
        window.addEventListener('nexus:currency-change', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('nexus:currency-change', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);
    return currency;
}

/** Format an amount in its own currency (no conversion). */
export function formatMoney(
    amount: number | string | null | undefined,
    currencyCode?: string | null
): string {
    if (amount === null || amount === undefined || amount === '') return '—';
    const code = normalizeCurrency(currencyCode);
    const n = Number(amount);
    if (!Number.isFinite(n)) return '—';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code,
        }).format(n);
    } catch {
        return `${code} ${n.toLocaleString()}`;
    }
}

interface RatesCache {
    base: string;
    rates: Record<string, number>;
    fetchedAt: number;
}

let ratesPromise: Promise<Record<string, number>> | null = null;

/** USD-based rates (units per USD). Empty object when unavailable. */
export function getExchangeRates(): Promise<Record<string, number>> {
    if (ratesPromise) return ratesPromise;
    ratesPromise = (async () => {
        try {
            const raw =
                typeof window !== 'undefined'
                    ? localStorage.getItem(RATES_KEY)
                    : null;
            if (raw) {
                const cached = JSON.parse(raw) as RatesCache;
                if (
                    cached?.rates &&
                    Date.now() - cached.fetchedAt < RATES_TTL_MS
                ) {
                    return cached.rates;
                }
            }
        } catch {
            // fall through to network
        }
        try {
            const res = await fetch(RATES_URL);
            const data = (await res.json()) as {
                result?: string;
                rates?: Record<string, number>;
            };
            if (data?.result === 'success' && data.rates) {
                try {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(
                            RATES_KEY,
                            JSON.stringify({
                                base: 'USD',
                                rates: data.rates,
                                fetchedAt: Date.now(),
                            } satisfies RatesCache)
                        );
                    }
                } catch {
                    // ignore storage errors
                }
                return data.rates;
            }
        } catch {
            // offline / blocked — callers fall back to the raw amount
        }
        return {};
    })();
    // Allow retry on next call after a failure (empty rates), keep success cached.
    ratesPromise.then((rates) => {
        if (Object.keys(rates).length === 0) ratesPromise = null;
    });
    return ratesPromise;
}

/** Convert amount from one currency to another via USD cross rates. Null when not possible. */
export function convertAmount(
    amount: number,
    from: string,
    to: string,
    rates: Record<string, number>
): number | null {
    const src = normalizeCurrency(from);
    const dst = normalizeCurrency(to);
    if (src === dst) return amount;
    const fromRate = src === 'USD' ? 1 : rates[src];
    const toRate = dst === 'USD' ? 1 : rates[dst];
    if (!fromRate || !toRate) return null;
    return (amount / fromRate) * toRate;
}
