export const ROLE_LABELS: Record<string, string> = {
    ROLE_ADMIN: 'Administrator',
    ROLE_DIRECTOR: 'Director',
    ROLE_PRODUCT_MANAGER: 'Product Manager',
    ROLE_CLERK: 'Clerk',
    ROLE_ACCOUNT_MANAGER: 'Account Manager',
    ROLE_OPERATION_MANAGER: 'Operation Manager',
    ROLE_WAREHOUSE_MANAGER: 'Warehouse Manager',
    ROLE_FLEET_MANAGER: 'Fleet Manager',
    ROLE_DRIVER: 'Driver',
};

export const ORG_TYPE_LABELS: Record<string, string> = {
    RETAILER: 'Retailer',
    SUPPLIER: 'Supplier',
    LOGISTICS: 'Logistics',
};

export const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export function getRoleLabel(role: string): string {
    return ROLE_LABELS[role] || role.replace('ROLE_', '').replace(/_/g, ' ');
}

export function getOrgTypeLabel(orgType: string | undefined): string {
    if (!orgType) return '—';
    return ORG_TYPE_LABELS[orgType] || orgType;
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
