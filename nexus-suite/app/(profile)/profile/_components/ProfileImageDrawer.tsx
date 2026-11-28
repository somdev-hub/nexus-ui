'use client';

import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useProfileStore } from '@/store/profileStore';
import { useUserMetadata } from '@/hooks/use-user-metadata';

export function ProfileImageDrawer() {
    const { userId } = useUserMetadata();
    const isImageDrawerOpen = useProfileStore(
        (state) => state.isImageDrawerOpen
    );
    const setIsImageDrawerOpen = useProfileStore(
        (state) => state.setImageDrawerOpen
    );
    const avatarPreview = useProfileStore((state) => state.avatarPreview);
    const setAvatarPreview = useProfileStore((state) => state.setAvatarPreview);
    const uploadingAvatar = useProfileStore((state) => state.uploadingAvatar);
    const uploadAvatar = useProfileStore((state) => state.uploadAvatar);

    return (
        <>
            {/* Edit Profile Image Drawer */}
            <Drawer
                open={isImageDrawerOpen}
                onOpenChange={setIsImageDrawerOpen}
                direction="right"
            >
                <DrawerContent className="h-auto w-[calc(100%-2rem)] gap-0 rounded-xl border bg-background p-0 data-[swipe-direction=right]:inset-y-4 data-[swipe-direction=right]:right-4 data-[swipe-direction=right]:w-[calc(100%-2rem)] data-[swipe-direction=right]:sm:max-w-md">
                    <DrawerHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-sm">
                                <Camera className="size-4" />
                            </div>
                            <div className="grid gap-1">
                                <DrawerTitle className="text-lg tracking-tight">
                                    Edit Profile Image
                                </DrawerTitle>
                                <DrawerDescription>
                                    Upload a new profile picture.
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>
                    <DrawerClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4"
                            aria-label="Close profile image editor"
                        >
                            <X className="size-4" />
                        </Button>
                    </DrawerClose>
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="flex flex-col items-center gap-5">
                            <div className="relative">
                                <Image
                                    src={avatarPreview || ''}
                                    alt="Profile Image Preview"
                                    width={150}
                                    height={150}
                                    className="rounded-full aspect-square object-cover border border-border bg-muted shadow-sm"
                                />
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                        <Loader2 className="size-8 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="w-full space-y-2">
                                <Label htmlFor="avatar-upload">
                                    Choose an image
                                </Label>
                                <Input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        if (!file.type.startsWith('image/')) {
                                            return;
                                        }

                                        if (file.size > 5 * 1024 * 1024) {
                                            return;
                                        }

                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            setAvatarPreview(
                                                event.target?.result as string
                                            );
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                    className="h-10 cursor-pointer bg-background"
                                    disabled={uploadingAvatar}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Select an image file to preview it before
                                    saving.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DrawerFooter className="mt-0 flex-row justify-end border-t bg-muted/20 px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsImageDrawerOpen(false);
                                setAvatarPreview(null);
                            }}
                            disabled={uploadingAvatar}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const fileInput = document.getElementById(
                                    'avatar-upload'
                                ) as HTMLInputElement;
                                const file = fileInput?.files?.[0];
                                if (file && userId) {
                                    uploadAvatar(file, userId);
                                }
                            }}
                            disabled={uploadingAvatar || !avatarPreview}
                        >
                            {uploadingAvatar ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Save Image'
                            )}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
