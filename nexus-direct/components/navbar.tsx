"use client"

import React from 'react'
import { Card, CardContent } from './ui/card';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from './ui/navigation-menu';
import Link from 'next/dist/client/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import Image from "next/image";
import { House, LogOut, UserPlus, UserRound } from 'lucide-react';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth-service';
import { Spinner } from './ui/spinner';
import { useToast } from '@/hooks/use-toast';

// Public paths that should not show the full navbar
const publicPaths = ["/public/", "/login", "/signup"];

const Navbar = () => {
    const { personalEmail, name, avatar, isAuthenticated, isLoading } = useUserMetadata();
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    // Check if current path is a public path
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    const handleLogout = async () => {
        try {
            setLoading(true);
            await logout();
            toast({
                title: "Logout successful",
                description: "Redirecting to login page...",
                variant: "success"
            });
            router.push("/login");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to logout.",
                variant: "destructive"
            });
            console.error("Logout failed:", error);
        }
        finally {
            setLoading(false);
        }
    };

    // Show loading skeleton while auth is being checked
    if (isLoading) {
        return (
            <div className="w-full border-b fixed top-0 z-50 bg-white">
                <Card className="w-full rounded-none border-b">
                    <CardContent className="flex items-center h-16">
                        <div className="animate-pulse">
                            <div className="h-6 w-24 bg-gray-200 rounded" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // For public paths, show minimal header
    if (isPublicPath) {
        return (
            <div className="w-full border-b fixed top-0 z-50 bg-white">
                <Card className="w-full rounded-none border-b">
                    <CardContent className="flex items-center justify-between h-16 px-4">
                        <h3 className="text-lg font-bold">Nexus Corp.</h3>
                        <div className="flex items-center gap-3">
                            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                                Sign In
                            </Link>
                            <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
                                Get Started
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full border-b fixed top-0 z-50 bg-white">
            <Card className="w-full rounded-none border-b">
                <CardContent className="flex items-center">
                    <div className="p-2 flex items-center justify-start">
                        <h3 className="text-lg font-bold">Nexus Corp.</h3>
                    </div>
                    <div className=" p-2 flex items-center justify-center flex-1">
                        <NavigationMenu>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/"><House />Home</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/recruitment"><UserPlus />Recruitment</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenu>
                    </div>
                    <div className=" flex items-center justify-end">
                        <Popover>
                            <PopoverTrigger>
                                <Avatar className="cursor-pointer">
                                    <AvatarImage
                                        src={avatar != null && avatar != "" ? avatar : "https://github.com/shadcn.png"}
                                        alt={name || "@shadcn"}
                                        className="grayscale"
                                    />
                                    <AvatarFallback>{name ? name.charAt(0) : "CN"}</AvatarFallback>
                                </Avatar>
                            </PopoverTrigger>
                            <PopoverContent align="end">
                                <div className="flex gap-2 items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-full overflow-hidden">
                                            <Image
                                                src={avatar != null && avatar != "" ? avatar : "https://github.com/shadcn.png"}
                                                alt={name || "@shadcn"}
                                                width={40}
                                                height={40}
                                            />
                                        </div>
                                        <div className="ml-2">
                                            <p className="font-semibold">{name || "Guest"}</p>
                                            <p className="text-sm text-gray-500">
                                                {personalEmail || (isAuthenticated ? "ariel@example.com" : "Not signed in")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className=" flex flex-col gap-2 w-full">
                                    {isAuthenticated ? (
                                        <>
                                            <Link href="/profile" className="flex">
                                                <Button variant="outline" className="w-full">
                                                    <UserRound /> Profile
                                                </Button>
                                            </Link>
                                            <Button variant="destructive" onClick={handleLogout} disabled={loading}>
                                                {loading ? <Spinner /> : <LogOut />} Log out
                                            </Button>
                                        </>
                                    ) : (
                                        <Link href="/login" className="flex">
                                            <Button variant="primary" className="w-full">
                                                <LogOut /> Sign In
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default Navbar