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
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { rolesData, type Role } from "./data";
import Link from "next/link";

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = rolesData.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "Role Name"
    },
    {
      accessorKey: "description",
      header: "Description"
    },
    {
      accessorKey: "employees",
      header: "Assigned Employees"
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: (row: Role) => (
        <div className="flex gap-1">
          {row.permissions.slice(0, 3).map((perm: string, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {perm}
            </Badge>
          ))}
          {row.permissions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.permissions.length - 3}
            </Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (row: Role) => (
        <Badge variant={row.status === "Active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: Role) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            <Eye className="w-4 h-4" />
          </Button>
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
          <h1 className="text-3xl font-bold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-gray-500 mt-2">Assign and manage employee roles</p>
        </div>
        <Button>Create Role</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">{rolesData.length}</p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">
              {rolesData.filter((r) => r.status === "Active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">
              Total Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">
              {rolesData.reduce(
                (sum, role) => sum + role.permissions.length,
                0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card className="gap-2 p-4">
        <CardHeader className="p-0">
          <CardTitle>Available Roles</CardTitle>
          <CardDescription>Total Roles: {filteredRoles.length}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <HRTable columns={columns} data={filteredRoles} />
        </CardContent>
      </Card>

      <Card className="gap-2 p-4">
        <CardHeader className="p-0">
          <CardTitle>Role Assignment</CardTitle>
          <CardDescription>Assign roles to employees</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-sm text-gray-600 mb-4">
            To assign roles to employees, select an employee from the employee
            directory and update their role.
          </p>
          <Link href="/hr/employees">
            <Button>Go to Employees</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
