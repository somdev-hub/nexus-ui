"use client";

import React, { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import type {
  AttendanceRecord,
  AttendanceStatus
} from "@/app/hr/employees/[id]/attendance";
import { getAttendanceLabel } from "@/app/hr/employees/[id]/attendance";

interface AttendanceGraphProps {
  records: AttendanceRecord[];
  threshold?: number;
}

interface CalendarCell {
  date: string;
  record: AttendanceRecord | null;
  week: number;
  day: number;
}

const getStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case "present":
      return "bg-blue-500 hover:bg-blue-600"; // shadcn primary
    case "absent":
      return "bg-red-500 hover:bg-red-600";
    case "leave":
      return "bg-gray-200 hover:bg-gray-300";
    case "partial":
      return "bg-yellow-400 hover:bg-yellow-500";
    default:
      return "bg-gray-100";
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getStatusBgColor = (status: AttendanceStatus): string => {
  switch (status) {
    case "present":
      return "bg-blue-100";
    case "absent":
      return "bg-red-100";
    case "leave":
      return "bg-gray-100";
    case "partial":
      return "bg-yellow-100";
    default:
      return "bg-gray-50";
  }
};

export function AttendanceGraph({
  records,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  threshold = 7
}: AttendanceGraphProps) {
  // Organize records into a calendar structure
  const calendarData = useMemo(() => {
    if (records.length === 0) return [];

    // Helper to format date as YYYY-MM-DD in local timezone
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Create a map of date -> record for O(1) lookup
    const recordMap = new Map(records.map((r) => [r.date, r]));

    // Get date range
    const dates = records
      .map((r) => new Date(r.date))
      .sort((a, b) => a.getTime() - b.getTime());
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);

    // Start from the Monday of the week containing startDate
    const firstMonday = new Date(startDate);
    const dayOfWeekStart = firstMonday.getDay();
    // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // We need to go back to Monday: Mon=0 back, Tue=1 back, ..., Sun=6 back
    const daysToSubtract = dayOfWeekStart === 0 ? 6 : dayOfWeekStart - 1;
    firstMonday.setDate(firstMonday.getDate() - daysToSubtract);

    const calendar: CalendarCell[] = [];
    const currentDate = new Date(firstMonday);
    let weekCounter = 0;

    // Generate all cells including empty ones
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = Mon, 4 = Fri, 5 = Sat, 6 = Sun

      const record = recordMap.get(dateStr) || null;

      calendar.push({
        date: dateStr,
        record,
        week: weekCounter,
        day: adjustedDay
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);

      // Update week counter when moving from Sunday to Monday
      if (adjustedDay === 6) {
        weekCounter++;
      }
    }

    return calendar;
  }, [records]);

  // Group by weeks for rendering
  const weeks = useMemo(() => {
    const weekMap = new Map<number, CalendarCell[]>();

    calendarData.forEach((cell) => {
      if (!weekMap.has(cell.week)) {
        weekMap.set(cell.week, []);
      }
      weekMap.get(cell.week)!.push(cell);
    });

    return Array.from(weekMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, cells]) => cells.sort((a, b) => a.day - b.day));
  }, [calendarData]);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (weeks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No attendance data available</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm text-gray-700">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded" />
            <span className="text-sm text-gray-700">Partial Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm text-gray-700">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <span className="text-sm text-gray-700">On Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
            <span className="text-sm text-gray-700">No Data</span>
          </div>
        </div>

        {/* Graph - scrollable container with width trick to prevent expansion */}
        <div className="w-0 min-w-full overflow-x-auto pb-2">
          <table className="border-separate border-spacing-1">
            {/* Week headers */}
            <thead>
              <tr>
                <th className="w-12"></th>
                {weeks.map((week, weekIdx) => (
                  <th key={weekIdx} className="w-5 text-center">
                    {weekIdx % 4 === 0 && (
                      <span className="text-xs text-gray-500">
                        {weekIdx + 1 < 10 ? "W0" : "W"}
                        {weekIdx + 1}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Day rows */}
              {dayLabels.map((label, dayIdx) => (
                <tr key={dayIdx}>
                  {/* Day label */}
                  <td className="w-12 text-right pr-2">
                    <span className="text-xs text-gray-500 font-medium">
                      {label}
                    </span>
                  </td>

                  {/* Cells for each week */}
                  {weeks.map((week, weekIdx) => {
                    const cell = week.find((c) => c.day === dayIdx);

                    if (!cell) {
                      return (
                        <td key={`${weekIdx}-${dayIdx}`}>
                          <div className="w-5 h-5 bg-gray-50 border border-gray-200 rounded" />
                        </td>
                      );
                    }

                    if (!cell.record) {
                      return (
                        <td key={`${weekIdx}-${dayIdx}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-5 h-5 bg-gray-100 border border-gray-300 rounded cursor-default" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>{new Date(cell.date).toLocaleDateString()}</p>
                              <p className="text-gray-400">Weekend</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    }

                    const { label: statusLabel, details } = getAttendanceLabel(
                      cell.record
                    );

                    return (
                      <td key={`${weekIdx}-${dayIdx}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-5 h-5 rounded cursor-pointer transition-all ${getStatusColor(
                                cell.record.status
                              )}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-semibold">{statusLabel}</p>
                            <p>{details}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Total Days</p>
            <p className="text-lg font-semibold">{records.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Present</p>
            <p className="text-lg font-semibold text-blue-600">
              {records.filter((r) => r.status === "present").length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Partial</p>
            <p className="text-lg font-semibold text-yellow-600">
              {records.filter((r) => r.status === "partial").length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Absent</p>
            <p className="text-lg font-semibold text-red-600">
              {records.filter((r) => r.status === "absent").length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Leave</p>
            <p className="text-lg font-semibold text-gray-600">
              {records.filter((r) => r.status === "leave").length}
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
