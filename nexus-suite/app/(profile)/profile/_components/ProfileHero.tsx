'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Camera, Edit, LogOut } from 'lucide-react';
import Image from 'next/image';
import { getInitials } from './profile-utils';

type ProfileHeroProps = {
    avatar: string;
    displayName: string;
    displayRole: string;
    displayDepartment: string;
    displayOrgName: string;
    displayOrgType: string;
    onEditProfile: () => void;
    onLogout: () => void;
    onEditAvatar: () => void;
};

export function ProfileHero({
    avatar,
    displayName,
    displayRole,
    displayDepartment,
    displayOrgName,
    displayOrgType,
    onEditProfile,
    onLogout,
    onEditAvatar,
}: ProfileHeroProps) {
    return (
        <>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Profile
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your account information and preferences.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={onEditProfile}>
                        <Edit className="mr-2 size-4" />
                        Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={onLogout}>
                        <LogOut className="mr-2 size-4" />
                        Log Out
                    </Button>
                </div>
            </div>
            <Card className="mb-4 p-4 gap-2">
                <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
                        <div className="relative mb-4 shrink-0 lg:mb-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute bottom-0 right-0 z-10 bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={onEditAvatar}
                            >
                                <Camera className="size-4" />
                                <span className="sr-only">
                                    Change profile picture
                                </span>
                            </Button>
                            <div className="relative inline-block">
                                <Image
                                    src={avatar}
                                    alt="Profile Image"
                                    width={120}
                                    height={120}
                                    className="aspect-square rounded-full border border-border bg-muted object-cover"
                                    priority
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="mb-2 flex items-baseline gap-2">
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {displayName}
                                </h2>
                                <Badge variant="outline" className="ml-2">
                                    {getInitials(displayName)}
                                </Badge>
                            </div>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {displayRole}
                            </p>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Department
                                    </p>
                                    <p className="text-sm font-medium">
                                        {displayDepartment}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Organization
                                    </p>
                                    <p className="text-sm font-medium">
                                        {displayOrgName}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Org Type
                                    </p>
                                    <p className="text-sm font-medium">
                                        {displayOrgType}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
