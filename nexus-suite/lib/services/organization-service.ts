import apiClient from "@/lib/api-client";

export type OrgType = "RETAILER" | "SUPPLIER" | "LOGISTICS";

export interface Organization {
  id: number;
  orgName: string;
  orgType: OrgType;
  trustScore?: number;
  createdAt?: string;
}

export async function getOrganizationById(orgId: string | number): Promise<Organization> {
  const res = await apiClient.get<Organization>(`/iam/organizations/${orgId}`);
  return res.data;
}

export async function getOrganizationDetails(orgId: string | number): Promise<Organization> {
  try {
    const res = await apiClient.get<Organization>(`/iam/organizations/details/${orgId}`);
    // details endpoint returns wrapped data; try to unwrap
    const data = res.data as any;
    if (data && data.organization) return data.organization as Organization;
    if (data && data.orgType) return data as Organization;
    return data as Organization;
  } catch {
    return getOrganizationById(orgId);
  }
}

export function resolveOrgType(orgType?: string): OrgType | undefined {
  if (!orgType) return undefined;
  const upper = orgType.toUpperCase();
  if (upper === "RETAILER" || upper === "SUPPLIER" || upper === "LOGISTICS") return upper as OrgType;
  return upper as OrgType;
}

export function getDashboardPathForOrgType(orgType?: string): string {
  const resolved = resolveOrgType(orgType);
  switch (resolved) {
    case "SUPPLIER":
      return "/supplier/dashboard";
    case "LOGISTICS":
      return "/logistics/dashboard";
    case "RETAILER":
    default:
      return "/retailer/dashboard";
  }
}

export function isAllowedPathForOrgType(pathname: string, orgType?: string): boolean {
  const resolved = resolveOrgType(orgType);
  if (!resolved) return true; // allow if unknown (auth disabled)
  if (pathname.startsWith("/retailer")) return resolved === "RETAILER";
  if (pathname.startsWith("/supplier")) return resolved === "SUPPLIER";
  if (pathname.startsWith("/logistics")) return resolved === "LOGISTICS";
  // shared paths: profile, unauthorized, etc.
  if (pathname.startsWith("/profile") || pathname.startsWith("/unauthorized") || pathname === "/") return true;
  return true;
}
