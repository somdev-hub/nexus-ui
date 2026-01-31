export type AttendanceStatus = "present" | "absent" | "leave" | "partial";

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  hoursWorked?: number;
  threshold?: number; // hours threshold for partial status
}

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

    records.push({
      date: dateStr,
      status,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      threshold: 7 // 7 hours is the threshold
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
    case "present":
      return {
        label: "Present",
        details: `${dateStr} • ${record.hoursWorked} hours worked`
      };
    case "absent":
      return {
        label: "Absent",
        details: `${dateStr} • No hours worked`
      };
    case "leave":
      return {
        label: "On Leave",
        details: `${dateStr} • On leave`
      };
    case "partial":
      return {
        label: "Partial Day",
        details: `${dateStr} • ${record.hoursWorked} hours (below threshold)`
      };
    default:
      return {
        label: "Unknown",
        details: dateStr
      };
  }
}
