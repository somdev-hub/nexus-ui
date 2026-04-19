// ============================================================================
// AUTH & USER TYPES
// ============================================================================

import { BankAccountType } from "./BankAccountTypes";
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
  department?: string;
  position?: string;
  allowances?: number;
  overtimeCost?: number;
  absentDays?: number;
  totalPayout?: number;
}

export interface AttendanceRecord {
  id?: string;
  checkInTime: string;
  checkOutTime: string;
  date: string;
  employeeId: number;
  employeeName: string;
  status: string;
  totalHoursWorked: number;
  // Legacy fields for backward compatibility
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: string;
}

export interface AttendancePageResponse {
  content: AttendanceRecord[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

export type AttendanceStatus = "present" | "absent" | "leave" | "partial";

// ============================================================================
// EMPLOYEE DETAILS API TYPES
// ============================================================================

export type LeaveType =
  | "EARNED_LEAVE"
  | "SICK_LEAVE"
  | "BEREAVEMENT_LEAVE"
  | "MATERNITY_LEAVE"
  | "PATERNITY_LEAVE"
  | "CASUAL_LEAVE"
  | "COMP_OFF";

export type AttendanceStatus_API =
  | "PRESENT"
  | "ABSENT"
  | "ON_LEAVE"
  | "HALF_DAY";

export type DocumentType =
  | "OTHER_HR_DOCUMENTS"
  | "OFFER_LETTER"
  | "APPOINTMENT_LETTER"
  | "RELIEVING_LETTER"
  | "EXPERIENCE_LETTER"
  | "SALARY_SLIP";

export interface LeaveRecord {
  leaveType: LeaveType;
  totalLeaves: number;
  leavesTaken: number;
  remainingLeaves: number;
}

export interface PositionHeld {
  title: string;
  department: string | null;
  fromDate: string; // ISO 8601 date string
  toDate: string | null;
  duration: number; // in days
}

export interface AttendanceDetail {
  date: string; // formatted date string e.g. "14 Feb 2026"
  status: AttendanceStatus_API;
  checkInTime: string; // ISO 8601 date string
  checkOutTime: string; // ISO 8601 date string
  hoursWorked: number;
  breakHours: number;
  overTimeHours: number;
}

export interface HRDocument {
  documentName: string;
  documentUrl: string;
  uploadedOn: string; // ISO 8601 date string
  documentType: DocumentType;
}

export interface EmployeeCompensationDetails {
  annualPackage: string;
  basePay: number;
  hra: number;
  pf: number;
  gratuity: number;
  insurancePremium: number | null;
  grossPay: number | null;
  netPay: number;
  bonuses: BonusDetail[];
  deductions: DeductionDetail[];
  bankRecords: BankRecord[];
}

export interface BonusDetail {
  bonusId: number;
  bonusType: string;
  amount: number;
  percentageOfSalary: number;
  expiresOn: string; // ISO 8601 date string
  issuedOn: string | null;
  panNumber: string | null;
  updatedOn: string | null;
}

export interface DeductionDetail {
  deductionId: number;
  deductionType: string;
  description: string;
  amount: number;
  percentageOfSalary: number;
  expiresOn: string; // ISO 8601 date string
  issuedOn: string | null;
  updatedOn: string | null;
}

export interface EmployeeDetailsResponse {
  empId: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  age: number;
  jobTitle: string;
  joiningDate: string; // formatted date string
  department: string; // e.g. "HUMAN_RESOURCES"
  profileImageUrl: string | null;
  annualSalary: number;
  leaveRecords: LeaveRecord[];
  positionsHeld: PositionHeld[];
  attendanceRecords: AttendanceDetail[];
  hrDocuments: HRDocument[];
  compensation: EmployeeCompensationDetails;
}

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

export type RequestType =
  | "LEAVE_APPLICATION"
  | "SALARY_ADVANCE"
  | "RESIGNATION"
  | "TRANSFER_REQUEST"
  | "PROMOTION_REQUEST"
  | "TRAINING_REQUEST"
  | "BULK_REGULARIZATION"
  | "WEEKLY_OFF";

export type RequestStatus =
  | "OPEN"
  | "SCRUTINY"
  | "APPROVED"
  | "REJECTED"
  | "CLOSED";

export type LeaveBalanceType =
  | "Casual"
  | "Sick"
  | "Paid"
  | "Unpaid"
  | "Comp"
  | "Maternity";

export interface EmployeeRequest {
  id: string;
  slNo: number;
  employeeId: string;
  employeeName: string;
  employeeImage?: string;
  department: string;
  role?: string;
  requestType: RequestType;
  currentStatus: RequestStatus;
  requestReceivedDate: string;
  remarks?: string;
  fromDate?: string;
  toDate?: string;
  leaveBalanceUsed?: number;
  leaveBalanceType?: LeaveBalanceType;
  checkInHours?: string;
  checkOutHours?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  leaveBalance?: number;
  amount?: number;
  createdAt?: string;
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
// EMPLOYEE INSIGHTS TYPES
// ============================================================================

export interface EmployeeInsights {
  totalEmployees: number;
  totalDepartments: number;
  employeesPerDepartment: Record<string, number>;
  genderRatio: Record<string, number>;
  onNoticePeriod: number;
}

// ============================================================================
// EMPLOYEE DIRECTORY TYPES
// ============================================================================

export interface EmployeeDirectoryItem {
  empId: number;
  empName: string;
  empEmail: string;
  deptName: string;
  position: string;
  salary: number;
  dateOfJoining: string;
}

export interface EmployeeDirectoryResponse {
  content: EmployeeDirectoryItem[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PayrollEmployeeItem {
  monthlySalaryGross: number;
  positionTitle: string;
  month: string;
  year: number;
  monthlySalaryNet: number;
  name: string;
  employeeId: number;
  department: string;
  paymentStatus:
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "NOT_PROCESSED";
}

export interface PayrollEmployeesResponse {
  content: PayrollEmployeeItem[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface EmployeeAttendanceResponse {
  daysPresent: number;
  daysAbsent: number;
  halfDays: number;
  totalOvertimeHours: number;
  totalAdditions: number;
  totalDeductions: number;
}

// ============================================================================
// PAYROLL PAYMENT INITIATION TYPES
// ============================================================================

export interface PayrollInitiationRequest {
  orgId: string;
  employeeIds: number[];
}

export interface PayrollInitiationResponse {
  transactionReference: string;
  payrollIds: number[];
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  message: string;
}

// ============================================================================
// PROCESSED PAYROLL TYPES
// ============================================================================

export interface ProcessedPayrollRecord {
  empId: number;
  name: string;
  department: string;
  basePay: number;
  hra: number;
  totalBonuses: number;
  totalDeductions: number;
  totalOvertimeFee: number;
  grossPay: number;
  netPay: number;
}

export interface ProcessedPayrollsResponse {
  content: ProcessedPayrollRecord[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// PAYROLL GRAPHS TYPES
// ============================================================================

export interface SalaryVsComponent {
  baseSalary: number;
  bonus: number;
  deduction: number;
}

export interface SalaryVsDeptItem {
  dept: string;
  baseSalary: number;
  bonus: number;
}

export interface SalaryVsOvertimeItem {
  month: string;
  year: number;
  totalSalary: number;
  overtimePay: number;
  employeeCount: number;
}

export interface SalaryVsRoleItem {
  role: string;
  baseSalary: number;
  bonus: number;
  employeeCount: number;
}

export interface SalaryVsStatusItem {
  status: string;
  noOfPayrolls: number;
}

export interface PayrollGraphsResponse {
  salaryVsComponent: SalaryVsComponent;
  salaryVsDept: SalaryVsDeptItem[];
  salaryVsOvertime: SalaryVsOvertimeItem[];
  salaryVsRole: SalaryVsRoleItem[];
  salaryVsStatus: SalaryVsStatusItem[];
}

// ============================================================================
// PAYROLL INSIGHTS TYPES
// ============================================================================

export interface PayrollInsightsResponse {
  totalNetSalaries: number;
  totalProcessedSalaries: number;
  totalPendingSalaries: number;
  totalNotProcessedSalaries: number;
  totalPayrollCost: number;
  averageNetSalaryPerEmployee: number;
  totalDeductions: number;
  totalOvertimeCost: number;
}

// ============================================================================
// HR REQUESTS API TYPES
// ============================================================================

export interface HrRequestItem {
  appliedOn: string;
  department: string;
  empId: number;
  employeeEmail: string;
  employeeName: string;
  fromDate?: string;
  leaveBalanceUsed?: number;
  leaveType?: string;
  remarks: string;
  requestId: number;
  requestType: string;
  role: string;
  status: string;
  toDate?: string;
  checkInHours?: string;
  checkOutHours?: string;
}

export interface HrRequestsResponse {
  content: HrRequestItem[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

export interface HrInsightsResponse {
  openCases: number;
  allHandledCases: number;
  approvedCases: number;
  inScrutinyCases: number;
  rejectedCases: number;
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
