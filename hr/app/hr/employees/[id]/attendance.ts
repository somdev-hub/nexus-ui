import type { AttendanceStatus, AttendanceRecord } from "@/types";

// Generate dummy attendance data for the past year
export function generateDummyAttendance(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  employeeId: string
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Random status distribution
    const random = Math.random();
    let status: AttendanceStatus;
    let hoursWorked: number;

    if (random < 0.75) {
      // 75% present
      status = "present";
      hoursWorked = 8 + Math.random() * 2; // 8-10 hours
    } else if (random < 0.85) {
      // 10% partial (less than threshold)
      status = "partial";
      hoursWorked = 3 + Math.random() * 3; // 3-6 hours
    } else if (random < 0.95) {
      // 10% absent
      status = "absent";
      hoursWorked = 0;
    } else {
      // 5% on leave
      status = "leave";
      hoursWorked = 0;
    }

    // Map AttendanceStatus to AttendanceRecord status format
    let recordStatus: "Present" | "Late" | "Absent" | "On Leave" = "Present";
    switch (status) {
      case "present":
        recordStatus = "Present";
        break;
      case "absent":
        recordStatus = "Absent";
        break;
      case "leave":
        recordStatus = "On Leave";
        break;
      case "partial":
        recordStatus = "Late";
        break;
    }

    records.push({
      id: `ATT-${employeeId}-${dateStr}`,
      date: dateStr,
      employeeId: parseInt(employeeId, 10) || 0,
      employeeName: "",
      checkIn: status === "present" ? "09:00 AM" : "-",
      checkOut: status === "present" ? "05:30 PM" : "-",
      status: recordStatus,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)).toString(),
      checkInTime: status === "present" ? "09:00 AM" : "-",
      checkOutTime: status === "present" ? "05:30 PM" : "-",
      totalHoursWorked:
        status === "present" ? parseFloat(hoursWorked.toFixed(2)) : 0
    });
  }

  return records;
}

// Get attendance data for a specific employee
export function getEmployeeAttendance(employeeId: string): AttendanceRecord[] {
  return generateDummyAttendance(employeeId);
}

// Helper function to get status label and details
export function getAttendanceLabel(record: AttendanceRecord): {
  label: string;
  details: string;
} {
  const date = new Date(record.date);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  switch (record.status) {
    case "Present":
      return {
        label: "Present",
        details: `${dateStr} • ${record.hoursWorked} hours worked`
      };
    case "Absent":
      return {
        label: "Absent",
        details: `${dateStr} • No hours worked`
      };
    case "On Leave":
      return {
        label: "On Leave",
        details: `${dateStr} • On leave`
      };
    case "Late":
      return {
        label: "Late / Partial",
        details: `${dateStr} • ${record.hoursWorked} hours (below threshold)`
      };
    default:
      return {
        label: "Unknown",
        details: dateStr
      };
  }
}
