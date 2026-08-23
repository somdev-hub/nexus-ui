"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useUserId } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import { applyHrRequest } from "@/lib/auth-service";
import type { LeaveType, RequestStatus, RequestType } from "@/types";

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const hrRequestTypes: RequestType[] = [
  "LEAVE_APPLICATION",
  "SALARY_ADVANCE",
  "RESIGNATION",
  "TRANSFER_REQUEST",
  "PROMOTION_REQUEST",
  "TRAINING_REQUEST",
  "BULK_REGULARIZATION",
  "WEEKLY_OFF"
];

const leaveTypes: LeaveType[] = [
  "SICK_LEAVE",
  "BEREAVEMENT_LEAVE",
  "EARNED_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
  "UNPAID_LEAVE",
  "COMPENSATORY_OFF"
];

type HrRequestFormState = {
  empId: string;
  hrRequestType: RequestType | "";
  remarks: string;
  fromDate: string;
  toDate: string;
  checkInHours: string;
  checkOutHours: string;
  halfDay: boolean;
  leaveType: LeaveType | "";
};

const createInitialHrRequestForm = (empId = ""): HrRequestFormState => ({
  empId,
  hrRequestType: "",
  remarks: "",
  fromDate: "",
  toDate: "",
  checkInHours: "",
  checkOutHours: "",
  halfDay: false,
  leaveType: ""
});

export function HrRequestDialog() {
  const userId = useUserId();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<HrRequestFormState>(() =>
    createInitialHrRequestForm(userId && /^\d+$/.test(userId) ? userId : "")
  );

  useEffect(() => {
    if (open || !userId || !/^\d+$/.test(userId)) {
      return;
    }

    setForm((current) =>
      current.empId ? current : { ...current, empId: userId }
    );
  }, [open, userId]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setIsSubmitting(false);
      setForm(
        createInitialHrRequestForm(userId && /^\d+$/.test(userId) ? userId : "")
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const empId = Number(form.empId);

    if (!Number.isInteger(empId) || empId <= 0) {
      toast({
        title: "Invalid employee id",
        description: "Enter a valid numeric employee id.",
        variant: "destructive"
      });
      return;
    }

    if (!form.hrRequestType) {
      toast({
        title: "Select a request type",
        description: "Choose the HR request type before submitting.",
        variant: "destructive"
      });
      return;
    }

    const requiresDateRange =
      form.hrRequestType === "LEAVE_APPLICATION" ||
      form.hrRequestType === "BULK_REGULARIZATION";

    if (requiresDateRange && (!form.fromDate || !form.toDate)) {
      toast({
        title: "Missing date range",
        description: "From date and to date are required for this request.",
        variant: "destructive"
      });
      return;
    }

    if (requiresDateRange && form.fromDate > form.toDate) {
      toast({
        title: "Invalid date range",
        description: "The from date must be on or before the to date.",
        variant: "destructive"
      });
      return;
    }

    const requestPayload: {
      empId: number;
      hrRequestType: RequestType;
      remarks?: string;
      fromDate?: string;
      toDate?: string;
      checkInHours?: string;
      checkOutHours?: string;
      halfDay?: boolean;
      leaveType?: LeaveType;
    } = {
      empId,
      hrRequestType: form.hrRequestType
    };

    const trimmedRemarks = form.remarks.trim();

    if (trimmedRemarks) {
      requestPayload.remarks = trimmedRemarks;
    }

    if (requiresDateRange) {
      requestPayload.fromDate = form.fromDate;
      requestPayload.toDate = form.toDate;
    }

    if (form.hrRequestType === "LEAVE_APPLICATION") {
      requestPayload.halfDay = form.halfDay;

      if (form.leaveType) {
        requestPayload.leaveType = form.leaveType;
      }
    }

    if (form.hrRequestType === "BULK_REGULARIZATION") {
      if (form.checkInHours) {
        requestPayload.checkInHours = form.checkInHours;
      }

      if (form.checkOutHours) {
        requestPayload.checkOutHours = form.checkOutHours;
      }
    }

    setIsSubmitting(true);

    try {
      const message = await applyHrRequest(requestPayload);

      toast({
        title: "HR request submitted",
        description: message
      });

      handleOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to submit HR request",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Card className="p-4 items-center justify-center gap-2 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
            <Plus />
            <p className="font-medium">Create Request</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Create HR Request</DialogTitle>
          <DialogDescription>
            Submit a leave, transfer, promotion, payroll, or regularization
            request.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="request-type">Request Type</Label>
              <Select
                value={form.hrRequestType}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    hrRequestType: value as RequestType
                  }))
                }
              >
                <SelectTrigger id="request-type" className="w-full">
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  {hrRequestTypes.map((requestType) => (
                    <SelectItem key={requestType} value={requestType}>
                      {formatLabel(requestType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Add supporting details or context"
              value={form.remarks}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  remarks: event.target.value
                }))
              }
            />
          </div>

          {(form.hrRequestType === "LEAVE_APPLICATION" ||
            form.hrRequestType === "BULK_REGULARIZATION") && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={form.fromDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fromDate: event.target.value
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={form.toDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      toDate: event.target.value
                    }))
                  }
                />
              </div>
            </div>
          )}

          {form.hrRequestType === "LEAVE_APPLICATION" && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Leave details</p>
                  <p className="text-sm text-muted-foreground">
                    Half day and leave type are optional for leave applications.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.halfDay}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        halfDay: event.target.checked
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  Half day
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave-type">Leave Type</Label>
                <Select
                  value={form.leaveType}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      leaveType: value as LeaveType
                    }))
                  }
                >
                  <SelectTrigger id="leave-type" className="w-full">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((leaveType) => (
                      <SelectItem key={leaveType} value={leaveType}>
                        {formatLabel(leaveType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {form.hrRequestType === "BULK_REGULARIZATION" && (
            <div className="rounded-lg border p-4 space-y-4">
              <div>
                <p className="font-medium">Regularization hours</p>
                <p className="text-sm text-muted-foreground">
                  Check-in and check-out hours are optional for bulk
                  regularization.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="check-in-hours">Check-in Hours</Label>
                  <Input
                    id="check-in-hours"
                    type="time"
                    value={form.checkInHours}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        checkInHours: event.target.value
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check-out-hours">Check-out Hours</Label>
                  <Input
                    id="check-out-hours"
                    type="time"
                    value={form.checkOutHours}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        checkOutHours: event.target.value
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
