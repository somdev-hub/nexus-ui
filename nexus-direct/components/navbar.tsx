import React from 'react'
import { Card, CardContent } from './ui/card';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from './ui/navigation-menu';
import Link from 'next/dist/client/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import Image from "next/image";
import { House, LogOut, UserPlus, UserRound } from 'lucide-react';

const Navbar = () => {
    return (
        <div>
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
                                    <Link href="/blog"><UserPlus />Recruitment</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenu>
                    </div>
                    <div className=" flex items-center justify-end">
                        <Popover>
                            <PopoverTrigger>
                                <Avatar className="cursor-pointer">
                                    <AvatarImage
                                        src="https://github.com/shadcn.png"
                                        alt="@shadcn"
                                        className="grayscale"
                                    />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                            </PopoverTrigger>
                            <PopoverContent align="end">
                                <div className="flex gap-2 items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-full overflow-hidden">
                                            <Image
                                                src="https://github.com/shadcn.png"
                                                alt="@shadcn"
                                                width={40}
                                                height={40}
                                            />
                                        </div>
                                        <div className="ml-2">
                                            <p className="font-semibold">Ariel</p>
                                            <p className="text-sm text-gray-500">
                                                ariel@example.com
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
                                    <Button variant="destructive">
                                        <LogOut />Log out</Button>
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