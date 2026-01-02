export interface Role {
  id: string;
  name: string;
  description: string;
  employees: number;
  permissions: string[];
  status: "Active" | "Inactive";
}

export const rolesData: Role[] = [
  {
    id: "ROLE001",
    name: "Administrator",
    description: "Full system access with all permissions",
    employees: 2,
    permissions: [
      "Create Employee",
      "Edit Employee",
      "Delete Employee",
      "Process Payroll",
      "View Reports",
      "Manage Roles",
      "Manage Attendance",
      "Configure System"
    ],
    status: "Active"
  },
  {
    id: "ROLE002",
    name: "HR Manager",
    description: "Manages human resources operations",
    employees: 3,
    permissions: [
      "Create Employee",
      "Edit Employee",
      "View Reports",
      "Manage Attendance",
      "Manage Payroll",
      "Process Leaves"
    ],
    status: "Active"
  },
  {
    id: "ROLE003",
    name: "Manager",
    description: "Team lead with supervisory permissions",
    employees: 5,
    permissions: [
      "View Team Members",
      "Monitor Performance",
      "Approve Leaves",
      "Track Attendance",
      "Generate Reports"
    ],
    status: "Active"
  },
  {
    id: "ROLE004",
    name: "Employee",
    description: "Regular employee with standard permissions",
    employees: 15,
    permissions: [
      "View Own Profile",
      "Request Leave",
      "View Payslips",
      "Clock In/Out"
    ],
    status: "Active"
  },
  {
    id: "ROLE005",
    name: "Finance Officer",
    description: "Manages financial operations",
    employees: 2,
    permissions: [
      "Process Payroll",
      "Manage Deductions",
      "View Financial Reports",
      "Approve Expenses"
    ],
    status: "Active"
  },
  {
    id: "ROLE006",
    name: "Intern",
    description: "Limited access for internship program",
    employees: 4,
    permissions: ["View Own Profile", "Clock In/Out", "Request Leave"],
    status: "Active"
  }
];
