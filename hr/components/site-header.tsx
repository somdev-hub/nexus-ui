"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAttendanceQuickUpdate, toggleAttendance } from "@/lib/auth-service";
import type {
  AttendanceQuickUpdateResponse,
  ToggleAttendanceResponse
} from "@/types";

const ATTENDANCE_EMPLOYEE_ID = 29;

function parseAttendanceDateTime(value: string): Date | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.includes(" ") ? value.replace(" ", "T") : value;
  const hasFractionalSeconds = normalizedValue.includes(".");
  const datePart = hasFractionalSeconds
    ? normalizedValue.split(".")[0]
    : normalizedValue;
  const fractionalPart = hasFractionalSeconds
    ? `.${normalizedValue.split(".")[1].slice(0, 3)}`
    : "";

  const parsedDate = new Date(`${datePart}${fractionalPart}`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatAttendanceDateTime(value: string): string {
  const parsedDate = parseAttendanceDateTime(value);

  if (!parsedDate) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(parsedDate);
}

function formatMinutes(value: string): string {
  const totalMinutes = Number(value);

  if (!Number.isFinite(totalMinutes)) {
    return "-";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} ${minutes === 1 ? "Min" : "Mins"}`;
  }

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "Hr" : "Hrs"}`;
  }

  return `${hours} ${hours === 1 ? "Hr" : "Hrs"} ${minutes} ${
    minutes === 1 ? "Min" : "Mins"
  }`;
}

function isCheckedOut(
  lastCheckedInTime?: string,
  lastCheckedOutTime?: string
): boolean {
  const checkedInDate = lastCheckedInTime
    ? parseAttendanceDateTime(lastCheckedInTime)
    : null;
  const checkedOutDate = lastCheckedOutTime
    ? parseAttendanceDateTime(lastCheckedOutTime)
    : null;

  return Boolean(
    checkedInDate &&
    checkedOutDate &&
    checkedOutDate.getTime() > checkedInDate.getTime()
  );
}

function getWorkProgress(totalWorkHours: string): number {
  const totalMinutes = Number(totalWorkHours);

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return 0;
  }

  return Math.min(100, (totalMinutes / (9 * 60)) * 100);
}

function getBreakMinutes(response: ToggleAttendanceResponse): number {
  const breakStart = parseAttendanceDateTime(response.breakStartTime);
  const breakEnd = parseAttendanceDateTime(response.breakEndTime);

  if (!breakStart || !breakEnd) {
    return 0;
  }

  return Math.max(
    0,
    Math.round((breakEnd.getTime() - breakStart.getTime()) / 60000)
  );
}

function mapToggleResponseToQuickUpdate(
  response: ToggleAttendanceResponse
): AttendanceQuickUpdateResponse {
  return {
    lastCheckedInTime: response.checkInTime,
    lastCheckedOutTime: response.checkOutTime,
    totalBreakTime: String(getBreakMinutes(response)),
    totalWorkHours: String(Math.round(response.totalHoursWorked * 60))
  };
}

export function SiteHeader({ name = "HR" }) {
  const { toast } = useToast();
  const [attendance, setAttendance] =
    useState<AttendanceQuickUpdateResponse | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isTogglingAttendance, setIsTogglingAttendance] = useState(false);

  const loadAttendance = useCallback(async () => {
    try {
      setIsLoadingAttendance(true);
      const data = await getAttendanceQuickUpdate(ATTENDANCE_EMPLOYEE_ID);
      setAttendance(data);
    } catch (error) {
      console.error(
        "[SiteHeader] Failed to load attendance quick update:",
        error
      );
      toast({
        title: "Failed to load attendance",
        description:
          error instanceof Error
            ? error.message
            : "Unable to load attendance details",
        variant: "destructive"
      });

      setAttendance(null);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const handleToggleAttendance = async () => {
    try {
      setIsTogglingAttendance(true);
      const response = await toggleAttendance(ATTENDANCE_EMPLOYEE_ID);
      setAttendance(mapToggleResponseToQuickUpdate(response));
      toast({
        title: response.message || "Attendance updated"
      });
    } catch (error) {
      console.error("[SiteHeader] Failed to toggle attendance:", error);
      toast({
        title: "Failed to toggle attendance",
        description:
          error instanceof Error
            ? error.message
            : "Unable to update attendance",
        variant: "destructive"
      });
    } finally {
      setIsTogglingAttendance(false);
    }
  };

  const workProgress = attendance
    ? getWorkProgress(attendance.totalWorkHours)
    : 0;
  const totalWorkLabel = attendance
    ? formatMinutes(attendance.totalWorkHours)
    : "Loading...";
  const checkedInLabel = attendance
    ? formatAttendanceDateTime(attendance.lastCheckedInTime)
    : "Loading...";
  const checkedOutLabel = attendance
    ? formatAttendanceDateTime(attendance.lastCheckedOutTime)
    : "Loading...";
  const breakLabel = attendance
    ? formatMinutes(attendance.totalBreakTime)
    : "Loading...";
  const hasCheckedIn = Boolean(attendance?.lastCheckedInTime);
  const hasCheckedOut = attendance
    ? isCheckedOut(attendance.lastCheckedInTime, attendance.lastCheckedOutTime)
    : false;
  const statusLabel = !hasCheckedIn
    ? "Not Checked-In"
    : hasCheckedOut
      ? "Checked-Out"
      : "Checked-in";
  const statusDotClass = !hasCheckedIn
    ? "bg-orange-600"
    : hasCheckedOut
      ? "bg-red-600"
      : "bg-green-600";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex ">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex gap-3 items-center justify-center cursor-pointer"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${statusDotClass}`}
                  ></div>
                  {statusLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <Field className="w-full max-w-sm">
                  <FieldLabel htmlFor="progress-upload">
                    <span>Your attendance</span>
                    <p className="ml-auto text-[0.75rem] font-medium leading-none">
                      {totalWorkLabel}
                    </p>
                  </FieldLabel>
                  <Progress value={workProgress} id="progress-upload" />
                </Field>
                <div className="mt-2 space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between items-center gap-3">
                    <span>Last checked in:</span>
                    <span className="text-right text-foreground">
                      {isLoadingAttendance ? "Loading..." : checkedInLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span>Last checked out:</span>
                    <span className="text-right text-foreground">
                      {isLoadingAttendance ? "Loading..." : checkedOutLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span>Break time:</span>
                    <span className="text-right text-foreground">
                      {isLoadingAttendance ? "Loading..." : breakLabel}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-2 w-full cursor-pointer"
                  onClick={handleToggleAttendance}
                  disabled={isLoadingAttendance || isTogglingAttendance}
                >
                  {isTogglingAttendance
                    ? "Updating..."
                    : !hasCheckedIn
                      ? "Check In"
                      : hasCheckedOut
                        ? "Check In"
                        : "Check Out"}
                </Button>
              </PopoverContent>
            </Popover>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
