"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
  UserRound
} from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { getEmployeeDetails, getEmployeeDirectory } from "@/lib/auth-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EmployeeDetailsResponse } from "@/types";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const ProfilePage = () => {
  const { userId, orgId, name, email, role, avatar, sessionExpiresAt } =
    useUserMetadata();

  const [employee, setEmployee] = useState<EmployeeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const [editData, setEditData] = useState({
    fullName: "",
    phone: "",
    address: "",
    notes: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        if (userId && !Number.isNaN(Number(userId))) {
          const detail = await getEmployeeDetails(Number(userId));
          setEmployee(detail);
          return;
        }

        if (!orgId || !email) {
          setEmployee(null);
          return;
        }

        const directory = await getEmployeeDirectory(orgId, 0, 200);
        const currentEmployee = directory.content.find(
          (emp) => emp.empEmail.toLowerCase() === email.toLowerCase()
        );

        if (!currentEmployee) {
          setEmployee(null);
          return;
        }

        const detail = await getEmployeeDetails(currentEmployee.empId);
        setEmployee(detail);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load profile";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, orgId, email]);

  useEffect(() => {
    if (!employee) return;

    setEditData({
      fullName: employee.fullName,
      phone: employee.phone,
      address: employee.address,
      notes: ""
    });
  }, [employee]);

  const attendanceSummary = useMemo(() => {
    if (!employee?.attendanceRecords?.length) {
      return {
        present: 0,
        absent: 0,
        leave: 0,
        halfDay: 0,
        totalOvertime: 0
      };
    }

    return employee.attendanceRecords.reduce(
      (acc, record) => {
        if (record.status === "PRESENT") acc.present += 1;
        if (record.status === "ABSENT") acc.absent += 1;
        if (record.status === "ON_LEAVE") acc.leave += 1;
        if (record.status === "HALF_DAY") acc.halfDay += 1;
        acc.totalOvertime += record.overTimeHours || 0;
        return acc;
      },
      { present: 0, absent: 0, leave: 0, halfDay: 0, totalOvertime: 0 }
    );
  }, [employee]);

  const totalLeaveBalance = useMemo(
    () =>
      employee?.leaveRecords?.reduce(
        (acc, leave) => acc + (leave.remainingLeaves || 0),
        0
      ) || 0,
    [employee]
  );

  const profileName = employee?.fullName || name || "User";

  const onSaveProfile = () => {
    if (!editData.fullName.trim() || !editData.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    toast.success("Profile changes are ready. API integration can be added next.");
    setIsEditOpen(false);
  };

  const onSavePhoto = () => {
    toast.success("Profile picture selected. Upload API can be added next.");
    setIsPhotoOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle>Loading profile</CardTitle>
            <CardDescription>Fetching your latest employee data</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/2 bg-primary animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" richColors />

      {error && (
        <Card className="p-4 gap-2 border-red-200 bg-red-50/60">
          <CardHeader className="p-0">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Could not fetch full employee profile
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="h-42 bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-500" />
        <CardContent className="px-4 pt-0 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 -mt-18">
            <div className="flex flex-col items-start gap-2">
              <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                {employee?.profileImageUrl || avatar ? (
                  <AvatarImage
                    src={employee?.profileImageUrl || avatar || ""}
                    alt={profileName}
                  />
                ) : null}
                <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                  {getInitials(profileName)}
                </AvatarFallback>
              </Avatar>

              <div className="pb-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {profileName}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {employee?.jobTitle || role || "Employee"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="secondary">{employee?.department || "General"}</Badge>
                  <Badge variant="outline">{employee?.gender || "Not specified"}</Badge>
                  {!!employee?.age && <Badge variant="outline">Age {employee.age}</Badge>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-1 mt-18">
              <Dialog open={isPhotoOpen} onOpenChange={setIsPhotoOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                  <DialogHeader>
                    <DialogTitle>Update profile picture</DialogTitle>
                    <DialogDescription>
                      Choose a new profile image that represents you professionally.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Label htmlFor="profile-image">Profile image</Label>
                    <Input id="profile-image" type="file" accept="image/*" />
                    <div className="flex justify-end">
                      <Button onClick={onSavePhoto}>Save Photo</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                  <DialogHeader>
                    <DialogTitle>Edit profile information</DialogTitle>
                    <DialogDescription>
                      Keep your personal and communication details up to date.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editData.fullName}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            fullName: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            phone: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editData.address}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            address: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={editData.notes}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            notes: e.target.value
                          }))
                        }
                        placeholder="Add optional profile notes"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button onClick={onSaveProfile}>Save Changes</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Card className="p-4 gap-2">
              <CardHeader className="p-0">
                <CardDescription>Attendance Present</CardDescription>
                <CardTitle className="text-2xl">{attendanceSummary.present}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="p-4 gap-2">
              <CardHeader className="p-0">
                <CardDescription>Leave Balance</CardDescription>
                <CardTitle className="text-2xl">{totalLeaveBalance}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="p-4 gap-2">
              <CardHeader className="p-0">
                <CardDescription>HR Documents</CardDescription>
                <CardTitle className="text-2xl">{employee?.hrDocuments?.length || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="p-4 gap-2">
              <CardHeader className="p-0">
                <CardDescription>Monthly Net Pay</CardDescription>
                <CardTitle className="text-xl">
                  {employee?.compensation?.netPay
                    ? formatCurrency(employee.compensation.netPay)
                    : "Not available"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 xl:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Personal and Work Information</CardTitle>
              <CardDescription>Core details used across HR modules</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium break-all">{employee?.email || email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{employee?.phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{employee?.address || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{employee?.department || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Job Title</p>
                    <p className="text-sm font-medium">{employee?.jobTitle || role || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joining Date</p>
                    <p className="text-sm font-medium">
                      {employee?.joiningDate ? formatDate(employee.joiningDate) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Position Timeline</CardTitle>
              <CardDescription>Career movement within the organization</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-3">
              {(employee?.positionsHeld || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No timeline records available</p>
              )}
              {(employee?.positionsHeld || []).map((position, index) => (
                <div
                  key={`${position.title}-${index}`}
                  className="rounded-md border p-3 bg-muted/20"
                >
                  <p className="font-medium">{position.title}</p>
                  <p className="text-sm text-muted-foreground">{position.department || "General"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(position.fromDate)} - {position.toDate ? formatDate(position.toDate) : "Present"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4 mt-4">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Compensation Summary</CardTitle>
              <CardDescription>Salary components and statutory details</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4 grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Annual Package</p>
                <p className="font-semibold">{employee?.compensation?.annualPackage || "-"}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Base Pay</p>
                <p className="font-semibold">
                  {employee?.compensation?.basePay
                    ? formatCurrency(employee.compensation.basePay)
                    : "-"}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">HRA</p>
                <p className="font-semibold">
                  {employee?.compensation?.hra ? formatCurrency(employee.compensation.hra) : "-"}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">PF</p>
                <p className="font-semibold">
                  {employee?.compensation?.pf ? formatCurrency(employee.compensation.pf) : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>Accounts currently mapped for payroll</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-3">
              {(employee?.compensation?.bankRecords || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No bank records available</p>
              )}
              {(employee?.compensation?.bankRecords || []).map((record, index) => (
                <div key={`${record.accountNumber}-${index}`} className="rounded-md border p-3">
                  <p className="font-medium">{record.bankName}</p>
                  <p className="text-sm text-muted-foreground">{record.accountHolderName}</p>
                  <p className="text-sm mt-1">A/C: {record.accountNumber}</p>
                  <p className="text-sm">IFSC: {record.ifscCode}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 mt-4">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Attendance Analytics</CardTitle>
              <CardDescription>Latest attendance performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-lg font-semibold text-green-600">{attendanceSummary.present}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-lg font-semibold text-red-600">{attendanceSummary.absent}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">On Leave</p>
                <p className="text-lg font-semibold text-amber-600">{attendanceSummary.leave}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Half Day</p>
                <p className="text-lg font-semibold text-blue-600">{attendanceSummary.halfDay}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Overtime Hours</p>
                <p className="text-lg font-semibold">{attendanceSummary.totalOvertime.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-2">
              {(employee?.attendanceRecords || []).slice(0, 10).map((record, index) => (
                <div
                  key={`${record.date}-${index}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{record.date}</p>
                    <p className="text-sm text-muted-foreground">
                      Check-in {record.checkInTime ? formatDate(record.checkInTime) : "-"} |
                      Check-out {record.checkOutTime ? formatDate(record.checkOutTime) : "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{record.status.replace("_", " ")}</Badge>
                    <Badge variant="secondary">{record.hoursWorked}h</Badge>
                  </div>
                </div>
              ))}
              {(employee?.attendanceRecords || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No attendance records available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4 mt-4">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Leave Balances</CardTitle>
              <CardDescription>Available and consumed leave buckets</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-3">
              {(employee?.leaveRecords || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No leave records available</p>
              )}
              {(employee?.leaveRecords || []).map((leave, index) => (
                <div
                  key={`${leave.leaveType}-${index}`}
                  className="rounded-md border p-3 grid sm:grid-cols-3 gap-2"
                >
                  <p className="font-medium">{leave.leaveType.replaceAll("_", " ")}</p>
                  <p className="text-sm text-muted-foreground">
                    Taken: {leave.leavesTaken} / {leave.totalLeaves}
                  </p>
                  <p className="text-sm font-medium text-green-700">
                    Remaining: {leave.remainingLeaves}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>HR Documents</CardTitle>
              <CardDescription>
                Employment letters, payroll proofs, and related records
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-3">
              {(employee?.hrDocuments || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No documents available</p>
              )}
              {(employee?.hrDocuments || []).map((doc, index) => (
                <div
                  key={`${doc.documentName}-${index}`}
                  className="rounded-md border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{doc.documentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.documentType.replaceAll("_", " ")} | Uploaded {formatDate(doc.uploadedOn)}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={doc.documentUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Open
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-4">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Account and Security</CardTitle>
              <CardDescription>Session and access metadata for this profile</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4 grid md:grid-cols-2 gap-3">
              <div className="rounded-md border p-3 flex items-start gap-2">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium">{role || "-"}</p>
                </div>
              </div>
              <div className="rounded-md border p-3 flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Organization ID</p>
                  <p className="font-medium">{orgId || "-"}</p>
                </div>
              </div>
              <div className="rounded-md border p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{employee?.empId || userId || "-"}</p>
                </div>
              </div>
              <div className="rounded-md border p-3 flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Session Expires</p>
                  <p className="font-medium">
                    {sessionExpiresAt ? formatDate(sessionExpiresAt) : "Unavailable"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
