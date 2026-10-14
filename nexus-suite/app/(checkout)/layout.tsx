import { Lock } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            {/* top bar */}
            <header className="border-b bg-background">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                            N
                        </span>
                        <span className="leading-tight">
                            <span className="block text-sm font-semibold">
                                Nexus Pay
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                Secure checkout
                            </span>
                        </span>
                    </Link>
                    <span className="flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        256-bit encrypted
                    </span>
                </div>
            </header>

            {/* content */}
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                {children}
            </main>

            {/* footer */}
            <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-6 text-xs text-muted-foreground sm:px-6">
                <span>Mock gateway — no real money moves</span>
                <span className="hidden h-3 w-px bg-border sm:block" />
                <span>UPI · Cards · Netbanking · Bank transfer · Wallets</span>
            </footer>
        </div>
    );
}
