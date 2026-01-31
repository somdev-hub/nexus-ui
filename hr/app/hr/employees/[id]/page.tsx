"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { employees } from "../data";
import { AttendanceGraph } from "@/components/attendance-graph";
import { getEmployeeAttendance } from "./attendance";
import {
  ArrowLeft,
  Edit,
  Trash2,
  TrendingUp,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useState } from "react";
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailPage(props: PageProps) {
  const params = React.use(props.params);
  // Using dummy data from data.ts
  const employee = employees.find((emp) => emp.id === params.id);

  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [isSendMailDialogOpen, setIsSendMailDialogOpen] = useState(false);
  const [attendancePage, setAttendancePage] = useState(1);
  const [payrollPage, setPayrollPage] = useState(1);
  const itemsPerPage = 10;

  const [promotionData, setPromotionData] = useState({
    newPosition: "",
    newDepartment: "",
    newSalary: "",
    effectiveDate: "",
    notes: ""
  });

  const [mailData, setMailData] = useState({
    subject: "",
    body: ""
  });

  const handlePromotion = () => {
    // Handle promotion logic here
    console.log("Promoting employee:", employee?.id, promotionData);
    toast.success(`${employee?.name} has been promoted successfully!`);
    setIsPromoteDialogOpen(false);
    // Reset form
    setPromotionData({
      newPosition: "",
      newDepartment: "",
      newSalary: "",
      effectiveDate: "",
      notes: ""
    });
  };

  const handleSendMail = () => {
    if (!mailData.subject.trim() || !mailData.body.trim()) {
      toast.error("Please fill in subject and body");
      return;
    }
    console.log("Sending mail to:", employee?.email, mailData);
    toast.success(`Email sent to ${employee?.name} successfully!`);
    setIsSendMailDialogOpen(false);
    // Reset form
    setMailData({
      subject: "",
      body: ""
    });
  };

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Employee not found</h1>
          <Link href="/hr/employees">
            <Button variant="outline" className="mt-4">
              Back to Employees
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <Toaster position="top-right" richColors />

      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/hr/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Profile Header Card */}
      <Card className=" overflow-hidden">
        <div className="bg-linear-to-r from-blue-500 to-blue-600 h-32"></div>
        <CardContent className="px-4 pt-0">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 mb-6">
            {/* Profile Avatar */}
            <div className="z-10">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarFallback className="text-2xl bg-blue-500 text-white">
                  {employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {employee.name}
                  </h1>
                  <p className="text-gray-600 mt-1">{employee.position}</p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {employee.status === "Active" ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : employee.status === "On Leave" ? (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                      <Clock className="w-3 h-3 mr-1" />
                      On Leave
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 hover:bg-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}

                  {employee.noticePerioddDays &&
                    employee.noticePerioddDays > 0 && (
                      <Badge className="bg-orange-500 hover:bg-orange-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Notice Period: {employee.noticePerioddDays} days
                      </Badge>
                    )}

                  {employee.gender && (
                    <Badge variant="outline">{employee.gender}</Badge>
                  )}
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Join Date</p>
                    <p className="text-sm font-medium">
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Annual Salary</p>
                    <p className="text-sm font-medium">
                      ${employee.salary.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="flex flex-col gap-4">
        {/* Right Column - Actions and Quick Links */}
        <div className="flex flex-col gap-4">
          {/* Actions & Quick Links Card */}
          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Action Buttons */}
              <div className=" grid grid-cols-2 gap-2">
                <Dialog
                  open={isPromoteDialogOpen}
                  onOpenChange={setIsPromoteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="default">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Promote Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-125">
                    <DialogHeader>
                      <DialogTitle>Promote Employee</DialogTitle>
                      <DialogDescription>
                        Update employee position, department, and salary. This
                        action will be recorded in the employee&apos;s history.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current-position">
                          Current Position
                        </Label>
                        <Input
                          id="current-position"
                          value={employee?.position}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-position">New Position</Label>
                        <Select
                          value={promotionData.newPosition}
                          onValueChange={(value) =>
                            setPromotionData({
                              ...promotionData,
                              newPosition: value
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select new position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Junior Developer">
                              Junior Developer
                            </SelectItem>
                            <SelectItem value="Senior Developer">
                              Senior Developer
                            </SelectItem>
                            <SelectItem value="Team Lead">Team Lead</SelectItem>
                            <SelectItem value="Project Manager">
                              Project Manager
                            </SelectItem>
                            <SelectItem value="Department Head">
                              Department Head
                            </SelectItem>
                            <SelectItem value="VP">Vice President</SelectItem>
                            <SelectItem value="Director">Director</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-department">Department</Label>
                        <Select
                          value={promotionData.newDepartment}
                          onValueChange={(value) =>
                            setPromotionData({
                              ...promotionData,
                              newDepartment: value
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Engineering">
                              Engineering
                            </SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Operations">
                              Operations
                            </SelectItem>
                            <SelectItem value="HR">Human Resources</SelectItem>
                            <SelectItem value="Logistics">Logistics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="current-salary">Current Salary</Label>
                        <Input
                          id="current-salary"
                          value={`$${employee?.salary.toLocaleString()}`}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-salary">New Salary</Label>
                        <Input
                          id="new-salary"
                          type="number"
                          placeholder="Enter new salary"
                          value={promotionData.newSalary}
                          onChange={(e) =>
                            setPromotionData({
                              ...promotionData,
                              newSalary: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="effective-date">Effective Date</Label>
                        <Input
                          id="effective-date"
                          type="date"
                          value={promotionData.effectiveDate}
                          onChange={(e) =>
                            setPromotionData({
                              ...promotionData,
                              effectiveDate: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any additional notes about the promotion..."
                          value={promotionData.notes}
                          onChange={(e) =>
                            setPromotionData({
                              ...promotionData,
                              notes: e.target.value
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsPromoteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handlePromotion}>
                        Confirm Promotion
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button className="w-full" variant="default">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Employee
                </Button>
                <Button className="w-full" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Employee
                </Button>
                <Dialog
                  open={isSendMailDialogOpen}
                  onOpenChange={setIsSendMailDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Mail
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Send Email</DialogTitle>
                      <DialogDescription>
                        Send an email to {employee?.name} ({employee?.email})
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Email subject"
                          value={mailData.subject}
                          onChange={(e) =>
                            setMailData({
                              ...mailData,
                              subject: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="body">Body</Label>
                        <Textarea
                          id="body"
                          placeholder="Write your message here..."
                          rows={8}
                          value={mailData.body}
                          onChange={(e) =>
                            setMailData({
                              ...mailData,
                              body: e.target.value
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsSendMailDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSendMail}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isAttendanceDialogOpen}
                  onOpenChange={setIsAttendanceDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      View Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Weekly Attendance</DialogTitle>
                      <DialogDescription>
                        Detailed attendance information for {employee?.name}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Attendance Summary Stats and Table with Pagination */}
                    {(() => {
                      const allRecords = getEmployeeAttendance(
                        employee?.id || ""
                      );
                      const daysPerPage = 7;
                      const totalDays = allRecords.length;
                      const totalPages = Math.ceil(totalDays / daysPerPage);
                      const currentPage = Math.min(
                        Math.max(attendancePage, 1),
                        totalPages
                      );

                      // Calculate which 7 days to show
                      const startIdx = (currentPage - 1) * daysPerPage;
                      const endIdx = Math.min(
                        startIdx + daysPerPage,
                        totalDays
                      );
                      const currentPageRecords = allRecords.slice(
                        startIdx,
                        endIdx
                      );

                      // Calculate stats for current page
                      const workingDays = currentPageRecords.filter(
                        (r) => r.status !== "leave"
                      );
                      const totalWorkingHours = workingDays.reduce((sum) => {
                        return sum + 9;
                      }, 0);
                      const avgWeeklyHours =
                        workingDays.length > 0
                          ? (
                              totalWorkingHours /
                              Math.ceil(workingDays.length / 5)
                            ).toFixed(2)
                          : "0";

                      const avgLateMinutes =
                        workingDays.length > 0
                          ? Math.round(
                              (workingDays.length * (Math.random() * 30 + 5)) /
                                workingDays.length
                            )
                          : 0;

                      const overtimeHours =
                        workingDays.length > 0
                          ? (
                              (workingDays.filter(
                                (r) => r.hoursWorked && r.hoursWorked > 9
                              ).length *
                                1.5) /
                              workingDays.length
                            ).toFixed(2)
                          : "0";

                      const avgBreakMinutes =
                        workingDays.length > 0
                          ? Math.round(
                              (workingDays.length * (60 + Math.random() * 30)) /
                                workingDays.length
                            )
                          : 0;

                      return (
                        <div className="space-y-4">
                          {/* Summary Stats */}
                          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-500">
                                Avg Weekly Hours
                              </p>
                              <p className="text-xl font-semibold">
                                {avgWeeklyHours} hrs
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Avg Late By
                              </p>
                              <p className="text-xl font-semibold">
                                {avgLateMinutes} min
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Overtime Hours
                              </p>
                              <p className="text-xl font-semibold">
                                {overtimeHours} hrs
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Avg Break Hours
                              </p>
                              <p className="text-xl font-semibold">
                                {(avgBreakMinutes / 60).toFixed(2)} hrs
                              </p>
                            </div>
                          </div>

                          {/* Attendance Table */}
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Day</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Check-out</TableHead>
                                <TableHead>Break Duration</TableHead>
                                <TableHead>Effective Hours</TableHead>
                                <TableHead>Total Hours</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                const recordMap = new Map(
                                  currentPageRecords.map((r) => [r.date, r])
                                );

                                // Parse the first date from current page records
                                const firstDateStr =
                                  currentPageRecords[0]?.date ||
                                  new Date().toISOString().split("T")[0];
                                const [year, month, day] = firstDateStr
                                  .split("-")
                                  .map(Number);
                                let startDate = new Date(year, month - 1, day);

                                // Find the Monday of the week containing this date
                                const dayOfWeek = startDate.getDay();
                                const daysToMonday =
                                  dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                                startDate.setDate(
                                  startDate.getDate() - daysToMonday
                                );

                                const weekDays = [];
                                for (let i = 0; i < daysPerPage; i++) {
                                  const d = new Date(startDate);
                                  d.setDate(d.getDate() + i);
                                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                  weekDays.push({
                                    date: d,
                                    record: recordMap.get(dateStr) || null,
                                    dateStr: dateStr
                                  });
                                }

                                return weekDays.map((item, idx) => {
                                  const dayOfWeek = item.date.getDay();
                                  const isWeekend =
                                    dayOfWeek === 0 || dayOfWeek === 6;

                                  if (isWeekend) {
                                    return (
                                      <TableRow
                                        key={idx}
                                        className="bg-gray-50"
                                      >
                                        <TableCell>
                                          {item.date.toLocaleDateString(
                                            "en-US",
                                            {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric"
                                            }
                                          )}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                          {item.date.toLocaleDateString(
                                            "en-US",
                                            {
                                              weekday: "short"
                                            }
                                          )}
                                        </TableCell>
                                        <TableCell
                                          colSpan={6}
                                          className="text-center text-gray-400"
                                        >
                                          Weekend
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  if (!item.record) {
                                    return (
                                      <TableRow key={idx}>
                                        <TableCell>
                                          {item.date.toLocaleDateString(
                                            "en-US",
                                            {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric"
                                            }
                                          )}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                          {item.date.toLocaleDateString(
                                            "en-US",
                                            {
                                              weekday: "short"
                                            }
                                          )}
                                        </TableCell>
                                        <TableCell
                                          colSpan={6}
                                          className="text-center text-gray-400"
                                        >
                                          No data
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  const record = item.record;
                                  const checkinTime = new Date(
                                    item.date.getTime() +
                                      9 * 60 * 60 * 1000 +
                                      Math.random() * 30 * 60 * 1000
                                  );
                                  const checkoutTime = new Date(
                                    item.date.getTime() +
                                      18 * 60 * 60 * 1000 +
                                      Math.random() * 30 * 60 * 1000
                                  );
                                  const breakDuration = 60 + Math.random() * 30;
                                  const effectiveHours =
                                    (checkoutTime.getTime() -
                                      checkinTime.getTime()) /
                                      (1000 * 60 * 60) -
                                    breakDuration / 60;
                                  const totalHours =
                                    (checkoutTime.getTime() -
                                      checkinTime.getTime()) /
                                    (1000 * 60 * 60);

                                  return (
                                    <TableRow key={idx}>
                                      <TableCell>
                                        {item.date.toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric"
                                        })}
                                      </TableCell>
                                      <TableCell className="font-semibold">
                                        {item.date.toLocaleDateString("en-US", {
                                          weekday: "short"
                                        })}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className={
                                            record.status === "present"
                                              ? "bg-blue-100 text-blue-800"
                                              : record.status === "absent"
                                                ? "bg-red-100 text-red-800"
                                                : record.status === "leave"
                                                  ? "bg-gray-100 text-gray-800"
                                                  : "bg-yellow-100 text-yellow-800"
                                          }
                                        >
                                          {record.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            record.status.slice(1)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {checkinTime.toLocaleTimeString(
                                          "en-US",
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          }
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {checkoutTime.toLocaleTimeString(
                                          "en-US",
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          }
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {Math.round(breakDuration)} min
                                      </TableCell>
                                      <TableCell>
                                        {effectiveHours.toFixed(2)} hrs
                                      </TableCell>
                                      <TableCell>
                                        {totalHours.toFixed(2)} hrs
                                      </TableCell>
                                    </TableRow>
                                  );
                                });
                              })()}
                            </TableBody>
                          </Table>

                          {/* Pagination Controls */}
                          <div className="flex items-center justify-between gap-4 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setAttendancePage(
                                  Math.max(1, attendancePage - 1)
                                )
                              }
                              disabled={attendancePage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setAttendancePage(attendancePage + 1)
                              }
                              disabled={attendancePage >= totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isPayrollDialogOpen}
                  onOpenChange={setIsPayrollDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      View Payroll
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Payroll History</DialogTitle>
                      <DialogDescription>
                        Payroll and salary breakdown for {employee?.name}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Payroll Table with Pagination */}
                    {(() => {
                      // Generate 12 months of payroll data
                      const generatePayrollData = () => {
                        const payroll = [];
                        const today = new Date();

                        for (let i = 0; i < 12; i++) {
                          const payDate = new Date(
                            today.getFullYear(),
                            today.getMonth() - i,
                            1
                          );
                          payroll.push({
                            date: payDate.toISOString().split("T")[0],
                            month: payDate.toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric"
                            })
                          });
                        }
                        return payroll;
                      };

                      const payrollData = generatePayrollData();
                      const itemsPerPage = 6;
                      const totalPages = Math.ceil(
                        payrollData.length / itemsPerPage
                      );
                      const currentPage = Math.min(
                        Math.max(payrollPage, 1),
                        totalPages
                      );

                      const startIdx = (currentPage - 1) * itemsPerPage;
                      const endIdx = Math.min(
                        startIdx + itemsPerPage,
                        payrollData.length
                      );
                      const currentPagePayroll = payrollData.slice(
                        startIdx,
                        endIdx
                      );

                      const breakdown = employee?.payBreakdown || {
                        baseSalary: employee?.salary || 0,
                        bonus: 5000,
                        allowances: 3000,
                        deductions: 2000
                      };

                      // Generate random bank account (last 4 digits)
                      const bankAccount = ` XXXX ${Math.floor(
                        Math.random() * 10000
                      )
                        .toString()
                        .padStart(4, "0")}`;

                      // Calculate summary statistics for all payroll records
                      const totalSalaryPaid =
                        payrollData.length * breakdown.baseSalary;
                      const totalBonuses = payrollData.length * breakdown.bonus;
                      const totalDeductions =
                        payrollData.length * breakdown.deductions;
                      const totalPFCollected = Math.round(
                        payrollData.length * (breakdown.baseSalary * 0.12)
                      );

                      return (
                        <div className="space-y-4">
                          {/* Payroll Summary Stats */}
                          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-500">
                                Total Salary Paid
                              </p>
                              <p className="text-xl font-semibold">
                                ₹{totalSalaryPaid.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Total Bonuses
                              </p>
                              <p className="text-xl font-semibold">
                                ₹{totalBonuses.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Total Deductions
                              </p>
                              <p className="text-xl font-semibold">
                                ₹{totalDeductions.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Total PF Collected
                              </p>
                              <p className="text-xl font-semibold">
                                ₹{totalPFCollected.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Month/Year</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead>HRA</TableHead>
                                <TableHead>Bonus</TableHead>
                                <TableHead>Allowances</TableHead>
                                <TableHead>Deductions</TableHead>
                                <TableHead>Bank Account</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentPagePayroll.map((payroll, idx) => {
                                // Randomize HRA (typically 40-50% of base)
                                const hraAmount = Math.round(
                                  breakdown.baseSalary *
                                    (0.4 + Math.random() * 0.1)
                                );
                                const status =
                                  Math.random() > 0.1 ? "Paid" : "Pending";
                                const statusColor =
                                  status === "Paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800";

                                return (
                                  <TableRow key={idx}>
                                    <TableCell className="font-semibold">
                                      {payroll.month}
                                    </TableCell>
                                    <TableCell>
                                      ₹{breakdown.baseSalary.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      ₹{hraAmount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      ₹{breakdown.bonus.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      ₹{breakdown.allowances.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      ₹{breakdown.deductions.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {bankAccount}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={statusColor}
                                      >
                                        {status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          toast.success(
                                            `Compensation card downloaded for ${payroll.month}`
                                          )
                                        }
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>

                          {/* Pagination Controls */}
                          <div className="flex items-center justify-between gap-4 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPayrollPage(Math.max(1, payrollPage - 1))
                              }
                              disabled={payrollPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPayrollPage(payrollPage + 1)}
                              disabled={payrollPage >= totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Left Column - Employee Details and History */}
        <div className="flex flex-col gap-4">
          {/* Current Position */}
          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Current Position
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p className="text-lg font-semibold">{employee.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Department
                  </p>
                  <p className="text-lg font-semibold">{employee.department}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Employee ID</p>
                <p className="text-lg font-semibold">{employee.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Compensation Card */}
          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Compensation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Annual Salary
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  ${employee.salary.toLocaleString()}
                </p>
              </div>

              {employee.payBreakdown && (
                <div className="space-y-3 border-t pt-4">
                  <p className="font-medium">Salary Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">Base Salary</span>
                      <span className="font-semibold">
                        ${employee.payBreakdown.baseSalary.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="text-gray-700">Bonus</span>
                      <span className="font-semibold text-green-600">
                        +${employee.payBreakdown.bonus.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span className="text-gray-700">Allowances</span>
                      <span className="font-semibold text-blue-600">
                        +${employee.payBreakdown.allowances.toLocaleString()}
                      </span>
                    </div>
                    {employee.payBreakdown.deductions > 0 && (
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                        <span className="text-gray-700">Deductions</span>
                        <span className="font-semibold text-red-600">
                          -${employee.payBreakdown.deductions.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Graph Card */}
          <Card className="p-4 overflow-x-hidden">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Overview
              </CardTitle>
              <CardDescription>
                Last 12 months attendance heatmap
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 w-full">
              <AttendanceGraph records={getEmployeeAttendance(employee.id)} />
            </CardContent>
          </Card>

          {/* Work History / Previous Positions */}
          {employee.previousPositions &&
            employee.previousPositions.length > 0 && (
              <Card className="p-4">
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Career History
                  </CardTitle>
                  <CardDescription>Previously held positions</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  {employee.previousPositions.map((position, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-blue-500 pl-4 pb-4 last:pb-0"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {position.position}
                          </p>
                          <p className="text-sm text-gray-600">
                            {position.department}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(position.startDate).toLocaleDateString()}{" "}
                            - {new Date(position.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="text-sm font-semibold">
                            {Math.round(
                              (new Date(position.endDate).getTime() -
                                new Date(position.startDate).getTime()) /
                                (1000 * 60 * 60 * 24 * 365)
                            )}{" "}
                            yrs
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          {/* Letters & Documents */}
          {employee.letters && employee.letters.length > 0 && (
            <Card className="p-4">
              <CardHeader className="p-0">
                <CardTitle>Letters & Documents</CardTitle>
                <CardDescription>
                  Official letters and certificates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                {employee.letters.map((letter) => (
                  <div
                    key={letter.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{letter.type}</p>
                      <p className="text-sm text-gray-600">
                        {letter.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(letter.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
