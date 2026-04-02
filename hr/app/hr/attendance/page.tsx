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
import { DatePicker } from "@/components/ui/date-picker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { getAttendanceRecords } from "@/lib/auth-service";
import type { AttendanceRecord, AttendancePageResponse } from "@/types";

// Helper function to format date to YYYY-MM-DD
const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to format date with full month name
const formatDateFull = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric"
  });
};

// Helper function to format ISO datetime to time string
const formatTime = (iso: string): string => {
  if (!iso) return "-";
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "-";
  }
};

// Helper function to format ISO date to date string
const formatISODate = (iso: string): string => {
  if (!iso) return "-";
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
  } catch {
    return "-";
  }
};

export default function AttendancePage() {
  const orgIdString = useOrgId();
  const orgId = orgIdString ? parseInt(orgIdString) : 0;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] =
    useState<AttendancePageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch attendance records
  const fetchAttendance = async (page: number = 0) => {
    if (orgId === 0) return;

    setLoading(true);
    setError(null);
    try {
      const dateString = formatDateISO(selectedDate);
      const response = await getAttendanceRecords(
        orgId,
        dateString,
        page,
        pageSize
      );
      setAttendanceData(response);
      setCurrentPage(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch attendance records"
      );
      console.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount and when date changes
  useEffect(() => {
    if (orgId > 0) {
      fetchAttendance(0);
    }
  }, [selectedDate, orgId]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Filter data based on search and status
  const filteredData = (attendanceData?.content || []).filter((record) => {
    const matchesSearch = record.employeeName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      !filterStatus || filterStatus === "all" || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: (record) => formatISODate(record.date)
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
      accessorKey: "checkInTime",
      header: "Check In",
      cell: (record) => formatTime(record.checkInTime)
    },
    {
      accessorKey: "checkOutTime",
      header: "Check Out",
      cell: (record) => formatTime(record.checkOutTime)
    },
    {
      accessorKey: "totalHoursWorked",
      header: "Hours Worked",
      cell: (record) => record.totalHoursWorked.toFixed(2)
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (record) => (
        <Badge variant={record.status === "PRESENT" ? "default" : "secondary"}>
          {record.status}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
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

  const presentCount = filteredData.filter(
    (r) => r.status === "PRESENT"
  ).length;
  const absentCount = filteredData.filter((r) => r.status === "ABSENT").length;
  const lateCount = filteredData.filter((r) => r.status === "LATE").length;

  if (orgId === 0) {
    return <div className="p-6">Loading organization information...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Management
        </h1>
        <p className="text-gray-500 mt-2">
          Track employee attendance and leave - {formatDateFull(selectedDate)}
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
            <p className="text-2xl font-bold">
              {attendanceData?.totalElements || 0}
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="HALF_DAY">Half Day</SelectItem>
          </SelectContent>
        </Select>
        <Button>Mark Attendance</Button>
        <Button variant="outline">Generate Report</Button>
      </div>

      <Card className="p-4 gap-2">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Total Records: {attendanceData?.totalElements || 0}
            </CardDescription>
          </div>
          <DatePicker
            date={selectedDate}
            onDateChange={handleDateSelect}
            disabled={(date) =>
              date > new Date() || date < new Date("2020-01-01")
            }
            placeholder="Select date"
          />
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-800 rounded">
              {error}
            </div>
          )}
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Loading attendance records...
            </div>
          )}
          {!loading && !error && (
            <>
              <HRTable columns={columns} data={filteredData} />

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                {/* <div className="text-sm text-gray-600">
                  Page {currentPage + 1} of {attendanceData?.totalPages || 1}
                  {attendanceData &&
                    ` (${attendanceData.totalElements} total records)`}
                </div> */}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 0 && !loading) {
                            fetchAttendance(currentPage - 1);
                          }
                        }}
                        className={
                          currentPage === 0 || loading
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive
                        onClick={(e) => e.preventDefault()}
                      >
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            attendanceData &&
                            currentPage < attendanceData.totalPages - 1 &&
                            !loading
                          ) {
                            fetchAttendance(currentPage + 1);
                          }
                        }}
                        className={
                          !attendanceData ||
                          currentPage >=
                            (attendanceData?.totalPages || 1) - 1 ||
                          loading
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
