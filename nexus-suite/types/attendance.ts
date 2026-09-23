export interface AttendanceQuickUpdateResponse {
  lastCheckedInTime: string;
  lastCheckedOutTime: string;
  totalBreakTime: string;
  totalWorkHours: string;
}

export interface ToggleAttendanceResponse {
  breakEndTime: string;
  checkOutTime: string;
  overtimeHours: number;
  totalHoursWorked: number;
  timeManagementId: number;
  checkInTime: string;
  effectiveHours: number;
  breakStartTime: string;
  isPresent: boolean;
  message: string;
  isHalfDay: boolean;
}
