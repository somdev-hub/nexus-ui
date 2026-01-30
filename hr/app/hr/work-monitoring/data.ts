export interface WorkTask {
  id: string;
  taskId: string;
  employeeName: string;
  taskName: string;
  project: string;
  progress: number;
  hoursLogged: string;
  dueDate: string;
  status: "On Track" | "At Risk" | "Delayed" | "Completed";
}

export const workMonitoringData: WorkTask[] = [
  {
    id: "TASK001",
    taskId: "T001",
    employeeName: "John Doe",
    taskName: "API Development",
    project: "Backend System",
    progress: 85,
    hoursLogged: "32/40",
    dueDate: "2024-12-25",
    status: "On Track"
  },
  {
    id: "TASK002",
    taskId: "T002",
    employeeName: "Sarah Smith",
    taskName: "Marketing Campaign Design",
    project: "Q1 Campaign",
    progress: 60,
    hoursLogged: "24/30",
    dueDate: "2024-12-30",
    status: "On Track"
  },
  {
    id: "TASK003",
    taskId: "T003",
    employeeName: "Michael Johnson",
    taskName: "Sales Report Analysis",
    project: "Monthly Reports",
    progress: 45,
    hoursLogged: "12/20",
    dueDate: "2024-12-22",
    status: "At Risk"
  },
  {
    id: "TASK004",
    taskId: "T004",
    employeeName: "Emma Wilson",
    taskName: "Financial Reconciliation",
    project: "Monthly Closing",
    progress: 100,
    hoursLogged: "16/16",
    dueDate: "2024-12-20",
    status: "Completed"
  },
  {
    id: "TASK005",
    taskId: "T005",
    employeeName: "David Brown",
    taskName: "Inventory Update",
    project: "Stock Management",
    progress: 30,
    hoursLogged: "8/24",
    dueDate: "2024-12-28",
    status: "On Track"
  },
  {
    id: "TASK006",
    taskId: "T006",
    employeeName: "Jessica Davis",
    taskName: "Employee Onboarding",
    project: "HR Operations",
    progress: 20,
    hoursLogged: "4/20",
    dueDate: "2024-12-24",
    status: "Delayed"
  },
  {
    id: "TASK007",
    taskId: "T007",
    employeeName: "Robert Martinez",
    taskName: "Database Optimization",
    project: "Backend System",
    progress: 70,
    hoursLogged: "28/35",
    dueDate: "2024-12-27",
    status: "On Track"
  },
  {
    id: "TASK008",
    taskId: "T008",
    employeeName: "Lisa Anderson",
    taskName: "Shipping Documentation",
    project: "Logistics Process",
    progress: 90,
    hoursLogged: "36/40",
    dueDate: "2024-12-23",
    status: "On Track"
  }
];
