import type {
  RequestType,
  RequestStatus,
  LeaveBalanceType,
  EmployeeRequest
} from "@/types";

export const requests: EmployeeRequest[] = [
  {
    id: "REQ001",
    slNo: 1,
    employeeName: "John Doe",
    employeeId: "EMP001",
    department: "Engineering",
    role: "Senior Developer",
    requestReceivedDate: "2026-01-28",
    requestType: "LEAVE_APPLICATION",
    currentStatus: "Pending",
    remarks: "Medical appointment",
    fromDate: "2026-02-03",
    toDate: "2026-02-05",
    leaveBalanceUsed: 3,
    leaveBalanceType: "Sick Leave"
  },
  {
    id: "REQ002",
    slNo: 2,
    employeeName: "Sarah Smith",
    employeeId: "EMP002",
    department: "Marketing",
    role: "Marketing Manager",
    requestReceivedDate: "2026-01-27",
    requestType: "SALARY_ADVANCE",
    currentStatus: "In Scrutiny",
    remarks: "Personal expenses"
  },
  {
    id: "REQ003",
    slNo: 3,
    employeeName: "Mike Johnson",
    employeeId: "EMP003",
    department: "Engineering",
    role: "Developer",
    requestReceivedDate: "2026-01-25",
    requestType: "PROMOTION_REQUEST",
    currentStatus: "In Scrutiny",
    remarks: "Seeking promotion to Senior Developer"
  },
  {
    id: "REQ004",
    slNo: 4,
    employeeName: "Emily Davis",
    employeeId: "EMP004",
    department: "Operations",
    role: "Operations Lead",
    requestReceivedDate: "2026-01-24",
    requestType: "TRANSFER_REQUEST",
    currentStatus: "Approved",
    remarks: "Transfer to Mumbai office"
  },
  {
    id: "REQ005",
    slNo: 5,
    employeeName: "Robert Wilson",
    employeeId: "EMP005",
    department: "Engineering",
    role: "Senior Developer",
    requestReceivedDate: "2026-01-23",
    requestType: "TRAINING_REQUEST",
    currentStatus: "Approved",
    remarks: "AWS certification training"
  },
  {
    id: "REQ006",
    slNo: 6,
    employeeName: "Alice Johnson",
    employeeId: "EMP006",
    department: "HR",
    role: "HR Executive",
    requestReceivedDate: "2026-01-22",
    requestType: "WEEKLY_OFF",
    currentStatus: "Rejected",
    remarks: "Request for alternate Saturday",
    fromDate: "2026-02-01",
    toDate: "2026-02-01",
    checkInHours: "09:00",
    checkOutHours: "18:00",
    halfDay: false
  },
  {
    id: "REQ007",
    slNo: 7,
    employeeName: "Tom Brown",
    employeeId: "EMP007",
    department: "Sales",
    role: "Sales Manager",
    requestReceivedDate: "2026-01-20",
    requestType: "LEAVE_APPLICATION",
    currentStatus: "Approved",
    remarks: "Vacation",
    fromDate: "2026-02-10",
    toDate: "2026-02-17",
    leaveBalanceUsed: 7,
    leaveBalanceType: "Earned Leave"
  },
  {
    id: "REQ008",
    slNo: 8,
    employeeName: "Jessica Miller",
    employeeId: "EMP008",
    department: "Finance",
    role: "Finance Manager",
    requestReceivedDate: "2026-01-19",
    requestType: "RESIGNATION",
    currentStatus: "In Scrutiny",
    remarks: "Career change"
  },
  {
    id: "REQ009",
    slNo: 9,
    employeeName: "David Chen",
    employeeId: "EMP009",
    department: "IT",
    role: "IT Support",
    requestReceivedDate: "2026-01-18",
    requestType: "SALARY_ADVANCE",
    currentStatus: "Rejected",
    remarks: "Emergency funds"
  },
  {
    id: "REQ010",
    slNo: 10,
    employeeName: "Lisa Anderson",
    employeeId: "EMP010",
    department: "Engineering",
    role: "Junior Developer",
    requestReceivedDate: "2026-01-17",
    requestType: "BULK_REGULARIZATION",
    currentStatus: "Pending",
    remarks: "Regularization of contract employment",
    fromDate: "2025-09-01",
    toDate: "2026-01-31",
    checkInHours: "09:00",
    checkOutHours: "18:00",
    halfDay: false
  },
  {
    id: "REQ011",
    slNo: 11,
    employeeName: "James Taylor",
    employeeId: "EMP011",
    department: "Operations",
    role: "Operations Executive",
    requestReceivedDate: "2026-01-16",
    requestType: "LEAVE_APPLICATION",
    currentStatus: "Pending",
    remarks: "Family emergency",
    fromDate: "2026-02-02",
    toDate: "2026-02-04",
    leaveBalanceUsed: 2,
    leaveBalanceType: "Casual Leave"
  },
  {
    id: "REQ012",
    slNo: 12,
    employeeName: "Amanda White",
    employeeId: "EMP012",
    department: "Marketing",
    role: "Marketing Executive",
    requestReceivedDate: "2026-01-15",
    requestType: "PROMOTION_REQUEST",
    currentStatus: "Approved",
    remarks: "Promotion to Manager"
  }
];

export const getRequestMetrics = (requestsList: EmployeeRequest[]) => {
  const pending = requestsList.filter(
    (r) => r.currentStatus === "Pending"
  ).length;
  const approved = requestsList.filter(
    (r) => r.currentStatus === "Approved"
  ).length;
  const rejected = requestsList.filter(
    (r) => r.currentStatus === "Rejected"
  ).length;
  const inScrutiny = requestsList.filter(
    (r) => r.currentStatus === "In Scrutiny"
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

export const getRequestTypeLabel = (type: RequestType): string => {
  const labels: Record<RequestType, string> = {
    LEAVE_APPLICATION: "Leave Application",
    SALARY_ADVANCE: "Salary Advance",
    RESIGNATION: "Resignation",
    TRANSFER_REQUEST: "Transfer Request",
    PROMOTION_REQUEST: "Promotion Request",
    TRAINING_REQUEST: "Training Request",
    BULK_REGULARIZATION: "Bulk Regularization",
    WEEKLY_OFF: "Weekly Off"
  };
  return labels[type];
};
