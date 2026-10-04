/** yyyy-mm-dd (or ISO timestamp) <-> Date helpers (local time, no UTC day-shift). */
export function parseYmd(value?: string | null): Date | undefined {
    if (!value) return undefined;
    // Accept full ISO timestamps by using just the date part.
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
        return undefined;
    return new Date(y, m - 1, d);
}

export function formatYmd(date: Date | undefined): string {
    if (!date) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
