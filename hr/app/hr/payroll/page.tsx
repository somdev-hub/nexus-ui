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
import { Eye, Download } from "lucide-react";
import { useState } from "react";
import { payrollData, type PayrollRecord } from "./data";

export default function PayrollPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const filteredPayroll = payrollData.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterMonth || record.month === filterMonth)
  );

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
      accessorKey: "status",
      header: "Status"
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: PayrollRecord) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const totalNetSalary = filteredPayroll.reduce(
    (sum, record) => sum + record.netSalary,
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Payroll Management
        </h1>
        <p className="text-gray-500 mt-2">
          Handle salary, deductions, and payroll processing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">
              Total Salaries (This Period)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">
              ${totalNetSalary.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">
              {filteredPayroll.filter((r) => r.status === "Processed").length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">
              {filteredPayroll.filter((r) => r.status === "Pending").length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">
              {filteredPayroll.filter((r) => r.status === "On Hold").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search employee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            <SelectItem value="December 2024">December 2024</SelectItem>
            <SelectItem value="November 2024">November 2024</SelectItem>
            <SelectItem value="October 2024">October 2024</SelectItem>
            <SelectItem value="September 2024">September 2024</SelectItem>
          </SelectContent>
        </Select>
        <Button>Process Payroll</Button>
        <Button variant="outline">Export Payroll</Button>
      </div>

      <Card className="p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>
            Total Records: {filteredPayroll.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <HRTable columns={columns} data={filteredPayroll} />
        </CardContent>
      </Card>
    </div>
  );
}
