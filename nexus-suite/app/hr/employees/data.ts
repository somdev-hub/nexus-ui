export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
  salary: number;
}

export const employees: Employee[] = [
  {
    id: "EMP001",
    name: "John Doe",
    email: "john.doe@example.com",
    department: "Engineering",
    position: "Senior Developer",
    status: "Active",
    joinDate: "2023-01-15",
    salary: 85000
  },
  {
    id: "EMP002",
    name: "Sarah Smith",
    email: "sarah.smith@example.com",
    department: "Marketing",
    position: "Marketing Manager",
    status: "Active",
    joinDate: "2022-06-20",
    salary: 72000
  },
  {
    id: "EMP003",
    name: "Michael Johnson",
    email: "michael.j@example.com",
    department: "Sales",
    position: "Sales Manager",
    status: "Active",
    joinDate: "2023-03-10",
    salary: 78000
  },
  {
    id: "EMP004",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    department: "Finance",
    position: "Financial Analyst",
    status: "Active",
    joinDate: "2022-11-05",
    salary: 65000
  },
  {
    id: "EMP005",
    name: "David Brown",
    email: "david.brown@example.com",
    department: "Operations",
    position: "Operations Coordinator",
    status: "On Leave",
    joinDate: "2023-02-01",
    salary: 58000
  },
  {
    id: "EMP006",
    name: "Jessica Davis",
    email: "jessica.davis@example.com",
    department: "HR",
    position: "HR Manager",
    status: "Active",
    joinDate: "2021-09-12",
    salary: 70000
  },
  {
    id: "EMP007",
    name: "Robert Martinez",
    email: "robert.m@example.com",
    department: "Engineering",
    position: "Junior Developer",
    status: "Active",
    joinDate: "2023-08-22",
    salary: 55000
  },
  {
    id: "EMP008",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    department: "Logistics",
    position: "Logistics Manager",
    status: "Active",
    joinDate: "2022-04-18",
    salary: 68000
  }
];
