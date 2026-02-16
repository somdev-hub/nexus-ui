"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  TrendingUp,
  Edit,
  Trash2
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getEmployeeDetails } from "@/lib/auth-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EmployeeDetailsResponse, AttendanceStatus_API } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailPage(props: PageProps) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [employee, setEmployee] = useState<EmployeeDetailsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog and form state
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isSendMailDialogOpen, setIsSendMailDialogOpen] = useState(false);
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

  // Parse params using React.use pattern
  React.useEffect(() => {
    props.params.then((p) => setParams(p));
  }, [props.params]);

  // Fetch employee details
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!params?.id) return;

      setLoading(true);
      setError(null);

      try {
        const employeeId = parseInt(params.id);
        if (isNaN(employeeId)) {
          throw new Error("Invalid employee ID");
        }

        const data = await getEmployeeDetails(employeeId);
        setEmployee(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load employee details";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [params?.id]);

  const getAttendanceStatusColor = (status: AttendanceStatus_API) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "ON_LEAVE":
        return "bg-yellow-100 text-yellow-800";
      case "HALF_DAY":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceStatusIcon = (status: AttendanceStatus_API) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle2 className="w-4 h-4" />;
      case "ABSENT":
        return <AlertCircle className="w-4 h-4" />;
      case "ON_LEAVE":
        return <Clock className="w-4 h-4" />;
      case "HALF_DAY":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handlePromotion = () => {
    if (!promotionData.newPosition || !promotionData.effectiveDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    console.log("Promoting employee:", employee?.empId, promotionData);
    toast.success(`${employee?.fullName} has been promoted successfully!`);
    setIsPromoteDialogOpen(false);
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
    toast.success(`Email sent to ${employee?.fullName} successfully!`);
    setIsSendMailDialogOpen(false);
    setMailData({
      subject: "",
      body: ""
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading employee details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/hr/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600">
            {error || "Employee not found"}
          </h1>
          <p className="text-gray-600 mt-2">
            Unable to load employee details. Please try again.
          </p>
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
      <Card className="overflow-hidden">
        <div className="bg-linear-to-r from-blue-500 to-blue-600 h-32"></div>
        <CardContent className="px-4 pt-0">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 mb-6">
            {/* Profile Avatar */}
            <div className="z-10">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                {employee.profileImageUrl && (
                  <AvatarImage
                    src={employee.profileImageUrl}
                    alt={employee.fullName}
                  />
                )}
                <AvatarFallback className="text-2xl bg-blue-500 text-white">
                  {getInitials(employee.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {employee.fullName}
                  </h1>
                  <p className="text-gray-600 mt-1">{employee.jobTitle}</p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <Badge variant="outline">{employee.gender}</Badge>
                  <Badge variant="outline">Age: {employee.age}</Badge>
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium break-all">
                      {employee.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{employee.phone}</p>
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
                    <p className="text-xs text-gray-500">Joining Date</p>
                    <p className="text-sm font-medium">
                      {employee.joiningDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Dialog
              open={isPromoteDialogOpen}
              onOpenChange={setIsPromoteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Promote
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Promote Employee</DialogTitle>
                  <DialogDescription>
                    Update employee position, department, and salary.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-position">Current Position</Label>
                    <Input
                      id="current-position"
                      value={employee?.jobTitle || ""}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-position">New Position *</Label>
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
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="HR">Human Resources</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="effective-date">Effective Date *</Label>
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
                      placeholder="Add any additional notes..."
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
                  <Button onClick={handlePromotion}>Confirm Promotion</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="w-full" variant="default">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>

            <Button className="w-full" variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Email</DialogTitle>
                  <DialogDescription>
                    Send an email to {employee?.fullName} ({employee?.email})
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
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Personal & Address Info */}
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium">{employee.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="text-sm font-medium">{employee.age} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm font-medium">{employee.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Employee ID</p>
                  <p className="text-sm font-medium">{employee.empId}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium">{employee.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position History */}
          {employee.positionsHeld && employee.positionsHeld.length > 0 && (
            <Card className="p-4 gap-2">
              <CardHeader className="p-0">
                <CardTitle className="text-base">Position History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {employee.positionsHeld.map((position, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{position.title}</p>
                          {position.department && (
                            <p className="text-sm text-gray-600">
                              {position.department}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(position.fromDate)} to{" "}
                            {position.toDate
                              ? formatDate(position.toDate)
                              : "Present"}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {position.duration.toFixed(2)} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">Annual Salary</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(employee.annualSalary)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600">Total Leaves</p>
                  <p className="text-lg font-semibold text-green-600">
                    {employee.leaveRecords
                      .reduce((sum, leave) => sum + leave.totalLeaves, 0)
                      .toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">Leaves Taken</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {employee.leaveRecords
                      .reduce((sum, leave) => sum + leave.leavesTaken, 0)
                      .toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compensation Tab */}
        <TabsContent value="compensation" className="space-y-4">
          {/* Salary Components */}
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Salary Components</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-sm font-medium">Annual Package</span>
                  <span className="font-semibold">
                    {employee.compensation.annualPackage}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-sm">Base Pay</span>
                  <span className="font-medium">
                    {formatCurrency(employee.compensation.basePay)}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-sm">HRA</span>
                  <span className="font-medium">
                    {formatCurrency(employee.compensation.hra)}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-sm">Provident Fund (PF)</span>
                  <span className="font-medium">
                    {formatCurrency(employee.compensation.pf)}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-sm">Gratuity</span>
                  <span className="font-medium">
                    {formatCurrency(employee.compensation.gratuity)}
                  </span>
                </div>
                {employee.compensation.insurancePremium && (
                  <div className="flex justify-between pb-3 border-b">
                    <span className="text-sm">Insurance Premium</span>
                    <span className="font-medium">
                      {formatCurrency(employee.compensation.insurancePremium)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-green-50 px-3 rounded-lg">
                  <span className="font-semibold text-green-800">Net Pay</span>
                  <span className="font-bold text-green-800">
                    {formatCurrency(employee.compensation.netPay)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bonuses */}
          {employee.compensation.bonuses &&
            employee.compensation.bonuses.length > 0 && (
              <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                  <CardTitle className="text-base">Bonuses</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>% of Salary</TableHead>
                          <TableHead>Expires On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employee.compensation.bonuses.map((bonus) => (
                          <TableRow key={bonus.bonusId}>
                            <TableCell className="font-medium">
                              {bonus.bonusType}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(bonus.amount)}
                            </TableCell>
                            <TableCell>{bonus.percentageOfSalary}%</TableCell>
                            <TableCell>{formatDate(bonus.expiresOn)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Deductions */}
          {employee.compensation.deductions &&
            employee.compensation.deductions.length > 0 && (
              <Card className="p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-base">Deductions</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>% of Salary</TableHead>
                          <TableHead>Expires On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employee.compensation.deductions.map((deduction) => (
                          <TableRow key={deduction.deductionId}>
                            <TableCell className="font-medium">
                              {deduction.deductionType}
                            </TableCell>
                            <TableCell>{deduction.description}</TableCell>
                            <TableCell>
                              {formatCurrency(deduction.amount)}
                            </TableCell>
                            <TableCell>
                              {deduction.percentageOfSalary}%
                            </TableCell>
                            <TableCell>
                              {formatDate(deduction.expiresOn)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Bank Records */}
          {employee.compensation.bankRecords &&
            employee.compensation.bankRecords.length > 0 && (
              <Card className="p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-base">Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="space-y-4">
                    {employee.compensation.bankRecords.map((bank, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Bank Name</p>
                            <p className="font-medium">{bank.bankName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Account Holder Name
                            </p>
                            <p className="font-medium">
                              {bank.accountHolderName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Account No.</p>
                            <p className="font-medium">{bank.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Account Type
                            </p>
                            <p className="font-medium">{bank.accountType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">IFSC Code</p>
                            <p className="font-medium">{bank.ifscCode}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Branch Address
                            </p>
                            <p className="font-medium">{bank.branchAddress}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Attendance Records</CardTitle>
              <CardDescription className="mt-2">
                Recent attendance history for this employee
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              {employee.attendanceRecords &&
              employee.attendanceRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Hours Worked</TableHead>
                        <TableHead>Break Hours</TableHead>
                        <TableHead>Overtime Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employee.attendanceRecords.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>
                            <Badge
                              className={`flex items-center gap-1 w-fit p-2 ${getAttendanceStatusColor(
                                record.status
                              )}`}
                            >
                              {getAttendanceStatusIcon(record.status)}
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(record.checkInTime)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(record.checkOutTime)}
                          </TableCell>
                          <TableCell>{record.hoursWorked}h</TableCell>
                          <TableCell>{record.breakHours}h</TableCell>
                          <TableCell>{record.overTimeHours}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No attendance records found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              {employee.leaveRecords && employee.leaveRecords.length > 0 ? (
                <div className="space-y-3">
                  {employee.leaveRecords.map((leave, index) => (
                    <div
                      key={index}
                      className="pb-3 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold">{leave.leaveType}</p>
                        <Badge variant="secondary">
                          {leave.remainingLeaves} remaining
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Total Leaves</p>
                          <p className="font-medium">{leave.totalLeaves}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Taken</p>
                          <p className="font-medium">{leave.leavesTaken}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Remaining</p>
                          <p className="font-medium text-green-600">
                            {leave.remainingLeaves}
                          </p>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (leave.leavesTaken / leave.totalLeaves) * 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No leave records found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base">HR Documents</CardTitle>
              <CardDescription className="mt-2">
                Employee documents and certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              {employee.hrDocuments && employee.hrDocuments.length > 0 ? (
                <div className="space-y-3">
                  {employee.hrDocuments.map((document, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg flex items-start justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{document.documentName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {document.documentType}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded on: {formatDate(document.uploadedOn)}
                          </p>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                          <DialogHeader>
                            <DialogTitle>{document.documentName}</DialogTitle>
                            <DialogDescription>
                              {document.documentType} • Uploaded:{" "}
                              {formatDate(document.uploadedOn)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            {document.documentUrl.endsWith(".pdf") ? (
                              <iframe
                                src={document.documentUrl}
                                className="w-full h-[70dvh] rounded-lg"
                                title={document.documentName}
                              />
                            ) : (
                              <a
                                href={document.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={document.documentUrl}
                                  alt={document.documentName}
                                  className="w-full h-auto rounded-lg"
                                />
                              </a>
                            )}
                          </div>
                          <div>
                            <Button className="w-full" asChild>
                              <a
                                href={document.documentUrl}
                                download={document.documentName}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No documents found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
