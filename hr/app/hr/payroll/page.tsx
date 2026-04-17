"use client";

import { HRTable, type ColumnDef } from "@/components/hr-table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Download,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Zap,
  BarChart3,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  SalaryVarianceByRole,
  DeptWiseSalaryDistribution,
  PayrollTrendChart,
  PayrollStatusBreakdown,
  SalaryComponentsBreakdown
} from "@/components/charts";
import { ProcessPayrollDialog } from "@/components/process-payroll-dialog";
import { getProcessedPayrolls, getPayrollGraphs } from "@/lib/auth-service";
import { payrollData } from "./data";
import type { ProcessedPayrollRecord } from "@/types";

export default function PayrollPage() {
  const { orgId } = useUserMetadata();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("April 2026");
  const [isProcessPayrollDialogOpen, setIsProcessPayrollDialogOpen] =
    useState(false);

  // Processed Payroll Data
  const [processedPayrolls, setProcessedPayrolls] = useState<
    ProcessedPayrollRecord[]
  >([]);
  const [isLoadingProcessed, setIsLoadingProcessed] = useState(false);
  const [pageNo, setPageNo] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Graph Data State
  const [roleDistributionData, setRoleDistributionData] = useState<
    Array<{ name: string; base: number; bonus: number }>
  >([]);
  const [deptDistributionData, setDeptDistributionData] = useState<
    Array<{ name: string; base: number; bonus: number }>
  >([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<
    Array<{ month: string; payroll: number; overtime: number }>
  >([]);
  const [statusData, setStatusData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [componentData, setComponentData] = useState<
    Array<{ component: string; amount: number; color: string }>
  >([]);

  // Parse month and year from filterMonth string (e.g., "April 2026" -> month: 4, year: 2026)
  const parseMonthYear = (monthStr: string) => {
    const months: Record<string, number> = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12
    };

    const parts = monthStr.split(" ");
    const monthName = parts[0];
    const year = parseInt(parts[1], 10);
    const month = months[monthName] || new Date().getMonth() + 1;

    return { month, year };
  };

  // Fetch processed payrolls when filter changes
  useEffect(() => {
    if (!orgId) return;

    const fetchProcessedPayrolls = async () => {
      setIsLoadingProcessed(true);
      try {
        const { month, year } = parseMonthYear(filterMonth);
        const response = await getProcessedPayrolls(
          orgId,
          month,
          year,
          pageNo,
          pageSize
        );
        setProcessedPayrolls(response.content);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error("Failed to fetch processed payrolls:", error);
        toast.error("Failed to load processed payroll records");
        setProcessedPayrolls([]);
      } finally {
        setIsLoadingProcessed(false);
      }
    };

    fetchProcessedPayrolls();
  }, [orgId, filterMonth, pageNo, pageSize]);

  // Fetch graph data when filter month changes
  useEffect(() => {
    if (!orgId) return;

    const fetchGraphData = async () => {
      try {
        const { month, year } = parseMonthYear(filterMonth);
        const response = await getPayrollGraphs(orgId, month, year);

        // Transform salary vs role data
        const roleData = response.salaryVsRole
          .filter((r) => r.employeeCount > 0)
          .map((r) => ({
            name: r.role,
            base: r.baseSalary,
            bonus: r.bonus
          }));
        setRoleDistributionData(roleData);

        // Transform salary vs department data
        const deptData = response.salaryVsDept.map((d) => ({
          name: d.dept,
          base: d.baseSalary,
          bonus: d.bonus
        }));
        setDeptDistributionData(deptData);

        // Transform salary vs overtime data (monthly trend)
        const trendData = response.salaryVsOvertime.map((o) => ({
          month: `${o.month} ${o.year}`,
          payroll: o.totalSalary,
          overtime: o.overtimePay
        }));
        setMonthlyTrendData(trendData);

        // Transform salary vs status data
        const statusBreakdown = response.salaryVsStatus.map((s) => {
          let color = "#10b981"; // green for COMPLETED
          if (s.status === "PENDING") color = "#f59e0b"; // amber
          if (s.status === "FAILED") color = "#ef4444"; // red
          return {
            name: s.status,
            value: s.noOfPayrolls,
            color
          };
        });
        setStatusData(statusBreakdown);

        // Transform salary vs component data
        const components = [
          {
            component: "Base Salary",
            amount: response.salaryVsComponent.baseSalary,
            color: "#3b82f6"
          },
          {
            component: "Bonus",
            amount: response.salaryVsComponent.bonus,
            color: "#10b981"
          },
          {
            component: "Deductions",
            amount: response.salaryVsComponent.deduction,
            color: "#ef4444"
          }
        ];
        setComponentData(components);
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
        toast.error("Failed to load payroll graphs");
      }
    };

    fetchGraphData();
  }, [orgId, filterMonth]);

  const filteredPayroll = payrollData.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterMonth === "all" || record.month === filterMonth)
  );

  // Filter processed payrolls by search term
  const filteredProcessedPayrolls = processedPayrolls.filter((record) =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate comprehensive metrics from processed payrolls
  const metrics = useMemo(() => {
    const total = filteredProcessedPayrolls.length;
    // All records from the API are processed payrolls by nature
    const processed = total;
    const pending = 0;
    const onHold = 0;

    const totalNetSalary = filteredProcessedPayrolls.reduce(
      (sum, r) => sum + r.netPay,
      0
    );
    const totalBaseSalary = filteredProcessedPayrolls.reduce(
      (sum, r) => sum + r.basePay,
      0
    );
    const totalBonus = filteredProcessedPayrolls.reduce(
      (sum, r) => sum + r.totalBonuses,
      0
    );
    const totalDeductions = filteredProcessedPayrolls.reduce(
      (sum, r) => sum + r.totalDeductions,
      0
    );
    const totalOvertimeCost = filteredProcessedPayrolls.reduce(
      (sum, r) => sum + r.totalOvertimeFee,
      0
    );
    const totalPayrollCost = totalNetSalary + totalOvertimeCost;
    const avgSalary = total > 0 ? totalNetSalary / total : 0;
    const avgBonus = total > 0 ? totalBonus / total : 0;

    // Department-wise salary distribution
    const deptDistribution = filteredProcessedPayrolls.reduce(
      (acc, record) => {
        const dept = record.department || "Unknown";
        if (!acc[dept]) {
          acc[dept] = 0;
        }
        acc[dept] += record.netPay;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      processed,
      pending,
      onHold,
      totalNetSalary,
      totalBaseSalary,
      totalBonus,
      totalDeductions,
      totalOvertimeCost,
      totalPayrollCost,
      avgSalary,
      avgBonus,
      deptDistribution
    };
  }, [filteredProcessedPayrolls]);

  const columns: ColumnDef<ProcessedPayrollRecord>[] = [
    {
      accessorKey: "empId",
      header: "Employee ID"
    },
    {
      accessorKey: "name",
      header: "Employee Name"
    },
    {
      accessorKey: "department",
      header: "Department"
    },
    {
      accessorKey: "basePay",
      header: "Base Pay",
      cell: (row: ProcessedPayrollRecord) => `₹${row.basePay.toLocaleString()}`
    },
    {
      accessorKey: "hra",
      header: "HRA",
      cell: (row: ProcessedPayrollRecord) => `₹${row.hra.toLocaleString()}`
    },
    {
      accessorKey: "totalBonuses",
      header: "Bonus",
      cell: (row: ProcessedPayrollRecord) =>
        `₹${row.totalBonuses.toLocaleString()}`
    },
    {
      accessorKey: "totalDeductions",
      header: "Deductions",
      cell: (row: ProcessedPayrollRecord) =>
        `₹${row.totalDeductions.toLocaleString()}`
    },
    {
      accessorKey: "totalOvertimeFee",
      header: "Overtime",
      cell: (row: ProcessedPayrollRecord) =>
        `₹${row.totalOvertimeFee.toLocaleString()}`
    },
    {
      accessorKey: "grossPay",
      header: "Gross Pay",
      cell: (row: ProcessedPayrollRecord) => `₹${row.grossPay.toLocaleString()}`
    },
    {
      accessorKey: "netPay",
      header: "Net Pay",
      cell: (row: ProcessedPayrollRecord) => (
        <span className="font-semibold text-green-600">
          ₹{row.netPay.toLocaleString()}
        </span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" title="Download Slip">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Payroll Management
          </h1>
          <p className="text-gray-500 mt-2">
            Comprehensive payroll dashboard with salary analysis and processing
          </p>
        </div>
        {/* Month Filter at Top */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Select Month:</span>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="April 2026">April 2026</SelectItem>
              <SelectItem value="March 2026">March 2026</SelectItem>
              <SelectItem value="February 2026">February 2026</SelectItem>
              <SelectItem value="January 2026">January 2026</SelectItem>
              <SelectItem value="December 2025">December 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Salaries */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">
              Total Net Salaries
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">
              ₹{metrics.totalNetSalary.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredPayroll.length} employees
            </p>
          </CardContent>
        </Card>

        {/* Processed Payroll */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">{metrics.processed}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0
                ? ((metrics.processed / metrics.total) * 100).toFixed(0)
                : 0}
              % completed
            </p>
          </CardContent>
        </Card>

        {/* Pending Payroll */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">{metrics.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        {/* On Hold Payroll */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">{metrics.onHold}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Payroll Cost */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">
              Total Payroll Cost
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">
              ₹{metrics.totalPayrollCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month (incl. overtime)
            </p>
          </CardContent>
        </Card>

        {/* Average Net Salary */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">
              Average Net Salary
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">
              ₹
              {metrics.avgSalary.toLocaleString("en-US", {
                maximumFractionDigits: 0
              })}
            </div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>

        {/* Total Deductions */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">
              Total Deductions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">
              ₹{metrics.totalDeductions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (metrics.totalDeductions / metrics.totalBaseSalary) *
                100
              ).toFixed(1)}
              % of base salary
            </p>
          </CardContent>
        </Card>

        {/* Overtime Cost */}
        <Card className="p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="text-sm font-medium">Overtime Cost</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <div className="text-2xl font-bold">
              ₹{metrics.totalOvertimeCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (metrics.totalOvertimeCost / metrics.totalNetSalary) *
                100
              ).toFixed(1)}
              % of net salary
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SalaryVarianceByRole data={roleDistributionData} />
        <PayrollTrendChart data={monthlyTrendData} />
        <DeptWiseSalaryDistribution data={deptDistributionData} />
      </div>

      {/* Department-wise and Status Charts */}
      <div className="flex justify-between items-center gap-4">
        {/* Department-wise Salary Distribution */}

        {/* Status Breakdown Pie Chart */}
        <div className="flex-1">
          <PayrollStatusBreakdown data={statusData} />
        </div>
        <div className="flex-2">
          <SalaryComponentsBreakdown data={componentData} />
        </div>
      </div>

      {/* Salary Components Chart */}

      {/* Filters and Actions */}
      <div className="flex gap-4 flex-wrap items-center">
        <Input
          placeholder="Search employee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 ml-auto">
          <Button onClick={() => setIsProcessPayrollDialogOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Process Payroll
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Payroll
          </Button>
        </div>
      </div>

      {/* Payroll Records Table */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>Processed Payroll Records</CardTitle>
          <CardDescription>
            Total Records: {filteredProcessedPayrolls.length} | Total Net Pay: ₹
            {metrics.totalNetSalary.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {isLoadingProcessed ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <HRTable columns={columns} data={filteredProcessedPayrolls} />

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Page {pageNo + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPageNo(Math.max(0, pageNo - 1))}
                    disabled={pageNo === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPageNo(pageNo + 1)}
                    disabled={pageNo >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Process Payroll Dialog */}
      <ProcessPayrollDialog
        open={isProcessPayrollDialogOpen}
        onOpenChange={setIsProcessPayrollDialogOpen}
      />
    </div>
  );
}
