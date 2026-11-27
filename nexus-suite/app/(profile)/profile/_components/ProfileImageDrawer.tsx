'use client';

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, X } from 'lucide-react';
import Image from 'next/image';

export type ProfileImageDrawerProps = {
  displayAvatar: string;
  isImageDrawerOpen: boolean;
  setIsImageDrawerOpen: Dispatch<SetStateAction<boolean>>;
  avatarPreview: string | null;
  setAvatarPreview: Dispatch<SetStateAction<string | null>>;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUploadAvatar: () => Promise<void>;
  uploadingAvatar: boolean;
};

export function ProfileImageDrawer({
	displayAvatar,
	isImageDrawerOpen,
	setIsImageDrawerOpen,
	avatarPreview,
	setAvatarPreview,
	handleAvatarChange,
	handleUploadAvatar,
	uploadingAvatar,
}: ProfileImageDrawerProps) {
  return (
    <>
{/* Edit Profile Image Drawer */}
			<Drawer open={isImageDrawerOpen} onOpenChange={setIsImageDrawerOpen} direction="right">
				<DrawerContent className="h-auto w-[calc(100%-2rem)] gap-0 rounded-xl border bg-background p-0 data-[swipe-direction=right]:inset-y-4 data-[swipe-direction=right]:right-4 data-[swipe-direction=right]:w-[calc(100%-2rem)] data-[swipe-direction=right]:sm:max-w-md">
					<DrawerHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
						<div className="flex items-start gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-sm">
								<Camera className="size-4" />
							</div>
							<div className="grid gap-1">
								<DrawerTitle className="text-lg tracking-tight">Edit Profile Image</DrawerTitle>
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
									src={avatarPreview || displayAvatar}
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
								<Label htmlFor="avatar-upload">Choose an image</Label>
								<Input
									id="avatar-upload"
									type="file"
									accept="image/*"
									onChange={handleAvatarChange}
									className="h-10 cursor-pointer bg-background"
									disabled={uploadingAvatar}
								/>
								<p className="text-xs text-muted-foreground">Select an image file to preview it before saving.</p>
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
						<Button onClick={handleUploadAvatar} disabled={uploadingAvatar || !avatarPreview}>
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
