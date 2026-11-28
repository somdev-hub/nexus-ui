'use client';

import { EditProfileDrawer } from './EditProfileDrawer';
import { ProfileImageDrawer } from './ProfileImageDrawer';
import { ChangePasswordDrawer } from './ChangePasswordDrawer';

export function ProfileDrawers() {
    return (
        <>
            <EditProfileDrawer />
            <ProfileImageDrawer />
            <ChangePasswordDrawer />
        </>
    );
}
