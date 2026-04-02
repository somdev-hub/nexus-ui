"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { getAllDepartments, getDeptRoles } from "@/lib/auth-service";
import type { PayrollRecord } from "@/types";
import { payrollData } from "@/app/hr/payroll/data";

interface AttendanceDetails {
  presentDays: number;
  absentDays: number;
  halfDays: number;
  overtimeHours: number;
  additions: number;
  deductions: number;
}

interface ProcessPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getAttendanceDetails = (record: PayrollRecord): AttendanceDetails => {
  const workingDaysInMonth = 22;
  const presentDays = workingDaysInMonth - (record.absentDays || 0);
  const absentDays = record.absentDays || 0;
  const halfDays = Math.floor((record.absentDays || 0) * 0.2);
  const overtimeHours = Math.floor((record.overtimeCost || 0) / 500);
  const additions =
    (record.bonus || 0) + (record.allowances || 0) + (record.overtimeCost || 0);
  const deductions = record.deductions || 0;

  return {
    presentDays,
    absentDays,
    halfDays,
    overtimeHours,
    additions,
    deductions
  };
};

export function ProcessPayrollDialog({
  open,
  onOpenChange
}: ProcessPayrollDialogProps) {
  const { orgId } = useUserMetadata();
  const [departments, setDepartments] = useState<
    Array<{ deptId: number; deptName: string }>
  >([]);
  const [deptIdToNameMap, setDeptIdToNameMap] = useState<
    Record<string, string>
  >({});
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedDept, setSelectedDept] = useState<string>("all-departments");
  const [selectedRole, setSelectedRole] = useState<string>("all-roles");
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState<"selected" | "all" | null>(
    null
  );
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);

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
        // Create mapping of deptId to deptName for filtering
        const mapping = depts.reduce(
          (acc, dept) => {
            acc[dept.deptId.toString()] = dept.deptName;
            return acc;
          },
          {} as Record<string, string>
        );
        setDeptIdToNameMap(mapping);
      } catch (error) {
        console.error("Error loading departments:", error);
        toast.error("Failed to load departments");
      } finally {
        setLoadingDepts(false);
      }
    };

    if (open) {
      loadDepartments();
    }
  }, [open, orgId]);

  useEffect(() => {
    const loadRoles = async () => {
      // Only load roles for specific departments, not for "all-departments"
      if (!selectedDept || selectedDept === "all-departments") {
        setRoles([]);
        setSelectedRole("all-roles");
        return;
      }

      try {
        setLoadingRoles(true);
        const deptRoles = await getDeptRoles(parseInt(selectedDept));
        setRoles(deptRoles || []);
        setSelectedRole("all-roles"); // Reset role selection when department changes
      } catch (error) {
        console.error("Error loading roles:", error);
        toast.error("Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, [selectedDept]);

  const filteredPayroll = useMemo(() => {
    return payrollData.filter((record) => {
      // Get the department name for the selected deptId
      const selectedDeptName = deptIdToNameMap[selectedDept];
      const deptMatch =
        !selectedDept ||
        selectedDept === "all-departments" ||
        record.department === selectedDeptName;
      const roleMatch =
        !selectedRole ||
        selectedRole === "all-roles" ||
        record.position === selectedRole;
      return deptMatch && roleMatch;
    });
  }, [selectedDept, selectedRole, deptIdToNameMap]);

  const toggleRecord = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const toggleAllRecords = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(filteredPayroll.map((record) => record.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleProcessPayroll = async (type: "selected" | "all") => {
    const recordsToProcess =
      type === "all"
        ? filteredPayroll
        : filteredPayroll.filter((r) => selectedRecords.has(r.id));

    if (recordsToProcess.length === 0) {
      toast.error("No records selected");
      return;
    }

    setIsProcessing(true);
    setProcessType(type);

    // Simulate processing
    setTimeout(() => {
      toast.success(
        `Successfully processed ${recordsToProcess.length} payroll record(s)`
      );
      setIsProcessing(false);
      setProcessType(null);
      setSelectedRecords(new Set());
      onOpenChange(false);
    }, 2000);
  };

  const selectedCount = selectedRecords.size;
  const allSelected =
    filteredPayroll.length > 0 && selectedCount === filteredPayroll.length;

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
                  <SelectTrigger disabled={loadingDepts}>
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-departments">
                      All Departments
                    </SelectItem>
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.deptId}
                        value={dept.deptId.toString()}
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
                    disabled={
                      loadingRoles ||
                      !selectedDept ||
                      selectedDept === "all-departments"
                    }
                  >
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-roles">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Records Count */}
            <div className="text-sm text-muted-foreground">
              Total records: {filteredPayroll.length} | Selected:{" "}
              {selectedCount}
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAllRecords}
                      disabled={filteredPayroll.length === 0}
                    />
                  </TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayroll.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayroll.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.has(record.id)}
                          onCheckedChange={() => toggleRecord(record.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.employeeId}
                      </TableCell>
                      <TableCell>{record.employeeName}</TableCell>
                      <TableCell>{record.department || "—"}</TableCell>
                      <TableCell>{record.position || "—"}</TableCell>
                      <TableCell>
                        ${record.baseSalary.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${record.netSalary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "Processed"
                              ? "default"
                              : record.status === "Pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AttendanceHoverCard record={record} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
              disabled={selectedCount === 0 || isProcessing}
              variant="outline"
            >
              {isProcessing && processType === "selected" && "Processing..."}
              {(!isProcessing || processType !== "selected") &&
                `Process Selected (${selectedCount})`}
            </Button>
            <Button
              onClick={() => handleProcessPayroll("all")}
              disabled={filteredPayroll.length === 0 || isProcessing}
            >
              {isProcessing && processType === "all" && "Processing..."}
              {(!isProcessing || processType !== "all") &&
                `Process All (${filteredPayroll.length})`}
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
    </>
  );
}

// Attendance Hover Card Component
function AttendanceHoverCard({ record }: { record: PayrollRecord }) {
  const details = getAttendanceDetails(record);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            View
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-80">
          <div className="space-y-3 p-2">
            <h4 className="font-semibold">Attendance Details</h4>

            {/* Attendance Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Days Present
                </span>
                <span className="font-semibold">{details.presentDays}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Half Days
                </span>
                <span className="font-semibold">{details.halfDays}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Absent Days
                </span>
                <span className="font-semibold">{details.absentDays}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Overtime Hours</span>
                <span className="font-semibold">{details.overtimeHours}h</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t pt-3 mt-3" />

            {/* Calculations */}
            <div className="space-y-2">
              <h5 className="font-semibold text-sm">Payroll Impact</h5>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Additions</span>
                <span className="font-semibold text-green-600">
                  +${details.additions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Deductions</span>
                <span className="font-semibold text-red-600">
                  -${details.deductions.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
