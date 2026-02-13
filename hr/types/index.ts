// ============================================================================
// AUTH & USER TYPES
// ============================================================================

import { BankAccountType } from "./BankAccountTypes";
import { EmployeeLevelTypes } from "./EmployeeLevelTypes";
import { OrgType } from "./OrgType";
import { PermissionAction } from "./PermissionAction";
import { ResourceType } from "./ResourceTypes";

export type UserRole =
  | "ROLE_ADMIN"
  | "ROLE_DIRECTOR"
  | "ROLE_PRODUCT_MANAGER"
  | "ROLE_CLERK"
  | "ROLE_ACCOUNT_MANAGER"
  | "ROLE_OPERATION_MANAGER"
  | "ROLE_WAREHOUSE_MANAGER"
  | "ROLE_FLEET_MANAGER"
  | "ROLE_DRIVER";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  personalEmail: string;
  password: string;
  phone: string;
  title: string;
  role: string;
  gender: string;
  age: number;
  dateOfBirth: Date | null;
  department: string;
  address: string;
  profilePicture: File | string | null;
  compensation: CompensationData;
  orgName: string;
  orgType: OrgType;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    orgId?: string;
    avatar?: string;
  };
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  orgId: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId?: string;
  avatar?: string;
}

// ============================================================================
// FORM DATA TYPES (Signup Flow)
// ============================================================================

export interface PersonalFormData {
  name: string;
  email: string;
  personalEmail: string;
  password: string;
  confirmPassword: string;
  phone: string;
  title: string;
  role: string;
  gender: string;
  age: number;
  dateOfBirth: Date | null;
  department: string;
  address: string;
  profilePicture: File | null;
}

export interface BankRecord {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: BankAccountType;
  branchAddress: string;
  panNumber: string;
}

export interface Bonus {
  bonusType: string;
  amount: number;
  percentageOfSalary: number;
  expiresOn: Date;
}

export interface Deduction {
  deductionType: string;
  description: string;
  amount: number;
  percentageOfSalary: number;
  expiresOn: Date;
}

export interface CompensationData {
  basePay: number;
  hra: number; // 50% of basePay
  pf: number; // 12% of basePay
  gratuity: number; // 4.81% of basePay
  insurancePremium: number; // 2% of netPay
  grossPay: number; // total before deductions
  netPay: number; // total after deductions
  annualPackage: string;
  bonuses: Bonus[];
  deductions: Deduction[];
  bankRecords: BankRecord[];
}

export interface PersonalData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  department: string;
  title: string;
  personalEmail: string;
  profilePicture: File | null;
}

// ============================================================================
// EMPLOYEE & HR MANAGEMENT TYPES
// ============================================================================

export interface EmployeeRecord {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  profilePhoto: string;
  orgId: number;
  role: string;
  effectiveFrom: Date;
  compensation: CompensationData;
  personalEmail: string;
  department: string;
  deptId: number;
  isDeptHead: boolean;
  title: string;
  remarks: string;
  gender: string;
  age: number;
  dateOfBirth: Date | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
  salary: number;
  gender?: string;
  noticePerioddDays?: number;
  payBreakdown?: {
    baseSalary: number;
    bonus: number;
    allowances: number;
    deductions: number;
  };
  previousPositions?: Array<{
    position: string;
    department: string;
    startDate: string;
    endDate: string;
  }>;
  letters?: Array<{
    id: string;
    type: string;
    date: string;
    description: string;
  }>;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: "Processed" | "Pending" | "On Hold";
}

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: string;
  status: "Present" | "Late" | "Absent" | "On Leave";
}

export type AttendanceStatus = "present" | "absent" | "leave" | "partial";

export interface WorkTask {
  id: string;
  taskId: string;
  employeeName: string;
  taskName: string;
  project: string;
  progress: number;
  hoursLogged: string;
  dueDate: string;
  status: "On Track" | "At Risk" | "Delayed" | "Completed";
}

// ============================================================================
// ORGANIZATION & ROLE TYPES
// ============================================================================

export interface Department {
  departmentId: string;
  departmentName: string;
  members: number;
  roles: number;
  departmentHead: string;
}

export interface RoleRecord {
  id: string;
  department: string;
  role: string;
  employeeCount: number;
  createdOn: string;
  permissions: string[];
  status: "Active" | "Inactive";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleCompensation {
  orgId: number;
  role: string;
  deptId: number;
  minBasePay: number;
  maxBasePay: number;
  minTotalBonuses: number;
  maxTotalBonuses: number;
  minTotalDeductions: number;
  maxTotalDeductions: number;
  minAnnualSalary: string;
  maxAnnualSalary: string;
}

export interface GrantPermission {
  resourceName: string;
  description: string;
  resourceType: ResourceType;
  role: string;
  actions: PermissionAction[];
  departmentId: number;
  resourceUrl?: string;
  featureId?: string;
}

// ============================================================================
// REQUEST & LEAVE TYPES
// ============================================================================

export type RequestType = "Leave" | "Expense" | "Promotion" | "Adjustment";

export type RequestStatus = "Pending" | "Approved" | "Rejected" | "In Scrutiny";

export type LeaveBalanceType =
  | "Casual"
  | "Sick"
  | "Paid"
  | "Unpaid"
  | "Comp"
  | "Maternity";

export interface EmployeeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeImage?: string;
  department: string;
  requestType: RequestType;
  title?: string;
  reason?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  leaveType?: LeaveBalanceType;
  leaveBalance?: number;
  amount?: number;
  approvalStatus: RequestStatus;
  createdAt: string;
  approvalDate?: string;
  comments?: string;
  approvedBy?: string;
}

// ============================================================================
// TABLE & UI TYPES
// ============================================================================

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface HRTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
}

// ============================================================================
// DELIVERY & STATUS TYPES
// ============================================================================

export interface DeliveryStep {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface DeliveryStatusProps {
  steps: DeliveryStep[];
  currentStep: number;
  currentStepDate?: string;
}
