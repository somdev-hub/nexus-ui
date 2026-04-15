"use client";

import { useState, useEffect } from "react";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllDepartments,
  getDeptRoles,
  getPayrollEmployees,
  getEmployeeAttendance,
  initiatePayroll
} from "@/lib/auth-service";
import type {
  PayrollEmployeeItem,
  EmployeeAttendanceResponse,
  PayrollInitiationResponse
} from "@/types";
import { PayrollPaymentConfirmationDialog } from "@/components/payroll-payment-confirmation-dialog";
import { PayrollPaymentResultDialog } from "@/components/payroll-payment-result-dialog";

interface ProcessPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessPayrollDialog({
  open,
  onOpenChange
}: ProcessPayrollDialogProps) {
  const { orgId } = useUserMetadata();

  // Department and Role filters
  const [departments, setDepartments] = useState<
    Array<{ deptId: number; deptName: string }>
  >([]);
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedDept, setSelectedDept] = useState<string>("all-departments");
  const [selectedRole, setSelectedRole] = useState<string>("all-roles");

  // Pagination state
  const [pageNo, setPageNo] = useState(0);
  const [pageSize] = useState(10);
  const [payrollData, setPayrollData] = useState<PayrollEmployeeItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Loading states
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Selection and processing states
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(
    new Set()
  );
  const [selectNotProcessed, setSelectNotProcessed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState<"selected" | "all" | null>(
    null
  );
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [recordsToProcess, setRecordsToProcess] = useState<
    PayrollEmployeeItem[]
  >([]);
  const [paymentResult, setPaymentResult] =
    useState<PayrollInitiationResponse | null>(null);
  const [showPaymentResult, setShowPaymentResult] = useState(false);

  // Load departments on dialog open
  useEffect(() => {
    const loadDepartments = async () => {
      if (!orgId) {
        setLoadingDepts(false);
        return;
      }

      try {
        setLoadingDepts(true);
        const depts = await getAllDepartments(parseInt(orgId));
        setDepartments(depts);
      } catch (error) {
        console.error("Error loading departments:", error);
        toast.error("Failed to load departments");
      } finally {
        setLoadingDepts(false);
      }
    };

    if (open) {
      loadDepartments();
      setPageNo(0);
    }
  }, [open, orgId]);

  // Load roles when department changes
  useEffect(() => {
    const loadRoles = async () => {
      if (!selectedDept || selectedDept === "all-departments") {
        setRoles([]);
        setSelectedRole("all-roles");
        return;
      }

      try {
        setLoadingRoles(true);
        const deptRoles = await getDeptRoles(parseInt(selectedDept));
        setRoles(deptRoles || []);
        setSelectedRole("all-roles");
      } catch (error) {
        console.error("Error loading roles:", error);
        toast.error("Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
    setPageNo(0); // Reset to first page when filters change
  }, [selectedDept]);

  // Load payroll employees when filters or pagination changes
  useEffect(() => {
    const loadPayrollEmployees = async () => {
      if (!orgId) return;

      try {
        setIsLoadingData(true);
        const deptId =
          selectedDept !== "all-departments"
            ? parseInt(selectedDept)
            : undefined;
        const role = selectedRole !== "all-roles" ? selectedRole : undefined;

        const response = await getPayrollEmployees(
          orgId,
          deptId,
          role,
          pageNo,
          pageSize
        );

        setPayrollData(response.content);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
        setSelectedRecords(new Set()); // Clear selection when data changes
      } catch (error) {
        console.error("Error loading payroll employees:", error);
        toast.error("Failed to load payroll employees");
        setPayrollData([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (open && orgId) {
      loadPayrollEmployees();
    }
  }, [open, orgId, selectedDept, selectedRole, pageNo, pageSize]);

  const toggleRecord = (employeeId: number) => {
    if (selectNotProcessed) {
      toast.error(
        "Disable 'Select Not Processed' mode to manually select records"
      );
      return;
    }
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedRecords(newSelected);
  };

  const toggleAllRecords = (checked: boolean) => {
    if (selectNotProcessed) {
      toast.error(
        "Disable 'Select Not Processed' mode to manually select records"
      );
      return;
    }
    if (checked) {
      setSelectedRecords(
        new Set(payrollData.map((record) => record.employeeId))
      );
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleSelectNotProcessed = (checked: boolean) => {
    setSelectNotProcessed(checked);
    if (checked) {
      // Select all NOT_PROCESSED records from current page
      const notProcessedIds = payrollData
        .filter((r) => r.paymentStatus === "NOT_PROCESSED")
        .map((r) => r.employeeId);
      setSelectedRecords(new Set(notProcessedIds));
    } else {
      // Clear selection when turning off
      setSelectedRecords(new Set());
    }
  };

  // Auto-select NOT_PROCESSED records when mode is on and data changes
  useEffect(() => {
    if (selectNotProcessed) {
      const notProcessedIds = payrollData
        .filter((r) => r.paymentStatus === "NOT_PROCESSED")
        .map((r) => r.employeeId);
      setSelectedRecords(new Set(notProcessedIds));
    }
  }, [selectNotProcessed, payrollData]);

  const handleProcessPayroll = (type: "selected" | "all") => {
    const records =
      type === "all"
        ? payrollData
        : payrollData.filter((r) => selectedRecords.has(r.employeeId));

    if (records.length === 0) {
      toast.error("No records selected");
      return;
    }

    setRecordsToProcess(records);
    setProcessType(type);
    setShowPaymentConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    if (recordsToProcess.length === 0) {
      toast.error("No records to process");
      return;
    }

    setIsProcessing(true);

    try {
      const employeeIds = recordsToProcess.map((r) => r.employeeId);
      const result = await initiatePayroll({
        orgId: orgId || "",
        employeeIds
      });

      setPaymentResult(result);
      setShowPaymentResult(true);
      setShowPaymentConfirmation(false);
    } catch (error) {
      console.error("Error initiating payroll:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process payroll";

      setPaymentResult({
        transactionReference: "",
        payrollIds: [],
        status: "FAILED",
        message: errorMessage
      });
      setShowPaymentResult(true);
      setShowPaymentConfirmation(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = selectedRecords.size;
  const allSelected =
    payrollData.length > 0 && selectedCount === payrollData.length;

  const handlePreviousPage = () => {
    setPageNo(Math.max(0, pageNo - 1));
  };

  const handleNextPage = () => {
    if (pageNo < totalPages - 1) {
      setPageNo(pageNo + 1);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "COMPLETED":
        return "default";
      case "NOT_PROCESSED":
        return "destructive";
      case "FAILED":
        return "destructive";
      case "CANCELLED":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90dvh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
            <DialogDescription>
              Filter by department and role, then select records to process
            </DialogDescription>
          </DialogHeader>

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Department Filter */}
              <div>
                <label className="text-sm font-medium">Department</label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger disabled={loadingDepts} className="w-full">
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="all-departments" className="w-full">
                      All Departments
                    </SelectItem>
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.deptId}
                        value={dept.deptId.toString()}
                        className="w-full"
                      >
                        {dept.deptName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter */}
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger
                    className="w-full"
                    disabled={
                      loadingRoles ||
                      !selectedDept ||
                      selectedDept === "all-departments"
                    }
                  >
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="all-roles" className="w-full">
                      All Roles
                    </SelectItem>
                    {roles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.name}
                        className="w-full"
                      >
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Select Not Processed Option */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectNotProcessed}
                  onChange={(e) => handleSelectNotProcessed(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-orange-900">
                  Select All Not Processed Records
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Total records: {totalElements} | Selected: {selectedCount}
              </div>
              <div>
                Page {pageNo + 1} of {totalPages || 1}
              </div>
            </div>
          </div>

          {/* Table Section */}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading payroll employees...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAllRecords}
                        disabled={
                          payrollData.length === 0 || selectNotProcessed
                        }
                        title={
                          selectNotProcessed
                            ? "Disabled in 'Select Not Processed' mode"
                            : ""
                        }
                      />
                    </TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollData.map((record) => (
                      <TableRow key={record.employeeId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.has(record.employeeId)}
                            onCheckedChange={() =>
                              toggleRecord(record.employeeId)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.employeeId}
                        </TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.department || "—"}</TableCell>
                        <TableCell>{record.positionTitle || "—"}</TableCell>
                        <TableCell>
                          $
                          {record.monthlySalaryGross.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          $
                          {record.monthlySalaryNet.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getPaymentStatusColor(
                              record.paymentStatus
                            )}
                          >
                            {record.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AttendanceDetailsTooltip record={record} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoadingData && payrollData.length > 0 && (
            <div className="flex items-center justify-between py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {pageNo * pageSize + 1} to{" "}
                {Math.min((pageNo + 1) * pageSize, totalElements)} of{" "}
                {totalElements} records
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={pageNo === 0 || isLoadingData}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pageNo >= totalPages - 1 || isLoadingData}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleProcessPayroll("selected")}
              disabled={selectedCount === 0 || isProcessing || isLoadingData}
              variant="outline"
            >
              {isProcessing && processType === "selected" && "Processing..."}
              {(!isProcessing || processType !== "selected") &&
                `Process Selected (${selectedCount})`}
            </Button>
            <Button
              onClick={() => handleProcessPayroll("all")}
              disabled={
                payrollData.length === 0 || isProcessing || isLoadingData
              }
            >
              {isProcessing && processType === "all" && "Processing..."}
              {(!isProcessing || processType !== "all") &&
                `Process All (${payrollData.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Confirmation Dialog */}
      <Dialog open={isProcessing && processType !== null}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-center">
              <h2 className="font-semibold text-lg">Processing Payroll</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we process the payroll records...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <PayrollPaymentConfirmationDialog
        open={showPaymentConfirmation}
        onOpenChange={setShowPaymentConfirmation}
        recordsToProcess={recordsToProcess}
        onConfirm={handleConfirmPayment}
        isProcessing={isProcessing}
      />

      {/* Payment Result Dialog */}
      <PayrollPaymentResultDialog
        open={showPaymentResult}
        onOpenChange={setShowPaymentResult}
        result={paymentResult}
        onClose={() => {
          setProcessType(null);
          setSelectedRecords(new Set());
          setShowPaymentConfirmation(false);
          setRecordsToProcess([]);
          onOpenChange(false);
        }}
      />
    </>
  );
}

// Attendance Details Dialog Component
function AttendanceDetailsTooltip({ record }: { record: PayrollEmployeeItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [attendanceData, setAttendanceData] =
    useState<EmployeeAttendanceResponse | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  useEffect(() => {
    if (isOpen && !attendanceData && !isLoadingAttendance) {
      const fetchAttendanceData = async () => {
        try {
          setIsLoadingAttendance(true);
          const data = await getEmployeeAttendance(record.employeeId);
          setAttendanceData(data);
        } catch (error) {
          console.error("Error fetching attendance data:", error);
          toast.error("Failed to load attendance data");
        } finally {
          setIsLoadingAttendance(false);
        }
      };

      fetchAttendanceData();
    }
  }, [isOpen, record.employeeId, attendanceData, isLoadingAttendance]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1"
      >
        <Eye className="w-4 h-4" />
        View
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Employee Payroll & Attendance Details</DialogTitle>
            <DialogDescription>
              {record.name} • Employee ID: {record.employeeId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm text-blue-600 font-medium">Position</p>
                <p className="text-lg font-semibold">{record.positionTitle}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Department</p>
                <p className="text-lg font-semibold">{record.department}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Period</p>
                <p className="text-lg font-semibold">
                  {record.month} {record.year}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Status</p>
                <Badge variant="default">{record.paymentStatus}</Badge>
              </div>
            </div>

            {/* Salary Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Salary Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">Monthly Gross Salary</span>
                  <span className="font-semibold">
                    $
                    {record.monthlySalaryGross.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">Monthly Net Salary</span>
                  <span className="font-semibold text-green-600">
                    $
                    {record.monthlySalaryNet.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">
                Attendance Information
              </h3>
              {isLoadingAttendance ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                  <span>Loading attendance data...</span>
                </div>
              ) : attendanceData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-green-600 font-medium">
                        Days Present
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        {attendanceData.daysPresent}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-xs text-red-600 font-medium">
                        Days Absent
                      </p>
                      <p className="text-2xl font-bold text-red-700">
                        {attendanceData.daysAbsent}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-orange-600 font-medium">
                        Half Days
                      </p>
                      <p className="text-2xl font-bold text-orange-700">
                        {attendanceData.halfDays}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-purple-600 font-medium">
                        Overtime Hours
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {attendanceData.totalOvertimeHours}h
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Failed to load attendance data
                </div>
              )}
            </div>

            {/* Salary Adjustments */}
            {attendanceData && !isLoadingAttendance && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">
                  Salary Adjustments
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="font-medium text-green-900">
                      Total Additions
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      +$
                      {attendanceData.totalAdditions.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium text-red-900">
                      Total Deductions
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      -$
                      {attendanceData.totalDeductions.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
