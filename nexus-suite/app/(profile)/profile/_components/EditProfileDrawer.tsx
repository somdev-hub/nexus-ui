'use client';

import type { Dispatch, SetStateAction } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { Edit, Loader2, X } from 'lucide-react';
import type { UpdateProfileRequest } from '@/lib/services/user-profile-service';
import { GENDER_OPTIONS } from './profile-utils';

function toLocalDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return undefined;

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
        ? date
        : undefined;
}

function toDateValue(date: Date | undefined): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export type EditProfileDrawerProps = {
    isEditDrawerOpen: boolean;
    setIsEditDrawerOpen: Dispatch<SetStateAction<boolean>>;
    editForm: UpdateProfileRequest;
    handleEditChange: (
        field: keyof UpdateProfileRequest,
        value: string
    ) => void;
    handleSaveProfile: () => Promise<void>;
    saving: boolean;
};

export function EditProfileDrawer({
    isEditDrawerOpen,
    setIsEditDrawerOpen,
    editForm,
    handleEditChange,
    handleSaveProfile,
    saving,
}: EditProfileDrawerProps) {
    return (
        <>
            {/* Edit Profile Drawer */}
            <Drawer
                open={isEditDrawerOpen}
                onOpenChange={setIsEditDrawerOpen}
                direction="right"
            >
                <DrawerContent className="h-auto w-[calc(100%-2rem)] gap-0 rounded-xl border bg-background p-0 data-[swipe-direction=right]:inset-y-4 data-[swipe-direction=right]:right-4 data-[swipe-direction=right]:w-[calc(100%-2rem)] data-[swipe-direction=right]:sm:max-w-xl">
                    <DrawerHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-sm">
                                <Edit className="size-4" />
                            </div>
                            <div className="grid gap-1">
                                <DrawerTitle className="text-lg tracking-tight">
                                    Edit Profile
                                </DrawerTitle>
                                <DrawerDescription>
                                    Keep your personal details up to date.
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>
                    <DrawerClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4"
                            aria-label="Close edit profile"
                        >
                            <X className="size-4" />
                        </Button>
                    </DrawerClose>
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                        <section
                            aria-labelledby="edit-profile-details-heading"
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <h3
                                    id="edit-profile-details-heading"
                                    className="text-sm font-semibold"
                                >
                                    Personal details
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Basic information used on your profile.
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        className="h-10 bg-background"
                                        value={editForm.name}
                                        onChange={(e) =>
                                            handleEditChange(
                                                'name',
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Jane Doe"
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            className="h-10 bg-background"
                                            value={editForm.phone}
                                            onChange={(e) =>
                                                handleEditChange(
                                                    'phone',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g. +91 98765 43210"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="personalEmail">
                                            Personal Email
                                        </Label>
                                        <Input
                                            id="personalEmail"
                                            type="email"
                                            className="h-10 bg-background"
                                            value={editForm.personalEmail}
                                            onChange={(e) =>
                                                handleEditChange(
                                                    'personalEmail',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g. personal@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select
                                            value={editForm.gender}
                                            onValueChange={(v) =>
                                                handleEditChange('gender', v)
                                            }
                                        >
                                            <SelectTrigger
                                                id="gender"
                                                className="h-10 bg-background w-full"
                                            >
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GENDER_OPTIONS.map((g) => (
                                                    <SelectItem
                                                        key={g.value}
                                                        value={g.value}
                                                    >
                                                        {g.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="dateOfBirth">
                                            Date of Birth
                                        </Label>
                                        <DatePicker
                                            id="dateOfBirth"
                                            date={toLocalDate(
                                                editForm.dateOfBirth
                                            )}
                                            onDateChange={(date) =>
                                                handleEditChange(
                                                    'dateOfBirth',
                                                    toDateValue(date)
                                                )
                                            }
                                            allowPast
                                            startMonth={new Date(1900, 0)}
                                            placeholder="Select date of birth"
                                            className="h-10 bg-background"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        <section
                            aria-labelledby="edit-profile-address-heading"
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <h3
                                    id="edit-profile-address-heading"
                                    className="text-sm font-semibold"
                                >
                                    Address
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Add the location you want associated with
                                    your profile.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Location</Label>
                                <Input
                                    id="address"
                                    className="h-10 bg-background"
                                    value={editForm.address}
                                    onChange={(e) =>
                                        handleEditChange(
                                            'address',
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Bangalore, India"
                                />
                            </div>
                        </section>
                    </div>
                    <DrawerFooter className="mt-0 flex-row justify-end border-t bg-muted/20 px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDrawerOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save changes'
                            )}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
