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
import { CheckCircle2, Eye, EyeOff, Shield, X } from 'lucide-react';
import { useProfileStore } from '@/store/profileStore';

export function ChangePasswordDrawer() {
    const isPasswordDrawerOpen = useProfileStore(
        (state) => state.isPasswordDrawerOpen
    );
    const setIsPasswordDrawerOpen = useProfileStore(
        (state) => state.setPasswordDrawerOpen
    );
    const passwordForm = useProfileStore((state) => state.passwordForm);
    const setPasswordForm = useProfileStore((state) => state.setPasswordForm);
    const showCurrentPassword = useProfileStore(
        (state) => state.showCurrentPassword
    );
    const setShowCurrentPassword = useProfileStore(
        (state) => state.setShowCurrentPassword
    );
    const showNewPassword = useProfileStore((state) => state.showNewPassword);
    const setShowNewPassword = useProfileStore(
        (state) => state.setShowNewPassword
    );
    const showConfirmPassword = useProfileStore(
        (state) => state.showConfirmPassword
    );
    const setShowConfirmPassword = useProfileStore(
        (state) => state.setShowConfirmPassword
    );
    const changePassword = useProfileStore((state) => state.changePassword);
    const resetPasswordForm = useProfileStore(
        (state) => state.resetPasswordForm
    );

    return (
        <>
            {/* Change Password Drawer */}
            <Drawer
                open={isPasswordDrawerOpen}
                onOpenChange={setIsPasswordDrawerOpen}
                direction="right"
            >
                <DrawerContent className="h-auto w-[calc(100%-2rem)] gap-0 rounded-xl border bg-background p-0 data-[swipe-direction=right]:inset-y-4 data-[swipe-direction=right]:right-4 data-[swipe-direction=right]:w-[calc(100%-2rem)] data-[swipe-direction=right]:sm:max-w-lg">
                    <DrawerHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-sm">
                                <Shield className="size-4" />
                            </div>
                            <div className="grid gap-1">
                                <DrawerTitle className="text-lg tracking-tight">
                                    Change Password
                                </DrawerTitle>
                                <DrawerDescription>
                                    Enter your current password and new password
                                    to update your credentials.
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>
                    <DrawerClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4"
                            aria-label="Close password editor"
                        >
                            <X className="size-4" />
                        </Button>
                    </DrawerClose>
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current-password">
                                Current Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="current-password"
                                    type={
                                        showCurrentPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={passwordForm.currentPassword}
                                    onChange={(e) =>
                                        setPasswordForm('currentPassword', e.target.value)
                                    }
                                    placeholder="Enter current password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() =>
                                        setShowCurrentPassword(
                                            !showCurrentPassword
                                        )
                                    }
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={passwordForm.newPassword}
                                    onChange={(e) =>
                                        setPasswordForm('newPassword', e.target.value)
                                    }
                                    placeholder="Enter new password (min 8 characters)"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() =>
                                        setShowNewPassword(!showNewPassword)
                                    }
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordForm('confirmPassword', e.target.value)
                                    }
                                    placeholder="Confirm new password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DrawerFooter className="mt-0 flex-row justify-end border-t bg-muted/20 px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsPasswordDrawerOpen(false);
                                resetPasswordForm();
                                setShowCurrentPassword(false);
                                setShowNewPassword(false);
                                setShowConfirmPassword(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={changePassword}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Update Password
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
