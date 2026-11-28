'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Cake,
    Briefcase,
    Shield,
} from 'lucide-react';
import type { UserProfile } from '@/lib/services/user-profile-service';
import { formatDate, GENDER_OPTIONS } from './profile-utils';

type ProfileDataTabProps = {
    profile: UserProfile;
    displayEmail: string;
    displayPhone: string;
    displayRole: string;
    displayOrgType: string;
    displayDefaultCurrency: string;
};

export function ProfileDataTab({
    profile,
    displayEmail,
    displayPhone,
    displayRole,
    displayOrgType,
    displayDefaultCurrency,
}: ProfileDataTabProps) {
    return (
        <TabsContent value="profile" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left column: Personal Information */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Your personal details and contact information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">
                                    {displayEmail}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">
                                    {displayPhone}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">
                                    {profile.address || '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Cake className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">
                                    {formatDate(profile.dateOfBirth)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">
                                    Joined: {formatDate(profile.createdAt)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="p-4 gap-2">
                        <CardHeader className="p-0">
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>
                                Your account and organizational information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Role
                                    </p>
                                    <p className="text-sm font-medium">
                                        {displayRole}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Organization Type
                                    </p>
                                    <p className="text-sm font-medium">
                                        {displayOrgType}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Default Currency
                                    </p>
                                    <p className="text-sm font-medium">
                                        {displayDefaultCurrency}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Gender
                                    </p>
                                    <p className="text-sm font-medium">
                                        {profile.gender
                                            ? GENDER_OPTIONS.find(
                                                  (g) =>
                                                      g.value === profile.gender
                                              )?.label || profile.gender
                                            : '—'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Date of Birth
                                    </p>
                                    <p className="text-sm font-medium">
                                        {formatDate(profile.dateOfBirth)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Age
                                    </p>
                                    <p className="text-sm font-medium">
                                        {profile.age || '—'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        User ID
                                    </p>
                                    <p className="text-sm font-medium font-mono">
                                        {profile.id || '—'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Organization ID
                                    </p>
                                    <p className="text-sm font-medium font-mono">
                                        {profile.orgId || '—'}
                                    </p>
                                </div>
                            </div>
                            {profile.notes && (
                                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Notes
                                    </p>
                                    <p className="text-sm font-medium">
                                        {profile.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: Positions Held & HR Documents */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Positions Held */}
                    {profile.positionsHeld &&
                        profile.positionsHeld.length > 0 && (
                            <Card className="p-4 gap-2">
                                <CardHeader className="p-0 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            Positions Held
                                        </CardTitle>
                                        <CardDescription>
                                            Your previous and current positions.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 space-y-3">
                                    {profile.positionsHeld.map((pos, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                                        >
                                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                                <Briefcase className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    {pos.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {pos.department}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {pos.fromDate
                                                        ? new Date(
                                                              pos.fromDate
                                                          ).toLocaleDateString()
                                                        : '—'}{' '}
                                                    -{' '}
                                                    {pos.toDate
                                                        ? new Date(
                                                              pos.toDate
                                                          ).toLocaleDateString()
                                                        : 'Present'}
                                                    {pos.duration
                                                        ? ' (' +
                                                          pos.duration.toFixed(
                                                              1
                                                          ) +
                                                          ' months)'
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                    {/* HR Documents */}
                    {profile.hrDocuments && profile.hrDocuments.length > 0 && (
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        HR Documents
                                    </CardTitle>
                                    <CardDescription>
                                        Your uploaded HR documents.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 space-y-2">
                                {profile.hrDocuments.map((doc, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {doc.documentName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {doc.documentType}
                                            </p>
                                        </div>
                                        {doc.documentUrl && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={doc.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    View
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty state when no positions or documents */}
                    {(!profile.positionsHeld ||
                        profile.positionsHeld.length === 0) &&
                        (!profile.hrDocuments ||
                            profile.hrDocuments.length === 0) && (
                            <Card className="p-4 gap-2">
                                <CardContent className="p-0 text-center">
                                    <p className="text-muted-foreground">
                                        No additional records available.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                </div>
            </div>
        </TabsContent>
    );
}
