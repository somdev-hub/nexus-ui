import type { AttendanceRecord } from "@/types";

export type { AttendanceRecord };

export const attendanceData: AttendanceRecord[] = [
  {
    id: "ATT001",
    date: "2024-12-20",
    employeeId: 1,
    employeeName: "John Doe",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present",
    checkInTime: "09:00 AM",
    checkOutTime: "05:30 PM",
    totalHoursWorked: 8.5
  },
  {
    id: "ATT002",
    date: "2024-12-20",
    employeeId: 2,
    employeeName: "Sarah Smith",
    checkIn: "09:15 AM",
    checkOut: "05:45 PM",
    hoursWorked: "8.5",
    status: "Late",
    checkInTime: "09:15 AM",
    checkOutTime: "05:45 PM",
    totalHoursWorked: 8.5
  },
  {
    id: "ATT003",
    date: "2024-12-20",
    employeeId: 3,
    employeeName: "Michael Johnson",
    checkIn: "-",
    checkOut: "-",
    hoursWorked: "0",
    status: "Absent",
    checkInTime: "-",
    checkOutTime: "-",
    totalHoursWorked: 0
  },
  {
    id: "ATT004",
    date: "2024-12-20",
    employeeId: 4,
    employeeName: "Emma Wilson",
    checkIn: "09:00 AM",
    checkOut: "01:00 PM",
    hoursWorked: "4",
    status: "Present",
    checkInTime: "09:00 AM",
    checkOutTime: "01:00 PM",
    totalHoursWorked: 4
  },
  {
    id: "ATT005",
    date: "2024-12-20",
    employeeId: 5,
    employeeName: "David Brown",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present",
    checkInTime: "09:00 AM",
    checkOutTime: "05:30 PM",
    totalHoursWorked: 8.5
  },
  {
    id: "ATT006",
    date: "2024-12-20",
    employeeId: 6,
    employeeName: "Jessica Davis",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present",
    checkInTime: "09:00 AM",
    checkOutTime: "05:30 PM",
    totalHoursWorked: 8.5
  },
  {
    id: "ATT007",
    date: "2024-12-19",
    employeeId: 1,
    employeeName: "John Doe",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present",
    checkInTime: "09:00 AM",
    checkOutTime: "05:30 PM",
    totalHoursWorked: 8.5
  },
  {
    id: "ATT008",
    date: "2024-12-19",
    employeeId: 2,
    employeeName: "Sarah Smith",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present",
    checkInTime: "09:00 AM",
    checkOutTime: "05:30 PM",
    totalHoursWorked: 8.5
  }
];
