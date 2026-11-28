'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, Clock, ClipboardList } from 'lucide-react';
import type { UserProfile } from '@/lib/services/user-profile-service';
import { ProfileDataTab } from './ProfileDataTab';
import { CompensationTab } from './CompensationTab';
import { AttendanceTab } from './AttendanceTab';
import { LeaveTab } from './LeaveTab';

type ProfileTabsProps = {
    profile: UserProfile;
    displayEmail: string;
    displayPhone: string;
    displayRole: string;
    displayOrgType: string;
    displayDefaultCurrency: string;
};

export function ProfileTabs({
    profile,
    displayEmail,
    displayPhone,
    displayRole,
    displayOrgType,
    displayDefaultCurrency,
}: ProfileTabsProps) {
    return (
        <Tabs defaultValue="profile">
            <TabsList className="w-full">
                <TabsTrigger value="profile" className="flex-1">
                    <Users className="w-4 h-4 mr-2" />
                    Profile Data
                </TabsTrigger>
                <TabsTrigger value="compensation" className="flex-1">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Compensation Data
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex-1">
                    <Clock className="w-4 h-4 mr-2" />
                    Attendance Data
                </TabsTrigger>
                <TabsTrigger value="leave" className="flex-1">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Leave Data
                </TabsTrigger>
            </TabsList>
            <ProfileDataTab
                profile={profile}
                displayEmail={displayEmail}
                displayPhone={displayPhone}
                displayRole={displayRole}
                displayOrgType={displayOrgType}
                displayDefaultCurrency={displayDefaultCurrency}
            />
            <CompensationTab profile={profile} />
            <AttendanceTab profile={profile} />
            <LeaveTab profile={profile} />
        </Tabs>
    );
}
