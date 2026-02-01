"use client";

import {
  MonthlyStrengthChart,
  LeaveTypeRadarChart,
  YearlyStrengthChart,
  DepartmentLeaveChart,
  RoleLeaveChart,
  LeavePredictionChart,
  YearlyPayrollChart,
  RoleSalaryIncrementChart,
  PayrollPredictionChart,
  OvertimeAnomalyChart,
  FraudDetectionChart
} from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for charts
const monthlyStrengthData = [
  { month: "Jan", strength: 240 },
  { month: "Feb", strength: 245 },
  { month: "Mar", strength: 248 },
  { month: "Apr", strength: 250 },
  { month: "May", strength: 255 },
  { month: "Jun", strength: 260 },
  { month: "Jul", strength: 265 },
  { month: "Aug", strength: 262 },
  { month: "Sep", strength: 268 },
  { month: "Oct", strength: 270 },
  { month: "Nov", strength: 272 },
  { month: "Dec", strength: 275 }
];

const leaveTypeData = [
  { leaveType: "Sick Leave", employees: 45 },
  { leaveType: "Earned Leave", employees: 120 },
  { leaveType: "Casual Leave", employees: 85 },
  { leaveType: "Personal Leave", employees: 30 },
  { leaveType: "Comp. Off", employees: 20 }
];

const yearlyStrengthData = [
  { month: "Jan", strength: 240 },
  { month: "Feb", strength: 245 },
  { month: "Mar", strength: 248 },
  { month: "Apr", strength: 250 },
  { month: "May", strength: 255 },
  { month: "Jun", strength: 260 },
  { month: "Jul", strength: 265 },
  { month: "Aug", strength: 262 },
  { month: "Sep", strength: 268 },
  { month: "Oct", strength: 270 },
  { month: "Nov", strength: 272 },
  { month: "Dec", strength: 275 }
];

const departmentLeaveDataMonthly = [
  { department: "Engineering", leaves: 12 },
  { department: "Marketing", leaves: 8 },
  { department: "HR", leaves: 4 },
  { department: "Finance", leaves: 6 },
  { department: "Operations", leaves: 9 }
];

const departmentLeaveDataYearly = [
  { department: "Engineering", leaves: 120 },
  { department: "Marketing", leaves: 85 },
  { department: "HR", leaves: 45 },
  { department: "Finance", leaves: 65 },
  { department: "Operations", leaves: 90 }
];

const roleLeaveDataMonthly = [
  { role: "Senior Developer", leaves: 4 },
  { role: "Developer", leaves: 6 },
  { role: "Manager", leaves: 3 },
  { role: "Executive", leaves: 2 },
  { role: "Intern", leaves: 1 }
];

const roleLeaveDataYearly = [
  { role: "Senior Developer", leaves: 45 },
  { role: "Developer", leaves: 65 },
  { role: "Manager", leaves: 35 },
  { role: "Executive", leaves: 28 },
  { role: "Intern", leaves: 15 }
];

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

const yearlyPayrollData = [
  { month: "Jan", amount: 2400000 },
  { month: "Feb", amount: 2420000 },
  { month: "Mar", amount: 2450000 },
  { month: "Apr", amount: 2480000 },
  { month: "May", amount: 2510000 },
  { month: "Jun", amount: 2550000 },
  { month: "Jul", amount: 2580000 },
  { month: "Aug", amount: 2600000 },
  { month: "Sep", amount: 2620000 },
  { month: "Oct", amount: 2650000 },
  { month: "Nov", amount: 2680000 },
  { month: "Dec", amount: 2750000 }
];

const roleSalaryIncrementData = [
  { month: "Q1", seniorDeveloper: 850000, developer: 550000, manager: 750000 },
  { month: "Q2", seniorDeveloper: 860000, developer: 560000, manager: 765000 },
  { month: "Q3", seniorDeveloper: 875000, developer: 575000, manager: 780000 },
  { month: "Q4", seniorDeveloper: 890000, developer: 590000, manager: 800000 }
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

export default function AnalyticsPage() {
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
          <h2 className="text-2xl font-bold">Attendance Analytics</h2>
          <p className="text-gray-600 text-sm mt-1">
            Employee strength and leave distribution analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyStrengthChart data={monthlyStrengthData} />
          <LeaveTypeRadarChart data={leaveTypeData} />
        </div>

        <YearlyStrengthChart data={yearlyStrengthData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentLeaveChart
            monthlyData={departmentLeaveDataMonthly}
            yearlyData={departmentLeaveDataYearly}
          />
          <RoleLeaveChart
            monthlyData={roleLeaveDataMonthly}
            yearlyData={roleLeaveDataYearly}
          />
        </div>
      </div>

      {/* Predictive Analysis Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold">Predictive Analysis</h2>
          <p className="text-gray-600 text-sm mt-1">
            Forecast and trend predictions
          </p>
        </div>

        <LeavePredictionChart data={leavePredictionData} />
      </div>

      {/* Payroll Analytics Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold">Payroll Analytics</h2>
          <p className="text-gray-600 text-sm mt-1">
            Payroll expenditure and salary trends
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <YearlyPayrollChart data={yearlyPayrollData} />

          <RoleSalaryIncrementChart
            data={roleSalaryIncrementData}
            roles={["seniorDeveloper", "developer", "manager"]}
          />
        </div>
      </div>

      {/* Payroll Predictive Analytics Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold">Payroll Predictive Analytics</h2>
          <p className="text-gray-600 text-sm mt-1">
            Cost predictions and anomaly detection
          </p>
        </div>

        <PayrollPredictionChart data={payrollPredictionData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OvertimeAnomalyChart data={overtimeAnomalyData} />
          <FraudDetectionChart data={fraudDetectionData} />
        </div>
      </div>
    </div>
  );
}
