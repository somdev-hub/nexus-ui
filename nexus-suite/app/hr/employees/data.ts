export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
  salary: number;
  payBreakdown?: {
    baseSalary: number;
    bonus: number;
    allowances: number;
    deductions: number;
  };
  previousPositions?: Array<{
    position: string;
    department: string;
    startDate: string;
    endDate: string;
  }>;
  letters?: Array<{
    id: string;
    type: string;
    date: string;
    description: string;
  }>;
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
    salary: 85000,
    payBreakdown: {
      baseSalary: 70000,
      bonus: 10000,
      allowances: 5000,
      deductions: 0
    },
    previousPositions: [
      {
        position: "Junior Developer",
        department: "Engineering",
        startDate: "2020-06-01",
        endDate: "2022-12-31"
      },
      {
        position: "Intern",
        department: "Engineering",
        startDate: "2020-01-15",
        endDate: "2020-05-31"
      }
    ],
    letters: [
      {
        id: "LTR001",
        type: "Offer Letter",
        date: "2023-01-10",
        description: "Senior Developer Position Offer"
      },
      {
        id: "LTR002",
        type: "Promotion Letter",
        date: "2022-12-20",
        description: "Promotion to Senior Developer"
      },
      {
        id: "LTR003",
        type: "Salary Revision",
        date: "2023-07-01",
        description: "Annual Salary Review & Increment"
      }
    ]
  },
  {
    id: "EMP002",
    name: "Sarah Smith",
    email: "sarah.smith@example.com",
    department: "Marketing",
    position: "Marketing Manager",
    status: "Active",
    joinDate: "2022-06-20",
    salary: 72000,
    payBreakdown: {
      baseSalary: 60000,
      bonus: 8000,
      allowances: 4000,
      deductions: 0
    },
    previousPositions: [
      {
        position: "Marketing Coordinator",
        department: "Marketing",
        startDate: "2021-03-15",
        endDate: "2022-06-19"
      }
    ],
    letters: [
      {
        id: "LTR004",
        type: "Offer Letter",
        date: "2022-06-15",
        description: "Marketing Manager Position Offer"
      },
      {
        id: "LTR005",
        type: "Salary Revision",
        date: "2023-06-01",
        description: "Annual Salary Review"
      }
    ]
  },
  {
    id: "EMP003",
    name: "Michael Johnson",
    email: "michael.j@example.com",
    department: "Sales",
    position: "Sales Manager",
    status: "Active",
    joinDate: "2023-03-10",
    salary: 78000,
    payBreakdown: {
      baseSalary: 65000,
      bonus: 10000,
      allowances: 3000,
      deductions: 0
    },
    previousPositions: [
      {
        position: "Sales Executive",
        department: "Sales",
        startDate: "2021-09-01",
        endDate: "2023-03-09"
      }
    ],
    letters: [
      {
        id: "LTR006",
        type: "Promotion Letter",
        date: "2023-03-05",
        description: "Promotion to Sales Manager"
      }
    ]
  },
  {
    id: "EMP004",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    department: "Finance",
    position: "Financial Analyst",
    status: "Active",
    joinDate: "2022-11-05",
    salary: 65000,
    payBreakdown: {
      baseSalary: 55000,
      bonus: 7000,
      allowances: 3000,
      deductions: 0
    },
    previousPositions: [],
    letters: [
      {
        id: "LTR007",
        type: "Offer Letter",
        date: "2022-10-28",
        description: "Financial Analyst Position Offer"
      }
    ]
  },
  {
    id: "EMP005",
    name: "David Brown",
    email: "david.brown@example.com",
    department: "Operations",
    position: "Operations Coordinator",
    status: "On Leave",
    joinDate: "2023-02-01",
    salary: 58000,
    payBreakdown: {
      baseSalary: 50000,
      bonus: 5000,
      allowances: 3000,
      deductions: 0
    },
    previousPositions: [],
    letters: [
      {
        id: "LTR008",
        type: "Offer Letter",
        date: "2023-01-25",
        description: "Operations Coordinator Position Offer"
      }
    ]
  },
  {
    id: "EMP006",
    name: "Jessica Davis",
    email: "jessica.davis@example.com",
    department: "HR",
    position: "HR Manager",
    status: "Active",
    joinDate: "2021-09-12",
    salary: 70000,
    payBreakdown: {
      baseSalary: 58000,
      bonus: 9000,
      allowances: 3000,
      deductions: 0
    },
    previousPositions: [
      {
        position: "HR Executive",
        department: "HR",
        startDate: "2020-01-10",
        endDate: "2021-09-11"
      }
    ],
    letters: [
      {
        id: "LTR009",
        type: "Promotion Letter",
        date: "2021-09-08",
        description: "Promotion to HR Manager"
      },
      {
        id: "LTR010",
        type: "Salary Revision",
        date: "2023-01-01",
        description: "Annual Salary Review & Increment"
      }
    ]
  },
  {
    id: "EMP007",
    name: "Robert Martinez",
    email: "robert.m@example.com",
    department: "Engineering",
    position: "Junior Developer",
    status: "Active",
    joinDate: "2023-08-22",
    salary: 55000,
    payBreakdown: {
      baseSalary: 48000,
      bonus: 4000,
      allowances: 3000,
      deductions: 0
    },
    previousPositions: [],
    letters: [
      {
        id: "LTR011",
        type: "Offer Letter",
        date: "2023-08-15",
        description: "Junior Developer Position Offer"
      }
    ]
  },
  {
    id: "EMP008",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    department: "Logistics",
    position: "Logistics Manager",
    status: "Active",
    joinDate: "2022-04-18",
    salary: 68000,
    payBreakdown: {
      baseSalary: 57000,
      bonus: 8000,
      allowances: 3000,
      deductions: 0
    },
    previousPositions: [
      {
        position: "Logistics Coordinator",
        department: "Logistics",
        startDate: "2021-06-01",
        endDate: "2022-04-17"
      }
    ],
    letters: [
      {
        id: "LTR012",
        type: "Promotion Letter",
        date: "2022-04-12",
        description: "Promotion to Logistics Manager"
      },
      {
        id: "LTR013",
        type: "Salary Revision",
        date: "2023-04-01",
        description: "Annual Salary Review"
      }
    ]
  }
];
