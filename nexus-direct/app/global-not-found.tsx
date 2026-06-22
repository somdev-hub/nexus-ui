import { Card, CardContent } from '@/components/ui/card';
import { Metadata } from 'next';
import "./globals.css"
import React from 'react'
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { House } from 'lucide-react';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
}

const GlobalNotFound = () => {
    return (
        <html lang="en" className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}>
            <body className="min-h-full flex flex-col items-center justify-center p-0 m-0 bg-gray-50">
                <Card className="p-4 gap-2 w-1/2 mx-auto mt-20">
                    <CardContent className="p-0">
                        <section className="bg-white dark:bg-gray-900">
                            <div className="py-8 px-4 mx-auto max-w-7xl lg:py-16 lg:px-6">
                                <div className="mx-auto max-w-screen-sm text-center">
                                    <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">404</h1>
                                    <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">Something&apos;s missing.</p>
                                    <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">Sorry, we can&apos;t find that page. You&apos;ll find lots to explore on the home page. </p>
                                    <Link href="/">
                                        <Button className="h-12 cursor-pointer"><House />Back to Homepage</Button>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </CardContent>
                </Card>
            </body>
        </html>
    )
}

export default GlobalNotFound