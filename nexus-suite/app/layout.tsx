import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { CurrencySync } from '@/components/currency-sync';
import { Toaster } from '@/components/ui/sonner';
import { THEME_INIT_SCRIPT } from '@/lib/theme/storage';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Nexus Suite',
    description: 'Enterprise management platform',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <script
                    dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
                />
                <AuthProvider>
                    <ThemeProvider>
                        <CurrencySync />
                        {children}
                    </ThemeProvider>
                </AuthProvider>
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
