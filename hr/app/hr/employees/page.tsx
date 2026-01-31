"use client";

import { HRTable, type ColumnDef } from "@/components/hr-table";
import { EmployeeFilter } from "@/components/employee-filter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  Users,
  Building2,
  Users2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { employees as dummyEmployees } from "./data";
// import apiClient from "@/lib/api-client";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
  salary: number;
  gender?: "Male" | "Female" | "Other";
  noticePerioddDays?: number;
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState(dummyEmployees);
  // Using dummy data from data.ts
  const [isLoading] = useState(false);

  /*
  // API FETCHING LOGIC - COMMENTED OUT FOR NOW
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);

  // Get orgId from localStorage
  const getOrgId = (): string => {
    if (typeof window === "undefined") return "";
    const authUser = localStorage.getItem("auth_user");
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        return user.organizationId || "1"; // Fallback to "1" if not available
      } catch {
        return "1";
      }
    }
    return "1";
  };

  // Fetch employees from API
  const fetchEmployees = async (pageNo: number = 0) => {
    try {
      setIsLoading(true);
      const orgId = getOrgId();
      const response = await apiClient.get<EmployeesApiResponse>(
        `/iam/users/employees?orgId=${orgId}&page=${pageNo}&pageOffset=${pageSize}`
      );

      const { content, totalPages: pages } = response.data;
      setEmployees(content as Employee[]);
      setTotalPages(pages);
      setCurrentPage(pageNo);

      if (content.length > 0) {
        toast.success(`Loaded ${content.length} employees`);
      } else {
        toast.info("No employees found");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch employees";
      toast.error(errorMessage);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees(0);
  }, []);
  */

  // Filter employees based on search term and filter state
  const searchFilteredEmployees = useMemo(
    () =>
      filteredEmployees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, filteredEmployees]
  );

  // Calculate metrics based on filtered employees
  const metrics = useMemo(() => {
    const totalEmployees = filteredEmployees.length;

    // Department/Employee ratio
    const deptRatio = filteredEmployees.reduce(
      (acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Gender ratio
    const genderRatio = filteredEmployees.reduce(
      (acc, emp) => {
        const gender = emp.gender || "Other";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Employees on notice period
    const onNoticePeriod = filteredEmployees.filter(
      (emp) => emp.noticePerioddDays && emp.noticePerioddDays > 0
    ).length;

    return {
      totalEmployees,
      deptRatio,
      genderRatio,
      onNoticePeriod
    };
  }, [filteredEmployees]);

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "id",
      header: "ID"
    },
    {
      accessorKey: "name",
      header: "Name"
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "department",
      header: "Department"
    },
    {
      accessorKey: "position",
      header: "Position"
    },
    {
      accessorKey: "salary",
      header: "Salary",
      cell: (row: Employee) => `$${row.salary.toLocaleString()}`
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: (row: Employee) =>
        new Date(row.joinDate).toLocaleDateString("en-US")
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: Employee) => (
        <div className="flex gap-2">
          <Link href={`/hr/employees/${row.id}`}>
            <Button size="sm" variant="ghost">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button size="sm" variant="ghost">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-green-600"
            onClick={() =>
              toast.info("Please visit employee detail page to promote")
            }
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500"
            onClick={() =>
              toast.error("Delete functionality not yet implemented")
            }
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" richColors />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-gray-500 mt-2">
            Manage employee information and profiles
          </p>
        </div>
        <Link href="/hr/employees/add">
          <Button>Add Employee</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <EmployeeFilter
          employees={dummyEmployees}
          onFilterChange={setFilteredEmployees}
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>

        {/* Department/Employee Ratio */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">
              {Object.keys(metrics.deptRatio).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(metrics.deptRatio)
                .map(([dept, count]) => `${dept}: ${count}`)
                .join(", ")}
            </p>
          </CardContent>
        </Card>

        {/* Gender Ratio */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">Gender Ratio</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm font-bold">
              {Object.entries(metrics.genderRatio)
                .map(([gender, count]) => `${gender}: ${count}`)
                .join(" • ")}
            </div>
            <p className="text-xs text-muted-foreground">
              Workforce composition
            </p>
          </CardContent>
        </Card>

        {/* Employees on Notice Period */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">
              On Notice Period
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">{metrics.onNoticePeriod}</div>
            <p className="text-xs text-muted-foreground">Upcoming departures</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>
            Total Employees: {searchFilteredEmployees.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <HRTable columns={columns} data={searchFilteredEmployees} />
          )}
        </CardContent>
      </Card>
      {/* 
      Pagination disabled - using dummy data
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          <Button
            onClick={() => fetchEmployees(currentPage - 1)}
            disabled={currentPage === 0 || isLoading}
            variant="outline"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            onClick={() => fetchEmployees(currentPage + 1)}
            disabled={currentPage === totalPages - 1 || isLoading}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
      */}
    </div>
  );
}
