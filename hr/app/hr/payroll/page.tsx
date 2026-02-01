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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Eye,
  Download,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Zap,
  BarChart3
} from "lucide-react";
import { useState, useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  SalaryVarianceByRole,
  DeptWiseSalaryDistribution,
  PayrollTrendChart,
  PayrollStatusBreakdown,
  SalaryComponentsBreakdown
} from "@/components/charts";
import { payrollData, type PayrollRecord } from "./data";

export default function PayrollPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("February 2026");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPayroll = payrollData.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterMonth === "all" || record.month === filterMonth)
  );

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const total = filteredPayroll.length;
    const processed = filteredPayroll.filter(
      (r) => r.status === "Processed"
    ).length;
    const pending = filteredPayroll.filter(
      (r) => r.status === "Pending"
    ).length;
    const onHold = filteredPayroll.filter((r) => r.status === "On Hold").length;

    const totalNetSalary = filteredPayroll.reduce(
      (sum, r) => sum + r.netSalary,
      0
    );
    const totalBaseSalary = filteredPayroll.reduce(
      (sum, r) => sum + r.baseSalary,
      0
    );
    const totalBonus = filteredPayroll.reduce((sum, r) => sum + r.bonus, 0);
    const totalDeductions = filteredPayroll.reduce(
      (sum, r) => sum + r.deductions,
      0
    );
    const totalOvertimeCost = filteredPayroll.reduce(
      (sum, r) => sum + r.overtimeCost,
      0
    );
    const totalPayrollCost = totalNetSalary + totalOvertimeCost;
    const avgSalary = total > 0 ? totalNetSalary / total : 0;
    const avgBonus = total > 0 ? totalBonus / total : 0;

    // Department-wise salary distribution
    const deptDistribution = filteredPayroll.reduce(
      (acc, record) => {
        if (!acc[record.department]) {
          acc[record.department] = 0;
        }
        acc[record.department] += record.netSalary;
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
  }, [filteredPayroll]);

  // Prepare data for salary variance by role (stacked)
  const roleDistributionData = filteredPayroll.reduce(
    (acc, record) => {
      const existingRole = acc.find((r) => r.name === record.position);
      if (existingRole) {
        existingRole.base += record.baseSalary;
        existingRole.bonus += record.bonus;
      } else {
        acc.push({
          name: record.position,
          base: record.baseSalary,
          bonus: record.bonus
        });
      }
      return acc;
    },
    [] as Array<{ name: string; base: number; bonus: number }>
  );

  // Prepare data for department-wise salary distribution (stacked)
  const deptDistributionData = filteredPayroll.reduce(
    (acc, record) => {
      const existingDept = acc.find((d) => d.name === record.department);
      if (existingDept) {
        existingDept.base += record.baseSalary;
        existingDept.bonus += record.bonus;
      } else {
        acc.push({
          name: record.department,
          base: record.baseSalary,
          bonus: record.bonus
        });
      }
      return acc;
    },
    [] as Array<{ name: string; base: number; bonus: number }>
  );

  // Prepare data for 6-month trend (last 6 months payroll spend)
  const monthlyTrendData = [
    { month: "Jul 2024", payroll: 428000, overtime: 2100 },
    { month: "Aug 2024", payroll: 432000, overtime: 600 },
    { month: "Sep 2024", payroll: 455000, overtime: 1800 },
    { month: "Oct 2024", payroll: 450000, overtime: 2800 },
    { month: "Nov 2024", payroll: 460000, overtime: 2900 },
    { month: "Dec 2024", payroll: 488000, overtime: 10900 }
  ];

  // Prepare data for status breakdown
  const statusData = [
    { name: "Processed", value: metrics.processed, color: "#10b981" },
    { name: "Pending", value: metrics.pending, color: "#f59e0b" },
    { name: "On Hold", value: metrics.onHold, color: "#ef4444" }
  ];

  // Prepare data for salary components breakdown
  const componentData = [
    {
      component: "Base Salary",
      amount: metrics.totalBaseSalary,
      color: "#3b82f6"
    },
    { component: "Bonus", amount: metrics.totalBonus, color: "#10b981" },
    {
      component: "Deductions",
      amount: metrics.totalDeductions,
      color: "#ef4444"
    }
  ];

  const columns: ColumnDef<PayrollRecord>[] = [
    {
      accessorKey: "employeeId",
      header: "Employee ID"
    },
    {
      accessorKey: "employeeName",
      header: "Employee Name"
    },
    {
      accessorKey: "month",
      header: "Month"
    },
    {
      accessorKey: "baseSalary",
      header: "Base Salary",
      cell: (row: PayrollRecord) => `$${row.baseSalary.toLocaleString()}`
    },
    {
      accessorKey: "bonus",
      header: "Bonus",
      cell: (row: PayrollRecord) => `$${row.bonus.toLocaleString()}`
    },
    {
      accessorKey: "deductions",
      header: "Deductions",
      cell: (row: PayrollRecord) => `$${row.deductions.toLocaleString()}`
    },
    {
      accessorKey: "netSalary",
      header: "Net Salary",
      cell: (row: PayrollRecord) => `$${row.netSalary.toLocaleString()}`
    },
    {
      accessorKey: "overtimeCost",
      header: "Overtime",
      cell: (row: PayrollRecord) => `$${row.overtimeCost.toLocaleString()}`
    },
    {
      accessorKey: "totalPayout",
      header: "Total Payout",
      cell: (row: PayrollRecord) => (
        <span className="font-semibold text-green-600">
          ${row.totalPayout.toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (row: PayrollRecord) => {
        const variant =
          row.status === "Processed"
            ? "default"
            : row.status === "Pending"
              ? "secondary"
              : "destructive";
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: PayrollRecord) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            title="View Details"
            onClick={() => {
              setSelectedPayroll(row);
              setIsDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
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
      </div>

      {/* Month Filter at Top */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Select Month:</span>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            <SelectItem value="December 2024">December 2024</SelectItem>
            <SelectItem value="November 2024">November 2024</SelectItem>
            <SelectItem value="October 2024">October 2024</SelectItem>
            <SelectItem value="September 2024">September 2024</SelectItem>
            <SelectItem value="August 2024">August 2024</SelectItem>
            <SelectItem value="July 2024">July 2024</SelectItem>
            <SelectItem value="February 2026">February 2026</SelectItem>
          </SelectContent>
        </Select>
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
              ${metrics.totalNetSalary.toLocaleString()}
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
              ${metrics.totalPayrollCost.toLocaleString()}
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
              $
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
              ${metrics.totalDeductions.toLocaleString()}
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
              ${metrics.totalOvertimeCost.toLocaleString()}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalaryVarianceByRole data={roleDistributionData} />
        <PayrollTrendChart data={monthlyTrendData} />
      </div>

      {/* Department-wise and Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department-wise Salary Distribution */}
        <DeptWiseSalaryDistribution data={deptDistributionData} />

        {/* Status Breakdown Pie Chart */}
        <PayrollStatusBreakdown data={statusData} />
      </div>

      {/* Salary Components Chart */}
      <SalaryComponentsBreakdown data={componentData} />

      {/* Filters and Actions */}
      <div className="flex gap-4 flex-wrap items-center">
        <Input
          placeholder="Search employee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 ml-auto">
          <Button>
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
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>
            Total Records: {filteredPayroll.length} | Total Net Salary: $
            {metrics.totalNetSalary.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <HRTable columns={columns} data={filteredPayroll} />
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Review payment breakdown and revisions for{" "}
              {selectedPayroll?.employeeName}
            </DialogDescription>
          </DialogHeader>

          {selectedPayroll && (
            <div className="space-y-6 py-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee Name</p>
                  <p className="font-semibold">
                    {selectedPayroll.employeeName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-semibold">{selectedPayroll.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{selectedPayroll.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Month</p>
                  <p className="font-semibold">{selectedPayroll.month}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Payment Revisions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Base Salary</span>
                    <span>${selectedPayroll.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bonus</span>
                    <span className="text-green-600">
                      +${selectedPayroll.bonus.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overtime Cost</span>
                    <span className="text-green-600">
                      +${selectedPayroll.overtimeCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Allowances</span>
                    <span className="text-green-600">
                      +${selectedPayroll.allowances.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Absent Days Deduction</span>
                    <span className="text-red-600">
                      -$
                      {(
                        selectedPayroll.absentDays *
                        (selectedPayroll.baseSalary / 22)
                      ).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Deductions (Taxes, Insurance, etc.)
                    </span>
                    <span className="text-red-600">
                      -${selectedPayroll.deductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3 flex justify-between items-center font-semibold text-base">
                    <span>Net Salary</span>
                    <span>${selectedPayroll.netSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Absent Days</span>
                  <span className="font-semibold">
                    {selectedPayroll.absentDays}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                  <span className="font-semibold">Total Payout Amount</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${selectedPayroll.totalPayout.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Current Status:
                </span>
                <Badge
                  variant={
                    selectedPayroll.status === "Processed"
                      ? "default"
                      : selectedPayroll.status === "Pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {selectedPayroll.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {selectedPayroll?.status !== "Processed" && (
              <Button
                onClick={() => {
                  toast.success(
                    `Payment of $${selectedPayroll?.totalPayout.toLocaleString()} processed successfully for ${selectedPayroll?.employeeName}!`
                  );
                  setIsDialogOpen(false);
                }}
              >
                Process Payment
              </Button>
            )}
            {selectedPayroll?.status === "Processed" && (
              <Button disabled variant="secondary">
                Already Processed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
