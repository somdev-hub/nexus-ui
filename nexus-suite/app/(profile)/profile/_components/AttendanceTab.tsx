'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { UserProfile } from '@/lib/services/user-profile-service';
import { AttendanceCalendar } from './AttendanceCalendar';

type AttendanceTabProps = { profile: UserProfile };

export function AttendanceTab({ profile }: AttendanceTabProps) {
    return (
        <TabsContent value="attendance" className="mt-6 space-y-6">
            {profile.attendanceRecords &&
            profile.attendanceRecords.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Attendance Summary */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0">
                                <CardTitle>This Month</CardTitle>
                                <CardDescription>
                                    Attendance summary for the current month.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4">
                                <div className="space-y-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Total Days
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {profile.attendanceRecords.length}
                                    </p>
                                </div>
                                <div className="space-y-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Present Days
                                    </p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {
                                            profile.attendanceRecords.filter(
                                                (r) => r.status === 'PRESENT'
                                            ).length
                                        }
                                    </p>
                                </div>
                                <div className="space-y-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Total Hours
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {profile.attendanceRecords
                                            .reduce(
                                                (sum, r) =>
                                                    sum + (r.hoursWorked || 0),
                                                0
                                            )
                                            .toFixed(1)}
                                        h
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance Calendar */}
                    <div className="lg:col-span-8">
                        <Card className="p-4 gap-2">
                            <CardHeader className="p-0 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Attendance Calendar</CardTitle>
                                    <CardDescription>
                                        View your attendance by date.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <AttendanceCalendar
                                    records={profile.attendanceRecords}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="lg:col-span-12">
                    <Card className="p-4 gap-2">
                        <CardContent className="p-0 text-center">
                            <p className="text-muted-foreground">
                                No attendance records available.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </TabsContent>
    );
}
