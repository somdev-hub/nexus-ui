/** yyyy-mm-dd <-> Date helpers (local time, no UTC day-shift). */
export function parseYmd(value?: string | null): Date | undefined {
    if (!value) return undefined;
    const [y, m, d] = value.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
        return undefined;
    return new Date(y, m - 1, d);
}

export function formatYmd(date: Date | undefined): string {
    if (!date) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
