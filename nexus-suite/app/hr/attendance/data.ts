export interface AttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: string;
  status: "Present" | "Absent" | "Late" | "Half Day";
}

export const attendanceData: AttendanceRecord[] = [
  {
    id: "ATT001",
    date: "2024-12-20",
    employeeId: "EMP001",
    employeeName: "John Doe",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present"
  },
  {
    id: "ATT002",
    date: "2024-12-20",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    checkIn: "09:15 AM",
    checkOut: "05:45 PM",
    hoursWorked: "8.5",
    status: "Late"
  },
  {
    id: "ATT003",
    date: "2024-12-20",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    checkIn: "-",
    checkOut: "-",
    hoursWorked: "0",
    status: "Absent"
  },
  {
    id: "ATT004",
    date: "2024-12-20",
    employeeId: "EMP004",
    employeeName: "Emma Wilson",
    checkIn: "09:00 AM",
    checkOut: "01:00 PM",
    hoursWorked: "4",
    status: "Half Day"
  },
  {
    id: "ATT005",
    date: "2024-12-20",
    employeeId: "EMP005",
    employeeName: "David Brown",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present"
  },
  {
    id: "ATT006",
    date: "2024-12-20",
    employeeId: "EMP006",
    employeeName: "Jessica Davis",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present"
  },
  {
    id: "ATT007",
    date: "2024-12-19",
    employeeId: "EMP001",
    employeeName: "John Doe",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present"
  },
  {
    id: "ATT008",
    date: "2024-12-19",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: "8.5",
    status: "Present"
  }
];
