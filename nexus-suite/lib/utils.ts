import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getImageUrl(imageUrl: string | null): string | null {
    if (imageUrl) {
        return imageUrl;
    }
    return null;
}

export function formatCurrency(
    value: number,
    currency: string = 'INR'
): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(value);
}

export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}

// ─────────────────────────────────────────────────────────────
// Number-input parsing helpers for react-hook-form + zod forms.
//
// Raw <input type="number"> values are strings. A truthy-but-unparsable
// value (stray space, "-", pasted text) makes parseInt/parseFloat return
// NaN, which sticks in form state and fails `z.number()` validation
// ("expected number, received NaN") — or worse, serializes as null.
// These helpers normalize: blank/unparsable → fallback (undefined for
// optional fields, preserving optionality).
// ─────────────────────────────────────────────────────────────

/** Parse an optional integer input. Blank/unparsable → undefined. */
export function parseOptionalInt(raw: string): number | undefined {
    const value = raw.trim();
    if (!value) return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
}

/** Parse an optional decimal input. Blank/unparsable → undefined. */
export function parseOptionalFloat(raw: string): number | undefined {
    const value = raw.trim();
    if (!value) return undefined;
    const n = parseFloat(value);
    return Number.isNaN(n) ? undefined : n;
}

/** Parse a required numeric input. Blank/unparsable → fallback. */
export function parseRequiredNumber(
    raw: string,
    parse: (v: string) => number,
    fallback: number
): number {
    const value = raw.trim();
    if (!value) return fallback;
    const n = parse(value);
    return Number.isNaN(n) ? fallback : n;
}
