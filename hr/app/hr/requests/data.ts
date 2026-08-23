import type {
  RequestType,
  RequestStatus,
  LeaveBalanceType,
  EmployeeRequest,
  HrRequestItem
} from "@/types";

export type { RequestStatus, EmployeeRequest };

export const requests: EmployeeRequest[] = [
  {
    id: "REQ001",
    requestId: 1,
    slNo: 1,
    employeeName: "John Doe",
    employeeId: "EMP001",
    department: "Engineering",
    role: "Senior Developer",
    requestReceivedDate: "2026-01-28",
    requestType: "LEAVE_APPLICATION",
    currentStatus: "OPEN",
    remarks: "Medical appointment",
    fromDate: "2026-02-03",
    toDate: "2026-02-05",
    leaveBalanceUsed: 3,
    leaveBalanceType: "Sick"
  },
  {
    id: "REQ002",
    requestId: 2,
    slNo: 2,
    employeeName: "Sarah Smith",
    employeeId: "EMP002",
    department: "Marketing",
    role: "Marketing Manager",
    requestReceivedDate: "2026-01-27",
    requestType: "SALARY_ADVANCE",
    currentStatus: "SCRUTINY",
    remarks: "Personal expenses"
  },
  {
    id: "REQ003",
    requestId: 3,
    slNo: 3,
    employeeName: "Mike Johnson",
    employeeId: "EMP003",
    department: "Engineering",
    role: "Developer",
    requestReceivedDate: "2026-01-25",
    requestType: "PROMOTION_REQUEST",
    currentStatus: "SCRUTINY",
    remarks: "Seeking promotion to Senior Developer"
  },
  {
    id: "REQ004",
    requestId: 4,
    slNo: 4,
    employeeName: "Emily Davis",
    employeeId: "EMP004",
    department: "Operations",
    role: "Operations Lead",
    requestReceivedDate: "2026-01-24",
    requestType: "TRANSFER_REQUEST",
    currentStatus: "APPROVED",
    remarks: "Transfer to Mumbai office"
  },
  {
    id: "REQ005",
    requestId: 5,
    slNo: 5,
    employeeName: "Robert Wilson",
    employeeId: "EMP005",
    department: "Engineering",
    role: "Senior Developer",
    requestReceivedDate: "2026-01-23",
    requestType: "TRAINING_REQUEST",
    currentStatus: "APPROVED",
    remarks: "AWS certification training"
  },
  {
    id: "REQ006",
    requestId: 6,
    slNo: 6,
    employeeName: "Alice Johnson",
    employeeId: "EMP006",
    department: "HR",
    role: "HR Executive",
    requestReceivedDate: "2026-01-22",
    requestType: "WEEKLY_OFF",
    currentStatus: "REJECTED",
    remarks: "Request for alternate Saturday",
    fromDate: "2026-02-01",
    toDate: "2026-02-01",
    checkInHours: "09:00",
    checkOutHours: "18:00"
  },
  {
    id: "REQ007",
    requestId: 7,
    slNo: 7,
    employeeName: "Tom Brown",
    employeeId: "EMP007",
    department: "Sales",
    role: "Sales Manager",
    requestReceivedDate: "2026-01-20",
    requestType: "LEAVE_APPLICATION",
    currentStatus: "APPROVED",
    remarks: "Vacation",
    fromDate: "2026-02-10",
    toDate: "2026-02-17",
    leaveBalanceUsed: 7,
    leaveBalanceType: "Paid"
  },
  {
    id: "REQ008",
    requestId: 8,
    slNo: 8,
    employeeName: "Jessica Miller",
    employeeId: "EMP008",
    department: "Finance",
    role: "Finance Manager",
    requestReceivedDate: "2026-01-19",
    requestType: "RESIGNATION",
    currentStatus: "SCRUTINY",
    remarks: "Career change"
  },
  {
    id: "REQ009",
    requestId: 9,
    slNo: 9,
    employeeName: "David Chen",
    employeeId: "EMP009",
    department: "IT",
    role: "IT Support",
    requestReceivedDate: "2026-01-18",
    requestType: "SALARY_ADVANCE",
    currentStatus: "REJECTED",
    remarks: "Emergency funds"
  },
  {
    id: "REQ010",
    requestId: 10,
    slNo: 10,
    employeeName: "Lisa Anderson",
    employeeId: "EMP010",
    department: "Engineering",
    role: "Junior Developer",
    requestReceivedDate: "2026-01-17",
    requestType: "BULK_REGULARIZATION",
    currentStatus: "OPEN",
    remarks: "Regularization of contract employment",
    fromDate: "2025-09-01",
    toDate: "2026-01-31",
    checkInHours: "09:00",
    checkOutHours: "18:00"
  },
  {
    id: "REQ011",
    requestId: 11,
    slNo: 11,
    employeeName: "James Taylor",
    employeeId: "EMP011",
    department: "Operations",
    role: "Operations Executive",
    requestReceivedDate: "2026-01-16",
    requestType: "LEAVE_APPLICATION",
    currentStatus: "OPEN",
    remarks: "Family emergency",
    fromDate: "2026-02-02",
    toDate: "2026-02-04",
    leaveBalanceUsed: 2,
    leaveBalanceType: "Casual"
  },
  {
    id: "REQ012",
    requestId: 12,
    slNo: 12,
    employeeName: "Amanda White",
    employeeId: "EMP012",
    department: "Marketing",
    role: "Marketing Executive",
    requestReceivedDate: "2026-01-15",
    requestType: "PROMOTION_REQUEST",
    currentStatus: "APPROVED",
    remarks: "Promotion to Manager"
  }
];

export const getRequestMetrics = (requestsList: EmployeeRequest[]) => {
  const pending = requestsList.filter((r) => r.currentStatus === "OPEN").length;
  const approved = requestsList.filter(
    (r) => r.currentStatus === "APPROVED"
  ).length;
  const rejected = requestsList.filter(
    (r) => r.currentStatus === "REJECTED"
  ).length;
  const inScrutiny = requestsList.filter(
    (r) => r.currentStatus === "SCRUTINY"
  ).length;
  const total = requestsList.length;

  return {
    pending,
    approved,
    rejected,
    inScrutiny,
    total
  };
};

export const getRequestTypeLabel = (requestType: string): string => {
  const typeMap: Record<string, string> = {
    LEAVE_APPLICATION: "Leave Application",
    SALARY_ADVANCE: "Salary Advance",
    RESIGNATION: "Resignation",
    TRANSFER_REQUEST: "Transfer Request",
    PROMOTION_REQUEST: "Promotion Request",
    TRAINING_REQUEST: "Training Request",
    BULK_REGULARIZATION: "Bulk Regularization",
    WEEKLY_OFF: "Weekly Off"
  };
  return typeMap[requestType] || requestType;
};

export const mapApiStatusToRequestStatus = (status: string): RequestStatus => {
  // Map API status strings to RequestStatus values
  const statusMap: Record<string, RequestStatus> = {
    OPEN: "OPEN",
    SCRUTINY: "SCRUTINY",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CLOSED: "CLOSED"
  };
  return statusMap[status] || "OPEN";
};

/**
 * Get display label for request status
 */
export const getStatusLabel = (status: RequestStatus): string => {
  const labelMap: Record<RequestStatus, string> = {
    OPEN: "Pending",
    SCRUTINY: "In Scrutiny",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CLOSED: "Closed"
  };
  return labelMap[status] || status;
};

/**
 * Transform API HR request item to EmployeeRequest format
 */
export const transformHrRequestToEmployeeRequest = (
  item: HrRequestItem,
  slNo: number
): EmployeeRequest => {
  // Extract employee ID from email or use empId as fallback
  const employeeId = `EMP${String(item.empId).padStart(3, "0")}`;

  // Debug: Log the item to see what's actually in the API response
  console.log("[TRANSFORM] HrRequestItem:", item);

  return {
    id: `REQ${String(item.requestId).padStart(4, "0")}`,
    requestId: item.requestId,
    slNo,
    employeeName: item.employeeName,
    employeeId,
    department: item.department,
    role: item.role,
    requestReceivedDate: item.appliedOn,
    requestType: item.requestType as RequestType,
    currentStatus: mapApiStatusToRequestStatus(item.status),
    remarks: item.remarks,
    fromDate: item.fromDate,
    toDate: item.toDate,
    leaveBalanceUsed: item.leaveBalanceUsed,
    leaveBalanceType: item.leaveType as LeaveBalanceType | undefined,
    checkInHours: item.checkInHours,
    checkOutHours: item.checkOutHours
  };
};
