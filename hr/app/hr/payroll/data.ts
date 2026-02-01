export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  overtimeCost: number;
  absentDays: number;
  allowances: number;
  totalPayout: number;
  status: "Processed" | "Pending" | "On Hold";
}

export const payrollData: PayrollRecord[] = [
  {
    id: "PAY001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    department: "Engineering",
    position: "Senior Developer",
    month: "February 2026",
    baseSalary: 85000,
    bonus: 5000,
    deductions: 15000,
    netSalary: 75000,
    overtimeCost: 2500,
    absentDays: 1,
    allowances: 2000,
    totalPayout: 84500,
    status: "Processed"
  },
  {
    id: "PAY002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    department: "HR",
    position: "HR Manager",
    month: "February 2026",
    baseSalary: 72000,
    bonus: 3000,
    deductions: 12000,
    netSalary: 63000,
    overtimeCost: 800,
    absentDays: 0,
    allowances: 1500,
    totalPayout: 68300,
    status: "Processed"
  },
  {
    id: "PAY003",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    position: "Software Engineer",
    department: "Engineering",
    month: "January 2026",
    baseSalary: 78000,
    bonus: 4000,
    deductions: 13000,
    netSalary: 69000,
    overtimeCost: 3200,
    absentDays: 2,
    allowances: 2500,
    totalPayout: 81200,
    status: "Processed"
  },
  {
    id: "PAY004",
    employeeId: "EMP004",
    employeeName: "Emma Wilson",
    position: "Sales Executive",
    department: "Sales",
    month: "January 2026",
    baseSalary: 65000,
    bonus: 2000,
    deductions: 10500,
    netSalary: 56500,
    overtimeCost: 1500,
    absentDays: 0,
    allowances: 1000,
    totalPayout: 61000,
    status: "Pending"
  },
  {
    id: "PAY005",
    employeeId: "EMP005",
    employeeName: "David Brown",
    position: "Operations Manager",
    department: "Operations",
    month: "January 2026",
    baseSalary: 58000,
    bonus: 1500,
    deductions: 9000,
    netSalary: 50500,
    overtimeCost: 2000,
    absentDays: 3,
    allowances: 1200,
    totalPayout: 54200,
    status: "On Hold"
  },
  {
    id: "PAY006",
    employeeId: "EMP006",
    position: "Marketing Specialist",
    employeeName: "Jessica Davis",
    department: "Marketing",
    month: "February 2026",
    baseSalary: 70000,
    bonus: 3500,
    deductions: 11500,
    netSalary: 62000,
    overtimeCost: 900,
    absentDays: 0,
    allowances: 1800,
    totalPayout: 67700,
    status: "Processed"
  },
  {
    id: "PAY007",
    employeeId: "EMP001",
    employeeName: "John Doe",
    position: "Senior Developer",
    department: "Engineering",
    month: "December 2025",
    baseSalary: 85000,
    bonus: 0,
    deductions: 15000,
    netSalary: 70000,
    overtimeCost: 2200,
    absentDays: 0,
    allowances: 2000,
    totalPayout: 79200,
    status: "Processed"
  },
  {
    id: "PAY008",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    department: "HR",
    position: "HR Manager",
    month: "January 2026",
    baseSalary: 72000,
    bonus: 0,
    deductions: 12000,
    netSalary: 60000,
    overtimeCost: 700,
    absentDays: 1,
    allowances: 1500,
    totalPayout: 64700,
    status: "Processed"
  },
  {
    id: "PAY009",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    department: "Engineering",
    position: "Software Engineer",
    month: "February 2026",
    baseSalary: 78000,
    bonus: 0,
    deductions: 13000,
    netSalary: 65000,
    overtimeCost: 2800,
    absentDays: 0,
    allowances: 2500,
    totalPayout: 72800,
    status: "Processed"
  },
  {
    id: "PAY010",
    employeeId: "EMP001",
    employeeName: "John Doe",
    position: "Senior Developer",
    department: "Engineering",
    month: "December 2025",
    baseSalary: 85000,
    bonus: 0,
    deductions: 15000,
    netSalary: 70000,
    overtimeCost: 1800,
    absentDays: 1,
    allowances: 2000,
    totalPayout: 78800,
    status: "Processed"
  },
  {
    id: "PAY011",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    position: "HR Manager",
    department: "HR",
    month: "December 2025",
    baseSalary: 72000,
    bonus: 0,
    deductions: 12000,
    netSalary: 60000,
    overtimeCost: 600,
    absentDays: 0,
    allowances: 1500,
    totalPayout: 63600,
    status: "Processed"
  },
  {
    id: "PAY012",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    position: "Software Engineer",
    department: "Engineering",
    month: "December 2025",
    baseSalary: 78000,
    bonus: 0,
    deductions: 13000,
    netSalary: 65000,
    overtimeCost: 2100,
    absentDays: 2,
    allowances: 2500,
    totalPayout: 71100,
    status: "Processed"
  }
];
