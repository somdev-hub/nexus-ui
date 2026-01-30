"use client";

import { HRTable, type ColumnDef } from "@/components/hr-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit } from "lucide-react";
import { useState } from "react";
import { workMonitoringData, type WorkTask } from "./data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function WorkMonitoringPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredWork = workMonitoringData.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterStatus || record.status === filterStatus)
  );

  const columns: ColumnDef<WorkTask>[] = [
    {
      accessorKey: "taskId",
      header: "Task ID"
    },
    {
      accessorKey: "employeeName",
      header: "Employee"
    },
    {
      accessorKey: "taskName",
      header: "Task Name"
    },
    {
      accessorKey: "project",
      header: "Project"
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: (row: WorkTask) => (
        <div className="flex gap-2 items-center">
          <Progress value={row.progress} className="w-24" />
          <span className="text-sm">{row.progress}%</span>
        </div>
      )
    },
    {
      accessorKey: "hoursLogged",
      header: "Hours Logged"
    },
    {
      accessorKey: "dueDate",
      header: "Due Date"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (row: WorkTask) => {
        let variant: "default" | "secondary" | "outline" = "default";
        if (row.status === "On Track") variant = "default";
        if (row.status === "At Risk") variant = "secondary";
        if (row.status === "Delayed") variant = "outline";
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: WorkTask) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const chartData = [
    {
      name: "Completed",
      value: workMonitoringData.filter((t) => t.status === "Completed").length
    },
    {
      name: "On Track",
      value: workMonitoringData.filter((t) => t.status === "On Track").length
    },
    {
      name: "At Risk",
      value: workMonitoringData.filter((t) => t.status === "At Risk").length
    },
    {
      name: "Delayed",
      value: workMonitoringData.filter((t) => t.status === "Delayed").length
    }
  ];

  const avgProgress = Math.round(
    workMonitoringData.reduce((sum, task) => sum + task.progress, 0) /
      workMonitoringData.length
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Work Monitoring</h1>
        <p className="text-gray-500 mt-2">
          Monitor productivity and task completion
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">{workMonitoringData.length}</p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-green-600">
              {workMonitoringData.filter((t) => t.status === "On Track").length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-orange-600">
              {workMonitoringData.filter((t) => t.status === "At Risk").length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">{avgProgress}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle>Task Status Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search task..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="On Track">On Track</SelectItem>
            <SelectItem value="At Risk">At Risk</SelectItem>
            <SelectItem value="Delayed">Delayed</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button>Create Task</Button>
        <Button variant="outline">Generate Report</Button>
      </div>

      <Card className="p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle>Task List</CardTitle>
          <CardDescription>Total Tasks: {filteredWork.length}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <HRTable columns={columns} data={filteredWork} />
        </CardContent>
      </Card>
    </div>
  );
}
