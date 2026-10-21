'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import {
    cancelSuiteIntent,
    getMockReceipt,
    getSuiteIntentByRef,
    paySuiteIntent,
} from '@/lib/services/payments-service';
import { getBillingQuote } from '@/lib/services/billing-service';
import type {
    MockPaymentMethod,
    MockReceipt,
    SuiteIntent,
} from '@/types/payments';
import type { PayQuote } from '@/types/finances';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    CheckCircle2,
    CreditCard,
    FileText,
    Fingerprint,
    Landmark,
    Loader2,
    Lock,
    Receipt,
    ShieldCheck,
    Smartphone,
    Store,
    Timer,
    Wallet,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ReceiptDialog } from './receipt-dialog';

// ── validation (mirrors server-side SuitePaymentService) ──────

function luhnOk(digits: string): boolean {
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = digits.charCodeAt(i) - 48;
        if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
    }
    return sum % 10 === 0;
}

function isFutureExpiry(v: string): boolean {
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.trim());
    if (!m) return false;
    const yy = 2000 + Number(m[2]);
    const mm = Number(m[1]);
    const now = new Date();
    return (
        yy > now.getFullYear() ||
        (yy === now.getFullYear() && mm >= now.getMonth() + 1)
    );
}

const upiSchema = z.object({
    upiId: z
        .string()
        .trim()
        .min(3, 'Enter your UPI ID')
        .regex(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/, 'Invalid UPI ID (e.g. name@mock)'),
});

const cardSchema = z.object({
    cardHolderName: z.string().trim().min(2, 'Card holder name is required'),
    cardNumber: z
        .string()
        .trim()
        .min(13, 'Enter the full card number')
        .refine((v) => {
            const d = v.replace(/\D/g, '');
            return d.length >= 13 && d.length <= 19 && luhnOk(d);
        }, 'Enter a valid card number'),
    cardExpiry: z
        .string()
        .trim()
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY')
        .refine(isFutureExpiry, 'Card is expired'),
    cardCvv: z
        .string()
        .trim()
        .regex(/^\d{3,4}$/, 'CVV must be 3–4 digits'),
});

const bankSchema = z.object({
    bankHolderName: z.string().trim().min(2, 'Account holder name is required'),
    bankAccountNumber: z
        .string()
        .trim()
        .regex(/^\d{9,18}$/, 'Account number must be 9–18 digits'),
    bankIfsc: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC (e.g. HDFC0001234)'),
});

const netbankSchema = z.object({
    bank: z.string().trim().min(2, 'Select your bank'),
});

const walletSchema = z.object({
    provider: z.string().trim().min(2, 'Select a wallet'),
    walletId: z.string().trim().min(3, 'Enter wallet ID / linked phone'),
});

const BANKS = [
    'HDFC Bank',
    'ICICI Bank',
    'State Bank of India',
    'Axis Bank',
    'Kotak Mahindra',
];
const WALLETS = ['MockPay Wallet', 'Nexus Cash', 'SwiftPocket'];
const TRANSFER_RAILS = ['IMPS', 'NEFT', 'RTGS'] as const;

const METHODS: {
    id: MockPaymentMethod;
    label: string;
    hint: string;
    icon: typeof Smartphone;
}[] = [
    {
        id: 'UPI',
        label: 'UPI',
        hint: 'GPay / PhonePe · instant',
        icon: Smartphone,
    },
    {
        id: 'CARD',
        label: 'Card',
        hint: 'Visa · Mastercard · RuPay',
        icon: CreditCard,
    },
    {
        id: 'BANK_TRANSFER',
        label: 'Bank transfer',
        hint: 'IMPS · NEFT · RTGS',
        icon: Landmark,
    },
    {
        id: 'NET_BANKING',
        label: 'Netbanking',
        hint: 'All Indian banks',
        icon: Building2,
    },
    { id: 'WALLET', label: 'Wallet', hint: 'Linked wallets', icon: Wallet },
];

function cardBrand(num: string): string {
    const d = num.replace(/\D/g, '');
    if (/^4/.test(d)) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(d)) return 'MASTERCARD';
    if (/^3[47]/.test(d)) return 'AMEX';
    if (/^(60|65|81|82)/.test(d)) return 'RUPAY';
    return d ? 'CARD' : 'CARD';
}

function money(amount?: number | null, currency?: string): string {
    if (amount === undefined || amount === null) return '—';
    return `${currency ?? ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim();
}

// ── component ─────────────────────────────────────────────────

export function SuiteCheckout({
    payRef,
    onPaid,
}: {
    payRef: string;
    onPaid?: (intent: SuiteIntent) => void;
}) {
    const { name } = useUserMetadata();
    const [intent, setIntent] = useState<SuiteIntent | null>(null);
    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<MockPaymentMethod>('UPI');
    const [rail, setRail] = useState<'IMPS' | 'NEFT' | 'RTGS'>('IMPS');
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [receipt, setReceipt] = useState<MockReceipt | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [quote, setQuote] = useState<PayQuote | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
    const [backCountdown, setBackCountdown] = useState<number | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const upiForm = useForm<z.infer<typeof upiSchema>>({
        resolver: zodResolver(upiSchema),
        defaultValues: { upiId: 'retailer@mock' },
    });
    const cardForm = useForm<z.infer<typeof cardSchema>>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            cardHolderName: '',
            cardNumber: '4111 1111 1111 1111',
            cardExpiry: '',
            cardCvv: '',
        },
    });
    const bankForm = useForm<z.infer<typeof bankSchema>>({
        resolver: zodResolver(bankSchema),
        defaultValues: {
            bankHolderName: '',
            bankAccountNumber: '',
            bankIfsc: '',
        },
    });
    const netbankForm = useForm<z.infer<typeof netbankSchema>>({
        resolver: zodResolver(netbankSchema),
        defaultValues: { bank: 'HDFC Bank' },
    });
    const walletForm = useForm<z.infer<typeof walletSchema>>({
        resolver: zodResolver(walletSchema),
        defaultValues: { provider: 'MockPay Wallet', walletId: '' },
    });

    const cardNum = cardForm.watch('cardNumber') ?? '';
    const cardName = cardForm.watch('cardHolderName') ?? '';
    const cardExp = cardForm.watch('cardExpiry') ?? '';

    const stopPoll = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
    };

    const beginBackCountdown = () => {
        setBackCountdown((c) => (c === null ? 15 : c));
    };

    const load = useCallback(async () => {
        try {
            const it = await getSuiteIntentByRef(payRef);
            setIntent(it);
            if (it.intentKind === 'LOGISTICS_SETTLEMENT' || it.quoteRef) {
                try {
                    setQuote(await getBillingQuote(it.quoteRef as string));
                } catch {
                    // quote load best-effort; intent amount stays locked
                }
            }
            if (it.status === 'COMPLETED' && it.mockPaymentId) {
                beginBackCountdown();
                try {
                    setReceipt(await getMockReceipt(it.mockPaymentId));
                } catch {
                    // receipt best-effort
                }
            }
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : 'Invalid payment link'
            );
        } finally {
            setLoading(false);
        }
    }, [payRef]);

    useEffect(() => {
        load();
        return stopPoll;
    }, [load]);

    // expiry countdown ticker
    useEffect(() => {
        if (!intent || intent.status !== 'INITIATED' || !intent.expiresAt)
            return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [intent]);

    const poll = () => {
        stopPoll();
        let ticks = 0;
        pollRef.current = setInterval(async () => {
            ticks += 1;
            setProgress(Math.min(95, ticks * 12));
            try {
                const it = await getSuiteIntentByRef(payRef);
                setIntent(it);
                if (it.status === 'COMPLETED') {
                    stopPoll();
                    setProgress(100);
                    setBusy(false);
                    toast.success('Payment completed');
                    beginBackCountdown();
                    if (it.mockPaymentId) {
                        try {
                            setReceipt(await getMockReceipt(it.mockPaymentId));
                        } catch {
                            // ignore
                        }
                    }
                    onPaid?.(it);
                } else if (
                    it.status === 'FAILED' ||
                    it.status === 'EXPIRED' ||
                    it.status === 'CANCELLED'
                ) {
                    stopPoll();
                    setBusy(false);
                    if (it.status === 'FAILED')
                        toast.error(it.failureReason ?? 'Payment declined');
                }
            } catch (e) {
                if (ticks > 30) {
                    stopPoll();
                    setBusy(false);
                    toast.error(
                        e instanceof Error ? e.message : 'Polling failed'
                    );
                }
            }
        }, 2000);
    };

    const submit = async (payload: Record<string, string>) => {
        setBusy(true);
        setProgress(5);
        try {
            const it = await paySuiteIntent({
                ref: payRef,
                paymentMethod: method,
                payerName: name ?? undefined,
                ...payload,
            });
            setIntent(it);
            if (it.status === 'COMPLETED') {
                setBusy(false);
                setProgress(100);
                beginBackCountdown();
                onPaid?.(it);
            } else {
                toast.success('Payment submitted — settling…');
                poll();
            }
        } catch (e) {
            setBusy(false);
            toast.error(e instanceof Error ? e.message : 'Payment failed');
        }
    };

    const cancel = async () => {
        try {
            const it = await cancelSuiteIntent(payRef);
            setIntent(it);
            toast.success('Payment session cancelled');
            setCancelCountdown(5);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Cancel failed');
        }
    };

    // After a user-initiated cancel, count down and return to the
    // screen they came from (invoice list).
    useEffect(() => {
        if (cancelCountdown === null) return;
        if (cancelCountdown <= 0) {
            window.history.back();
            return;
        }
        const t = setTimeout(
            () => setCancelCountdown((c) => (c !== null ? c - 1 : c)),
            1000
        );
        return () => clearTimeout(t);
    }, [cancelCountdown]);

    // After success, linger on the success + receipt screen, then
    // return. No direct redirect.
    useEffect(() => {
        if (backCountdown === null) return;
        if (backCountdown <= 0) {
            window.history.back();
            return;
        }
        const t = setTimeout(
            () => setBackCountdown((c) => (c !== null ? c - 1 : c)),
            1000
        );
        return () => clearTimeout(t);
    }, [backCountdown]);

    if (loading)
        return (
            <div className="grid gap-6 lg:grid-cols-5">
                <Skeleton className="h-95 lg:col-span-2" />
                <Skeleton className="h-95 lg:col-span-3" />
            </div>
        );

    if (!intent)
        return (
            <Card className="mx-auto max-w-lg border-destructive/30">
                <CardContent className="grid gap-2 py-10 text-center">
                    <XCircle className="mx-auto h-10 w-10 text-destructive" />
                    <p className="font-semibold">Invalid payment link</p>
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                        This link is invalid or was tampered with. Ask the
                        invoice owner to generate a fresh Pay link.
                    </p>
                </CardContent>
            </Card>
        );

    const done = intent.status === 'COMPLETED';
    const failed = intent.status === 'FAILED';
    const dead = intent.status === 'CANCELLED' || intent.status === 'EXPIRED';
    const settling =
        busy ||
        intent.status === 'PROCESSING' ||
        (!!intent.mockPayment &&
            (intent.mockPayment.status === 'PROCESSING' ||
                intent.mockPayment.status === 'PENDING') &&
            !done &&
            !failed);

    const expiryMs = intent.expiresAt
        ? new Date(intent.expiresAt).getTime() - now
        : null;
    const expiryLabel =
        expiryMs === null
            ? null
            : expiryMs <= 0
              ? 'expired'
              : `${String(Math.floor(expiryMs / 60000)).padStart(2, '0')}:${String(Math.floor((expiryMs % 60000) / 1000)).padStart(2, '0')}`;

    const step = done ? 3 : 2;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Checkout</h1>
                    <p className="text-muted-foreground">
                        {quote
                            ? `Settlement ${quote.quoteRef}`
                            : intent.invoiceNumber
                              ? `Invoice ${intent.invoiceNumber}`
                              : `Payment session #${intent.intentId}`}{' '}
                        · {intent.payerRole ?? 'buyer'}
                    </p>
                </div>
                <ol className="flex items-center gap-1.5 text-xs">
                    {['Session', 'Payment', 'Done'].map((s, i) => {
                        const n = i + 1;
                        const active = n === step;
                        const past = n < step;
                        return (
                            <li key={s} className="flex items-center gap-1.5">
                                <span
                                    className={
                                        past
                                            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'
                                            : active
                                              ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'
                                              : 'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] text-muted-foreground'
                                    }
                                >
                                    {n}
                                </span>
                                <span
                                    className={
                                        active
                                            ? 'font-semibold'
                                            : 'text-muted-foreground'
                                    }
                                >
                                    {s}
                                </span>
                                {n < 3 && (
                                    <span className="mx-1 h-px w-4 bg-border" />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-5">
                {/* ── order summary ── */}
                <Card className="lg:col-span-2 p-4 gap-2">
                    <CardHeader className="p-0">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Store className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base">
                                    Nexus Supply Chain
                                </CardTitle>
                                <CardDescription>Order summary</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-1 text-sm p-0">
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Amount payable
                            </p>
                            <p className="mt-1 font-mono text-3xl font-bold tracking-tight">
                                {money(intent.amount, intent.currency)}
                            </p>
                        </div>
                        <div className="mt-2 grid gap-1">
                            {quote ? (
                                <>
                                    <SummaryRow
                                        icon={
                                            <FileText className="h-3.5 w-3.5" />
                                        }
                                        k="Quote"
                                        v={quote.quoteRef}
                                        mono
                                    />
                                    <SummaryRow
                                        k="Type"
                                        v={
                                            quote.kind === 'STATEMENT'
                                                ? 'Cycle statement'
                                                : 'Trip batch'
                                        }
                                    />
                                    <div className="mt-1 grid max-h-40 gap-0.5 overflow-y-auto rounded-md border p-2">
                                        {(quote.lines ?? []).map((l, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between py-0.5 text-xs"
                                            >
                                                <span className="text-muted-foreground">
                                                    {l.kind === 'BASE_TRIP'
                                                        ? `Trip ${l.shipmentId ?? ''}`
                                                        : l.kind === 'LATE_FEE'
                                                          ? `Late fee · trip ${l.shipmentId ?? ''}`
                                                          : 'Cycle penalty'}
                                                </span>
                                                <span className="font-mono">
                                                    {money(
                                                        l.quoted,
                                                        intent.currency
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <SummaryRow
                                        k="Base"
                                        v={money(
                                            quote.baseTotal,
                                            intent.currency
                                        )}
                                    />
                                    <SummaryRow
                                        k="Late fees"
                                        v={money(
                                            quote.feeTotal,
                                            intent.currency
                                        )}
                                    />
                                    <SummaryRow
                                        k="Penalties"
                                        v={money(
                                            quote.penaltyTotal,
                                            intent.currency
                                        )}
                                    />
                                </>
                            ) : (
                                <>
                                    <SummaryRow
                                        icon={
                                            <FileText className="h-3.5 w-3.5" />
                                        }
                                        k="Invoice"
                                        v={String(
                                            intent.invoiceNumber ??
                                                intent.invoiceId ??
                                                '—'
                                        )}
                                    />
                                    <SummaryRow
                                        k="Purchase order"
                                        v={String(
                                            intent.purchaseOrderId ?? '—'
                                        )}
                                    />
                                </>
                            )}
                            <SummaryRow k="Role" v={intent.payerRole ?? '—'} />
                            {intent.mockPayment && (
                                <SummaryRow
                                    k="Txn ref"
                                    v={intent.mockPayment.transactionReference}
                                    mono
                                />
                            )}
                            {intent.description && (
                                <p className="pt-1 text-xs text-muted-foreground">
                                    {intent.description}
                                </p>
                            )}
                        </div>
                        <Separator className="my-2" />
                        <div className="flex flex-wrap items-center gap-2">
                            {intent.status === 'INITIATED' && expiryLabel && (
                                <Badge
                                    variant={
                                        expiryMs !== null &&
                                        expiryMs < 5 * 60000
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    <Timer className="mr-1 h-3 w-3" />
                                    {expiryLabel} left
                                </Badge>
                            )}
                            <Badge variant="secondary">
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Buyer protection
                            </Badge>
                            <Badge variant="secondary">
                                <Fingerprint className="mr-1 h-3 w-3" />
                                Idempotent
                            </Badge>
                        </div>
                        <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                            session key · {intent.idempotencyKey}
                        </p>
                        {intent.status === 'INITIATED' && (
                            <button
                                onClick={cancel}
                                className="mt-1 justify-self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
                            >
                                Cancel this payment session
                            </button>
                        )}
                    </CardContent>
                </Card>

                {/* ── gateway ── */}
                <Card className="lg:col-span-3 p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Lock className="h-4 w-4" />
                            Payment method
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                            <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
                            Verified session · mock gateway, no real money moves
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {done ? (
                            <div className="grid gap-3 py-6 text-center">
                                <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
                                <p className="text-lg font-semibold">
                                    Payment successful
                                </p>
                                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                                    {money(intent.amount, intent.currency)} paid
                                    {intent.mockPayment?.receiptNo
                                        ? ` · receipt ${intent.mockPayment.receiptNo}`
                                        : ''}
                                    . The invoice ledger is being updated.
                                </p>
                                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                                    Redirecting you back to your previous screen
                                    {backCountdown !== null && backCountdown > 0
                                        ? ` in ${backCountdown}s…`
                                        : '…'}
                                </p>
                                <div className="mx-auto flex flex-wrap justify-center gap-2 pt-2">
                                    <Button
                                        onClick={() => setShowReceipt(true)}
                                        disabled={!receipt}
                                    >
                                        <Receipt className="mr-1.5 h-4 w-4" />
                                        View receipt
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                    >
                                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                                        Go back now
                                    </Button>
                                </div>
                            </div>
                        ) : dead ? (
                            <div className="grid gap-3 py-6 text-center">
                                <XCircle className="mx-auto h-14 w-14 text-destructive" />
                                <p className="text-lg font-semibold">
                                    Session {intent.status.toLowerCase()}
                                </p>
                                {intent.status === 'CANCELLED' ? (
                                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                                        Redirecting you back to your previous
                                        screen
                                        {cancelCountdown !== null &&
                                        cancelCountdown > 0
                                            ? ` in ${cancelCountdown}s…`
                                            : '…'}
                                    </p>
                                ) : (
                                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                                        Generate a fresh Pay link from the
                                        invoice to try again.
                                    </p>
                                )}
                                {intent.status === 'CANCELLED' && (
                                    <div className="mx-auto pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                window.history.back()
                                            }
                                        >
                                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                                            Go back now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                                {/* method rail */}
                                <div
                                    role="tablist"
                                    aria-label="Payment methods"
                                    className="grid content-start gap-2 sm:grid-cols-2 md:grid-cols-1"
                                >
                                    {METHODS.map((m) => {
                                        const Icon = m.icon;
                                        const active = method === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() => setMethod(m.id)}
                                                className={
                                                    active
                                                        ? 'flex items-center gap-2.5 rounded-lg border border-primary bg-accent p-3 text-left'
                                                        : 'flex items-center gap-2.5 rounded-lg border border-transparent p-3 text-left hover:border-border hover:bg-muted/50'
                                                }
                                            >
                                                <span
                                                    className={
                                                        active
                                                            ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground'
                                                            : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'
                                                    }
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </span>
                                                <span className="leading-tight">
                                                    <span className="block text-[13px] font-semibold">
                                                        {m.label}
                                                    </span>
                                                    <span className="block text-[11px] text-muted-foreground">
                                                        {m.hint}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* forms */}
                                <div className="min-w-0 rounded-lg border p-4">
                                    {settling && (
                                        <div className="mb-4 grid gap-2 rounded-md border bg-muted/50 p-3">
                                            <p className="flex items-center gap-2 text-xs font-semibold">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Confirming with your bank…
                                            </p>
                                            <Progress value={progress} />
                                            {intent.mockPayment && (
                                                <p className="font-mono text-[11px] text-muted-foreground">
                                                    {
                                                        intent.mockPayment
                                                            .transactionReference
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {failed && (
                                        <Alert
                                            variant="destructive"
                                            className="mb-4"
                                        >
                                            <AlertDescription>
                                                {intent.failureReason ??
                                                    'Payment declined.'}{' '}
                                                Fix the details and retry — the
                                                same link reuses the session, no
                                                double charge.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {method === 'UPI' && (
                                        <Form {...upiForm}>
                                            <form
                                                className="grid gap-3"
                                                onSubmit={upiForm.handleSubmit(
                                                    (v) =>
                                                        submit({
                                                            methodDetail:
                                                                v.upiId,
                                                        })
                                                )}
                                            >
                                                <FormField
                                                    control={upiForm.control}
                                                    name="upiId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                UPI ID
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="name@mock"
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[
                                                        'GPay',
                                                        'PhonePe',
                                                        'Paytm',
                                                        'BHIM',
                                                    ].map((a) => (
                                                        <Badge
                                                            key={a}
                                                            variant="secondary"
                                                            className="font-normal"
                                                        >
                                                            {a}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Use <b>fail@mock</b> to
                                                    simulate a decline.
                                                </p>
                                                <PayCTA
                                                    busy={busy}
                                                    amount={intent.amount}
                                                    currency={intent.currency}
                                                    retry={failed}
                                                />
                                            </form>
                                        </Form>
                                    )}

                                    {method === 'CARD' && (
                                        <Form {...cardForm}>
                                            <form
                                                className="grid gap-3"
                                                onSubmit={cardForm.handleSubmit(
                                                    (v) =>
                                                        submit({
                                                            cardHolderName:
                                                                v.cardHolderName,
                                                            cardNumber:
                                                                v.cardNumber,
                                                            cardExpiry:
                                                                v.cardExpiry,
                                                            cardCvv: v.cardCvv,
                                                        })
                                                )}
                                            >
                                                {/* live preview */}
                                                <div className="rounded-lg bg-primary p-4 text-primary-foreground">
                                                    <div className="flex items-center justify-between text-[11px] tracking-widest opacity-80">
                                                        <span>
                                                            DEBIT · CREDIT
                                                        </span>
                                                        <span className="font-bold">
                                                            {cardBrand(cardNum)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 font-mono text-lg tracking-[0.12em]">
                                                        {(
                                                            cardNum
                                                                .replace(
                                                                    /\D/g,
                                                                    ''
                                                                )
                                                                .padEnd(16, '•')
                                                                .match(
                                                                    /.{1,4}/g
                                                                ) ?? []
                                                        ).join(' ')}
                                                    </p>
                                                    <div className="mt-3 flex items-end justify-between text-xs">
                                                        <span className="max-w-[60%] truncate uppercase opacity-80">
                                                            {cardName ||
                                                                'CARD HOLDER'}
                                                        </span>
                                                        <span className="font-mono">
                                                            {cardExp || 'MM/YY'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <FormField
                                                    control={cardForm.control}
                                                    name="cardHolderName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Name on card
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={cardForm.control}
                                                    name="cardNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Card number
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    inputMode="numeric"
                                                                    placeholder="4111 1111 1111 1111"
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                    className="font-mono"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <FormField
                                                        control={
                                                            cardForm.control
                                                        }
                                                        name="cardExpiry"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Expiry
                                                                    (MM/YY)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="12/29"
                                                                        disabled={
                                                                            busy
                                                                        }
                                                                        className="font-mono"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={
                                                            cardForm.control
                                                        }
                                                        name="cardCvv"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    CVV
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        inputMode="numeric"
                                                                        type="password"
                                                                        maxLength={
                                                                            4
                                                                        }
                                                                        placeholder="•••"
                                                                        disabled={
                                                                            busy
                                                                        }
                                                                        className="font-mono"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Test{' '}
                                                    <b>4111 1111 1111 1111</b>{' '}
                                                    succeeds, <b>…0002</b>{' '}
                                                    declines. Test cards only.
                                                </p>
                                                <PayCTA
                                                    busy={busy}
                                                    amount={intent.amount}
                                                    currency={intent.currency}
                                                    retry={failed}
                                                />
                                            </form>
                                        </Form>
                                    )}

                                    {method === 'BANK_TRANSFER' && (
                                        <Form {...bankForm}>
                                            <form
                                                className="grid gap-3"
                                                onSubmit={bankForm.handleSubmit(
                                                    (v) =>
                                                        submit({
                                                            bankHolderName:
                                                                v.bankHolderName,
                                                            bankAccountNumber:
                                                                v.bankAccountNumber,
                                                            bankIfsc:
                                                                v.bankIfsc,
                                                        })
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {TRANSFER_RAILS.map((r) => (
                                                        <Button
                                                            key={r}
                                                            type="button"
                                                            size="sm"
                                                            variant={
                                                                rail === r
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            onClick={() =>
                                                                setRail(r)
                                                            }
                                                        >
                                                            {r}
                                                        </Button>
                                                    ))}
                                                    <span className="ml-auto text-[11px] text-muted-foreground">
                                                        via {rail}
                                                    </span>
                                                </div>
                                                <FormField
                                                    control={bankForm.control}
                                                    name="bankHolderName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Account holder
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={bankForm.control}
                                                    name="bankAccountNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Account number
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    inputMode="numeric"
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                    className="font-mono"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={bankForm.control}
                                                    name="bankIfsc"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                IFSC
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="HDFC0001234"
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                    className="font-mono uppercase"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <PayCTA
                                                    busy={busy}
                                                    amount={intent.amount}
                                                    currency={intent.currency}
                                                    retry={failed}
                                                />
                                            </form>
                                        </Form>
                                    )}

                                    {method === 'NET_BANKING' && (
                                        <Form {...netbankForm}>
                                            <form
                                                className="grid gap-3"
                                                onSubmit={netbankForm.handleSubmit(
                                                    (v) =>
                                                        submit({
                                                            methodDetail:
                                                                v.bank,
                                                        })
                                                )}
                                            >
                                                <FormField
                                                    control={
                                                        netbankForm.control
                                                    }
                                                    name="bank"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Select your bank
                                                            </FormLabel>
                                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                                {BANKS.map(
                                                                    (b) => (
                                                                        <button
                                                                            key={
                                                                                b
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                                field.onChange(
                                                                                    b
                                                                                )
                                                                            }
                                                                            className={
                                                                                field.value ===
                                                                                b
                                                                                    ? 'rounded-lg border border-primary bg-accent p-3 text-left text-xs font-semibold'
                                                                                    : 'rounded-lg border p-3 text-left text-xs font-medium text-muted-foreground hover:border-muted-foreground/40'
                                                                            }
                                                                        >
                                                                            <Building2 className="mb-1.5 h-4 w-4" />
                                                                            {b}
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <PayCTA
                                                    busy={busy}
                                                    amount={intent.amount}
                                                    currency={intent.currency}
                                                    retry={failed}
                                                />
                                            </form>
                                        </Form>
                                    )}

                                    {method === 'WALLET' && (
                                        <Form {...walletForm}>
                                            <form
                                                className="grid gap-3"
                                                onSubmit={walletForm.handleSubmit(
                                                    (v) =>
                                                        submit({
                                                            methodDetail: `${v.provider} · ${v.walletId}`,
                                                        })
                                                )}
                                            >
                                                <FormField
                                                    control={walletForm.control}
                                                    name="provider"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Wallet
                                                            </FormLabel>
                                                            <Select
                                                                value={
                                                                    field.value
                                                                }
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                disabled={busy}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {WALLETS.map(
                                                                        (w) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    w
                                                                                }
                                                                                value={
                                                                                    w
                                                                                }
                                                                            >
                                                                                {
                                                                                    w
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={walletForm.control}
                                                    name="walletId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Wallet ID /
                                                                phone
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <PayCTA
                                                    busy={busy}
                                                    amount={intent.amount}
                                                    currency={intent.currency}
                                                    retry={failed}
                                                />
                                            </form>
                                        </Form>
                                    )}

                                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                                        <Lock className="h-3 w-3" />
                                        Card data is validated locally — only
                                        masked references are stored.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ReceiptDialog
                receipt={receipt}
                open={showReceipt}
                onOpenChange={setShowReceipt}
            />
        </div>
    );
}

function SummaryRow({
    k,
    v,
    mono,
    icon,
}: {
    k: string;
    v: string;
    mono?: boolean;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-2 py-0.5 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                {k}
            </span>
            <span
                className={
                    mono
                        ? 'max-w-[55%] truncate font-mono text-xs font-medium'
                        : 'font-medium'
                }
            >
                {v}
            </span>
        </div>
    );
}

function PayCTA({
    busy,
    amount,
    currency,
    retry,
}: {
    busy: boolean;
    amount: number;
    currency: string;
    retry?: boolean;
}) {
    return (
        <div className="flex justify-end pt-1">
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                {busy ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing securely…
                    </>
                ) : (
                    <>
                        <Lock className="mr-2 h-4 w-4" />
                        {retry ? 'Retry ' : 'Pay '}
                        {currency} {Number(amount).toLocaleString()}
                    </>
                )}
            </Button>
        </div>
    );
}
