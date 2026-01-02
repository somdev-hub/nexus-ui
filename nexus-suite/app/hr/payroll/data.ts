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
}

export const payrollData: PayrollRecord[] = [
  {
    id: "PAY001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    month: "December 2024",
    baseSalary: 85000,
    bonus: 5000,
    deductions: 15000,
    netSalary: 75000,
    status: "Processed"
  },
  {
    id: "PAY002",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    month: "December 2024",
    baseSalary: 72000,
    bonus: 3000,
    deductions: 12000,
    netSalary: 63000,
    status: "Processed"
  },
  {
    id: "PAY003",
    employeeId: "EMP003",
    employeeName: "Michael Johnson",
    month: "December 2024",
    baseSalary: 78000,
    bonus: 4000,
    deductions: 13000,
    netSalary: 69000,
    status: "Processed"
  },
  {
    id: "PAY004",
    employeeId: "EMP004",
    employeeName: "Emma Wilson",
    month: "December 2024",
    baseSalary: 65000,
    bonus: 2000,
    deductions: 10500,
    netSalary: 56500,
    status: "Pending"
  },
  {
    id: "PAY005",
    employeeId: "EMP005",
    employeeName: "David Brown",
    month: "December 2024",
    baseSalary: 58000,
    bonus: 1500,
    deductions: 9000,
    netSalary: 50500,
    status: "On Hold"
  },
  {
    id: "PAY006",
    employeeId: "EMP006",
    employeeName: "Jessica Davis",
    month: "December 2024",
    baseSalary: 70000,
    bonus: 3500,
    deductions: 11500,
    netSalary: 62000,
    status: "Processed"
  },
  {
    id: "PAY007",
    employeeId: "EMP001",
    employeeName: "John Doe",
    month: "November 2024",
    baseSalary: 85000,
    bonus: 0,
    deductions: 15000,
    netSalary: 70000,
    status: "Processed"
  },
  {
    id: "PAY008",
    employeeId: "EMP002",
    employeeName: "Sarah Smith",
    month: "November 2024",
    baseSalary: 72000,
    bonus: 0,
    deductions: 12000,
    netSalary: 60000,
    status: "Processed"
  }
];
