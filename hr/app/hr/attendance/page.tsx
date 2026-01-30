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
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { attendanceData, type AttendanceRecord } from "./data";

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredAttendance = attendanceData.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterStatus || record.status === filterStatus)
  );

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "date",
      header: "Date"
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID"
    },
    {
      accessorKey: "employeeName",
      header: "Employee Name"
    },
    {
      accessorKey: "checkIn",
      header: "Check In"
    },
    {
      accessorKey: "checkOut",
      header: "Check Out"
    },
    {
      accessorKey: "hoursWorked",
      header: "Hours Worked"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (row: AttendanceRecord) => (
        <Badge variant={row.status === "Present" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: AttendanceRecord) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const presentCount = filteredAttendance.filter(
    (r) => r.status === "Present"
  ).length;
  const absentCount = filteredAttendance.filter(
    (r) => r.status === "Absent"
  ).length;
  const lateCount = filteredAttendance.filter(
    (r) => r.status === "Late"
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Management
        </h1>
        <p className="text-gray-500 mt-2">
          Track employee attendance and leave
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">{filteredAttendance.length}</p>
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="Late">Late</SelectItem>
            <SelectItem value="Half Day">Half Day</SelectItem>
          </SelectContent>
        </Select>
        <Button>Mark Attendance</Button>
        <Button variant="outline">Generate Report</Button>
      </div>

      <Card className="p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Total Records: {filteredAttendance.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <HRTable columns={columns} data={filteredAttendance} />
        </CardContent>
      </Card>
    </div>
  );
}
