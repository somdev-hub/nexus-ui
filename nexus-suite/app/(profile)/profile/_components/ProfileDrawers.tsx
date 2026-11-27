'use client';

import type { EditProfileDrawerProps } from './EditProfileDrawer';
import { EditProfileDrawer } from './EditProfileDrawer';
import type { ProfileImageDrawerProps } from './ProfileImageDrawer';
import { ProfileImageDrawer } from './ProfileImageDrawer';
import type { ChangePasswordDrawerProps } from './ChangePasswordDrawer';
import { ChangePasswordDrawer } from './ChangePasswordDrawer';

export type ProfileDrawersProps = EditProfileDrawerProps & ProfileImageDrawerProps & ChangePasswordDrawerProps;

export function ProfileDrawers(props: ProfileDrawersProps) {
  return (
    <>
      <EditProfileDrawer {...props} />
      <ProfileImageDrawer {...props} />
      <ChangePasswordDrawer {...props} />
    </>
  );
}
