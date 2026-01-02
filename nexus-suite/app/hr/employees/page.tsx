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
import { Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { employees, type Employee } from "./data";

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "id",
      header: "ID"
    },
    {
      accessorKey: "name",
      header: "Name"
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "department",
      header: "Department"
    },
    {
      accessorKey: "position",
      header: "Position"
    },
    {
      accessorKey: "status",
      header: "Status"
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: Employee) => (
        <div className="flex gap-2">
          <Link href={`/hr/employees/${row.id}`}>
            <Button size="sm" variant="ghost">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button size="sm" variant="ghost">
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-gray-500 mt-2">
            Manage employee information and profiles
          </p>
        </div>
        <Link href="/hr/employees/add">
          <Button>Add Employee</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>
            Total Employees: {filteredEmployees.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HRTable columns={columns} data={filteredEmployees} />
        </CardContent>
      </Card>
    </div>
  );
}
