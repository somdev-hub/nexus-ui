import apiClient from "@/lib/api-client";
import type { AttendanceQuickUpdateResponse, ToggleAttendanceResponse } from "@/types/attendance";

export async function getAttendanceQuickUpdate(
  empId: number,
): Promise<AttendanceQuickUpdateResponse> {
  const response = await apiClient.get<AttendanceQuickUpdateResponse>(
    `/iam/organizations/time-management/quick-update?empId=${empId}`,
  );
  return response.data;
}

export async function toggleAttendance(
  userId: number,
): Promise<ToggleAttendanceResponse> {
  const response = await apiClient.get<ToggleAttendanceResponse>(
    `/iam/organizations/employee/toggle-attendance?userId=${userId}`,
  );
  return response.data;
}
