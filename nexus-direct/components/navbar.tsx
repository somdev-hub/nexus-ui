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
import { logout } from '@/lib/auth-service';
import { Spinner } from './ui/spinner';
import { useToast } from '@/hooks/use-toast';

const Navbar = () => {
    const { personalEmail, name, avatar } = useUserMetadata();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

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
                                            <p className="font-semibold">{name || "Ariel"}</p>
                                            <p className="text-sm text-gray-500">
                                                {personalEmail || "ariel@example.com"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className=" flex flex-col gap-2 w-full">
                                    <Link href="/profile" className="flex">
                                        <Button variant="outline" className="w-full">
                                            <UserRound /> Profile
                                        </Button>
                                    </Link>
                                    <Button variant="destructive" onClick={handleLogout} disabled={loading}>
                                        {loading ? <Spinner /> : <LogOut />} Log out
                                    </Button>
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