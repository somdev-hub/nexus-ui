"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOrgId } from "@/hooks/use-user-metadata";
import {
  MonthlyStrengthChart,
  LeaveTypeRadarChart,
  DepartmentLeaveChart,
  RoleLeaveChart,
  LeavePredictionChart,
  YearlyPayrollChart,
  RoleSalaryIncrementChart,
  PayrollPredictionChart,
  OvertimeAnomalyChart,
  FraudDetectionChart
} from "@/components/charts";
import { BreakStartBreakEndChart } from "@/components/charts/break-start-break-end-chart";
import { CheckInCheckOutChart } from "@/components/charts/check-in-check-out-chart";

import {
  getEmployeeMonthlyStrength,
  getLeaveTypeDistribution,
  getCheckInCheckOut,
  getBreakStartEnd,
  getYearlyPayrollData,
  getRoleWiseSalaryIncrement,
  getDepartmentWiseLeaves,
  getRoleWiseLeaves
} from "@/lib/auth-service";
import type {
  MonthlyStrengthResponse,
  LeaveTypeDistributionResponse,
  CheckInCheckOutResponse,
  BreakStartEndResponse,
  YearlyPayrollResponse,
  RoleWiseSalaryIncrementResponse,
  DepartmentWiseLeavesResponse,
  RoleWiseLeavesResponse
} from "@/types";

const leavePredictionData = [
  { month: "Jan", predicted: 25 },
  { month: "Feb", predicted: 28 },
  { month: "Mar", predicted: 32 },
  { month: "Apr", predicted: 35 },
  { month: "May", predicted: 38 },
  { month: "Jun", predicted: 42 },
  { month: "Jul", predicted: 45 },
  { month: "Aug", predicted: 48 },
  { month: "Sep", predicted: 50 },
  { month: "Oct", predicted: 52 },
  { month: "Nov", predicted: 55 },
  { month: "Dec", predicted: 58 }
];

const payrollPredictionData = [
  { month: "Jan", predicted: 2400000, actual: 2395000 },
  { month: "Feb", predicted: 2420000, actual: 2425000 },
  { month: "Mar", predicted: 2450000, actual: 2445000 },
  { month: "Apr", predicted: 2480000, actual: 2490000 },
  { month: "May", predicted: 2510000, actual: 2505000 },
  { month: "Jun", predicted: 2550000, actual: 2560000 },
  { month: "Jul", predicted: 2580000, actual: 2575000 },
  { month: "Aug", predicted: 2600000, actual: 2610000 }
];

const overtimeAnomalyData = [
  { week: "W1", actual: 45, normal: 40, anomaly: false },
  { week: "W2", actual: 48, normal: 40, anomaly: false },
  { week: "W3", actual: 72, normal: 40, anomaly: true },
  { week: "W4", actual: 42, normal: 40, anomaly: false },
  { week: "W5", actual: 85, normal: 40, anomaly: true },
  { week: "W6", actual: 38, normal: 40, anomaly: false },
  { week: "W7", actual: 41, normal: 40, anomaly: false },
  { week: "W8", actual: 43, normal: 40, anomaly: false }
];

const fraudDetectionData: Array<{
  issue: string;
  count: number;
  severity: "high" | "medium" | "low";
}> = [
  { issue: "Duplicate Payments", count: 3, severity: "high" },
  { issue: "Abnormal Spikes", count: 7, severity: "medium" },
  { issue: "Irregular Patterns", count: 2, severity: "high" },
  { issue: "Miscalculated Tax", count: 4, severity: "medium" },
  { issue: "Unauthorized Deductions", count: 1, severity: "high" }
];

function getMonthYearString(date: Date): string {
  const monthName = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${monthName.toUpperCase()} ${year}`;
}

const payrollMonthOrder: Array<keyof YearlyPayrollResponse> = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
];

const payrollMonthLabels: Record<keyof YearlyPayrollResponse, string> = {
  january: "Jan",
  february: "Feb",
  march: "Mar",
  april: "Apr",
  may: "May",
  june: "Jun",
  july: "Jul",
  august: "Aug",
  september: "Sep",
  october: "Oct",
  november: "Nov",
  december: "Dec"
};

const quarterOrder: Array<keyof RoleWiseSalaryIncrementResponse> = [
  "q1",
  "q2",
  "q3",
  "q4"
];

const quarterLabels: Record<keyof RoleWiseSalaryIncrementResponse, string> = {
  q1: "Q1",
  q2: "Q2",
  q3: "Q3",
  q4: "Q4"
};

function transformYearlyPayrollData(data: YearlyPayrollResponse) {
  return payrollMonthOrder.map((month) => ({
    month: payrollMonthLabels[month],
    amount: data[month] ?? 0
  }));
}

function transformRoleWiseSalaryIncrementData(
  data: RoleWiseSalaryIncrementResponse
) {
  const roles = Array.from(
    new Set(quarterOrder.flatMap((quarter) => Object.keys(data[quarter] || {})))
  ).sort();

  const chartData = quarterOrder.map((quarter) => {
    const row: Record<string, string | number> = {
      month: quarterLabels[quarter]
    };

    roles.forEach((role) => {
      row[role] = data[quarter]?.[role] ?? 0;
    });

    return row;
  });

  return { chartData, roles };
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const orgId = useOrgId();

  // API States
  const [monthlyStrengthData, setMonthlyStrengthData] =
    useState<MonthlyStrengthResponse | null>(null);
  const [leaveTypeData, setLeaveTypeData] =
    useState<LeaveTypeDistributionResponse | null>(null);
  const [checkInCheckOutData, setCheckInCheckOutData] =
    useState<CheckInCheckOutResponse | null>(null);
  const [breakStartEndData, setBreakStartEndData] =
    useState<BreakStartEndResponse | null>(null);
  const [departmentLeavesData, setDepartmentLeavesData] =
    useState<DepartmentWiseLeavesResponse | null>(null);
  const [roleLeavesData, setRoleLeavesData] =
    useState<RoleWiseLeavesResponse | null>(null);
  const [yearlyPayrollApiData, setYearlyPayrollApiData] =
    useState<YearlyPayrollResponse | null>(null);
  const [roleWiseSalaryApiData, setRoleWiseSalaryApiData] =
    useState<RoleWiseSalaryIncrementResponse | null>(null);

  // Loading States
  const [isLoadingMonthlyStrength, setIsLoadingMonthlyStrength] =
    useState(true);
  const [isLoadingLeaveType, setIsLoadingLeaveType] = useState(true);
  const [isLoadingCheckInCheckOut, setIsLoadingCheckInCheckOut] =
    useState(true);
  const [isLoadingBreakStartEnd, setIsLoadingBreakStartEnd] = useState(true);
  const [isLoadingDepartmentLeaves, setIsLoadingDepartmentLeaves] =
    useState(true);
  const [isLoadingRoleLeaves, setIsLoadingRoleLeaves] = useState(true);
  const [isLoadingYearlyPayroll, setIsLoadingYearlyPayroll] = useState(true);
  const [isLoadingRoleWiseSalary, setIsLoadingRoleWiseSalary] = useState(true);

  // Month/Year states
  const [selectedLeaveMonthYear, setSelectedLeaveMonthYear] = useState(
    getMonthYearString(new Date())
  );
  const [
    selectedCheckInCheckOutMonthYear,
    setSelectedCheckInCheckOutMonthYear
  ] = useState(getMonthYearString(new Date()));
  const [selectedBreakStartEndMonthYear, setSelectedBreakStartEndMonthYear] =
    useState(getMonthYearString(new Date()));
  const [
    selectedDepartmentLeavesMonthYear,
    setSelectedDepartmentLeavesMonthYear
  ] = useState(getMonthYearString(new Date()));
  const [selectedRoleLeavesMonthYear, setSelectedRoleLeavesMonthYear] =
    useState(getMonthYearString(new Date()));

  // Fetch monthly strength data
  useEffect(() => {
    if (!orgId) return;

    const fetchMonthlyStrength = async () => {
      try {
        setIsLoadingMonthlyStrength(true);
        const data = await getEmployeeMonthlyStrength(orgId);
        setMonthlyStrengthData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch monthly strength data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingMonthlyStrength(false);
      }
    };

    fetchMonthlyStrength();
  }, [orgId, toast]);

  // Fetch leave type data
  useEffect(() => {
    if (!orgId) return;

    const fetchLeaveType = async () => {
      try {
        setIsLoadingLeaveType(true);
        const data = await getLeaveTypeDistribution(
          orgId,
          selectedLeaveMonthYear
        );
        setLeaveTypeData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch leave type data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingLeaveType(false);
      }
    };

    fetchLeaveType();
  }, [orgId, selectedLeaveMonthYear, toast]);

  // Fetch check-in check-out data
  useEffect(() => {
    if (!orgId) return;

    const fetchCheckInCheckOut = async () => {
      try {
        setIsLoadingCheckInCheckOut(true);
        const data = await getCheckInCheckOut(
          orgId,
          selectedCheckInCheckOutMonthYear
        );
        setCheckInCheckOutData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch check-in check-out data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCheckInCheckOut(false);
      }
    };

    fetchCheckInCheckOut();
  }, [orgId, selectedCheckInCheckOutMonthYear, toast]);

  // Fetch break start-end data
  useEffect(() => {
    if (!orgId) return;

    const fetchBreakStartEnd = async () => {
      try {
        setIsLoadingBreakStartEnd(true);
        const data = await getBreakStartEnd(
          orgId,
          selectedBreakStartEndMonthYear
        );
        setBreakStartEndData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch break start-end data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingBreakStartEnd(false);
      }
    };

    fetchBreakStartEnd();
  }, [orgId, selectedBreakStartEndMonthYear, toast]);

  useEffect(() => {
    if (!orgId) return;

    const fetchDepartmentLeaves = async () => {
      try {
        setIsLoadingDepartmentLeaves(true);
        const data = await getDepartmentWiseLeaves(
          orgId,
          selectedDepartmentLeavesMonthYear
        );
        setDepartmentLeavesData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch department wise leaves data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingDepartmentLeaves(false);
      }
    };

    fetchDepartmentLeaves();
  }, [orgId, selectedDepartmentLeavesMonthYear, toast]);

  useEffect(() => {
    if (!orgId) return;

    const fetchRoleLeaves = async () => {
      try {
        setIsLoadingRoleLeaves(true);
        const data = await getRoleWiseLeaves(
          orgId,
          selectedRoleLeavesMonthYear
        );
        setRoleLeavesData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch role wise leaves data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingRoleLeaves(false);
      }
    };

    fetchRoleLeaves();
  }, [orgId, selectedRoleLeavesMonthYear, toast]);

  useEffect(() => {
    if (!orgId) return;

    const fetchYearlyPayroll = async () => {
      try {
        setIsLoadingYearlyPayroll(true);
        const data = await getYearlyPayrollData(orgId);
        setYearlyPayrollApiData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch yearly payroll data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingYearlyPayroll(false);
      }
    };

    fetchYearlyPayroll();
  }, [orgId, toast]);

  useEffect(() => {
    if (!orgId) return;

    const fetchRoleWiseSalary = async () => {
      try {
        setIsLoadingRoleWiseSalary(true);
        const data = await getRoleWiseSalaryIncrement(orgId);
        setRoleWiseSalaryApiData(data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to fetch role wise salary increment data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingRoleWiseSalary(false);
      }
    };

    fetchRoleWiseSalary();
  }, [orgId, toast]);

  const yearlyPayrollChartData = yearlyPayrollApiData
    ? transformYearlyPayrollData(yearlyPayrollApiData)
    : [];

  const roleWiseSalaryChartData = roleWiseSalaryApiData
    ? transformRoleWiseSalaryIncrementData(roleWiseSalaryApiData)
    : { chartData: [], roles: [] };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive insights into HR operations
        </p>
      </div>

      {/* Attendance Analytics Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold">Attendance Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyStrengthChart
            data={monthlyStrengthData}
            isLoading={isLoadingMonthlyStrength}
          />
          <LeaveTypeRadarChart
            data={leaveTypeData}
            isLoading={isLoadingLeaveType}
            onMonthYearChange={setSelectedLeaveMonthYear}
          />
        </div>

        {/* <YearlyStrengthChart data={yearlyStrengthData} /> */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CheckInCheckOutChart
            data={checkInCheckOutData}
            isLoading={isLoadingCheckInCheckOut}
            onMonthYearChange={setSelectedCheckInCheckOutMonthYear}
          />
          <BreakStartBreakEndChart
            data={breakStartEndData}
            isLoading={isLoadingBreakStartEnd}
            onMonthYearChange={setSelectedBreakStartEndMonthYear}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentLeaveChart
            data={departmentLeavesData}
            isLoading={isLoadingDepartmentLeaves}
            selectedMonthYear={selectedDepartmentLeavesMonthYear}
            onMonthYearChange={setSelectedDepartmentLeavesMonthYear}
          />
          <RoleLeaveChart
            data={roleLeavesData}
            isLoading={isLoadingRoleLeaves}
            selectedMonthYear={selectedRoleLeavesMonthYear}
            onMonthYearChange={setSelectedRoleLeavesMonthYear}
          />
        </div>
      </div>

      {/* Predictive Analysis Section */}
      <div className="space-y-6">
        <LeavePredictionChart data={leavePredictionData} />
      </div>

      {/* Payroll Analytics Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold">Payroll Analytics</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <YearlyPayrollChart
            data={yearlyPayrollChartData}
            isLoading={isLoadingYearlyPayroll}
          />

          <RoleSalaryIncrementChart
            data={
              roleWiseSalaryChartData.chartData as Array<{
                month: string;
                [key: string]: string | number;
              }>
            }
            roles={roleWiseSalaryChartData.roles}
            isLoading={isLoadingRoleWiseSalary}
          />
        </div>
      </div>

      {/* Payroll Predictive Analytics Section */}
      <div className="space-y-6">
        <PayrollPredictionChart data={payrollPredictionData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OvertimeAnomalyChart data={overtimeAnomalyData} />
          <FraudDetectionChart data={fraudDetectionData} />
        </div>
      </div>
    </div>
  );
}
