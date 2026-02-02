"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HRTable, type ColumnDef } from "@/components/hr-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, Briefcase } from "lucide-react";
import { departmentsData, rolesData, roleCompensationData } from "./data";
import type { Department, RoleRecord, RoleCompensation } from "@/types";

export default function OrganizationPage() {
  const [departments] = useState<Department[]>(departmentsData);
  const [roles, setRoles] = useState<RoleRecord[]>(rolesData);
  const [compensations, setCompensations] =
    useState<RoleCompensation[]>(roleCompensationData);

  // Dialog states
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [showAddCompensationDialog, setShowAddCompensationDialog] =
    useState(false);

  // Form states
  const [roleFormData, setRoleFormData] = useState({
    department: "",
    role: "",
    description: "",
    permissions: [] as string[]
  });

  const [compensationFormData, setCompensationFormData] = useState({
    department: "",
    role: "",
    basePay: "",
    hra: "",
    bonus: "",
    deductions: ""
  });

  const [permissionInput, setPermissionInput] = useState("");

  // Calculate total employees
  const totalEmployees = departments.reduce(
    (sum, dept) => sum + dept.employeeCount,
    0
  );

  // Handle add role
  const handleAddRole = () => {
    if (
      !roleFormData.department ||
      !roleFormData.role ||
      !roleFormData.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newRole: RoleRecord = {
      id: `ROLE${roles.length + 1}`,
      department: roleFormData.department,
      role: roleFormData.role,
      employeeCount: 0,
      description: roleFormData.description,
      permissions: roleFormData.permissions,
      status: "Active"
    };

    setRoles([...roles, newRole]);
    toast.success("Role added successfully");
    setRoleFormData({
      department: "",
      role: "",
      description: "",
      permissions: []
    });
    setShowAddRoleDialog(false);
  };

  // Handle add compensation
  const handleAddCompensation = () => {
    if (
      !compensationFormData.department ||
      !compensationFormData.role ||
      !compensationFormData.basePay
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const basePay = parseFloat(compensationFormData.basePay);
    const hra = parseFloat(compensationFormData.hra || "0");
    const bonus = parseFloat(compensationFormData.bonus || "0");
    const deductions = parseFloat(compensationFormData.deductions || "0");
    const totalCompensation = basePay + hra + bonus - deductions;

    const newCompensation: RoleCompensation = {
      id: `COMP${compensations.length + 1}`,
      department: compensationFormData.department,
      role: compensationFormData.role,
      basePay,
      hra,
      bonus,
      deductions,
      totalCompensation
    };

    setCompensations([...compensations, newCompensation]);
    toast.success("Compensation details added successfully");
    setCompensationFormData({
      department: "",
      role: "",
      basePay: "",
      hra: "",
      bonus: "",
      deductions: ""
    });
    setShowAddCompensationDialog(false);
  };

  // Add permission to role
  const handleAddPermission = () => {
    if (permissionInput.trim()) {
      setRoleFormData({
        ...roleFormData,
        permissions: [...roleFormData.permissions, permissionInput]
      });
      setPermissionInput("");
    }
  };

  // Remove permission
  const handleRemovePermission = (index: number) => {
    setRoleFormData({
      ...roleFormData,
      permissions: roleFormData.permissions.filter((_, i) => i !== index)
    });
  };

  // Role table columns
  const roleColumns: ColumnDef<RoleRecord>[] = [
    {
      accessorKey: "department",
      header: "Department"
    },
    {
      accessorKey: "role",
      header: "Role"
    },
    {
      accessorKey: "employeeCount",
      header: "No. of Employees",
      cell: (row: RoleRecord) => (
        <span className="font-medium">{row.employeeCount}</span>
      )
    },
    {
      accessorKey: "description",
      header: "Description"
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: (row: RoleRecord) => (
        <div className="flex gap-1 flex-wrap">
          {row.permissions.slice(0, 2).map((perm, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {perm}
            </Badge>
          ))}
          {row.permissions.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.permissions.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (row: RoleRecord) => (
        <Badge
          variant={row.status === "Active" ? "default" : "secondary"}
          className="text-xs"
        >
          {row.status}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  // Compensation table columns
  const compensationColumns: ColumnDef<RoleCompensation>[] = [
    {
      accessorKey: "department",
      header: "Department"
    },
    {
      accessorKey: "role",
      header: "Role"
    },
    {
      accessorKey: "basePay",
      header: "Base Pay",
      cell: (row: RoleCompensation) => `$${row.basePay.toLocaleString()}`
    },
    {
      accessorKey: "hra",
      header: "HRA",
      cell: (row: RoleCompensation) => `$${row.hra.toLocaleString()}`
    },
    {
      accessorKey: "bonus",
      header: "Bonus",
      cell: (row: RoleCompensation) => `$${row.bonus.toLocaleString()}`
    },
    {
      accessorKey: "deductions",
      header: "Deductions",
      cell: (row: RoleCompensation) => `$${row.deductions.toLocaleString()}`
    },
    {
      accessorKey: "totalCompensation",
      header: "Total Compensation",
      cell: (row: RoleCompensation) => (
        <span className="font-semibold text-green-600">
          ${row.totalCompensation.toLocaleString()}
        </span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Organization Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage departments, roles, and compensation structure
        </p>
      </div>

      {/* Organization Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Departments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{departments.length}</p>
              <Briefcase className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{totalEmployees}</p>
              <Users className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{roles.length}</p>
              <Briefcase className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">
                {roles.filter((r) => r.status === "Active").length}
              </p>
              <Badge className="bg-green-500">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Departments Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-4 gap-2">
              <CardHeader className="p-0">
                <CardTitle className="text-lg">{dept.name}</CardTitle>
                <CardDescription>Head: {dept.head}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Employees
                  </span>
                  <Badge>{dept.employeeCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Budget</span>
                  <span className="font-semibold">
                    ${(dept.budget / 1000).toFixed(0)}K
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Roles Table */}
      <Card className="p-4 gap-2">
        <CardHeader className="p-0 flex flex-row items-center justify-between mb-4">
          <div>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Manage roles and their permissions across departments
            </CardDescription>
          </div>
          <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with permissions and assign to departments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-department">Department *</Label>
                    <Select
                      value={roleFormData.department}
                      onValueChange={(value) =>
                        setRoleFormData({
                          ...roleFormData,
                          department: value
                        })
                      }
                    >
                      <SelectTrigger id="role-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name *</Label>
                    <Input
                      id="role-name"
                      placeholder="e.g., Senior Developer"
                      value={roleFormData.role}
                      onChange={(e) =>
                        setRoleFormData({
                          ...roleFormData,
                          role: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role-description">Description *</Label>
                  <Textarea
                    id="role-description"
                    placeholder="Describe the role and responsibilities"
                    value={roleFormData.description}
                    onChange={(e) =>
                      setRoleFormData({
                        ...roleFormData,
                        description: e.target.value
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permission">Permissions</Label>
                  <div className="flex gap-2">
                    <Input
                      id="permission"
                      placeholder="Add permission"
                      value={permissionInput}
                      onChange={(e) => setPermissionInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddPermission();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddPermission}>
                      Add
                    </Button>
                  </div>

                  {roleFormData.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {roleFormData.permissions.map((perm, idx) => (
                        <Badge key={idx} variant="secondary" className="pr-2">
                          {perm}
                          <button
                            className="ml-2 hover:text-red-500"
                            onClick={() => handleRemovePermission(idx)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddRoleDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddRole}>Add Role</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <HRTable columns={roleColumns} data={roles} />
        </CardContent>
      </Card>

      {/* Role Compensation Table */}
      <Card className="p-4 gap-2">
        <CardHeader className="p-0 flex flex-row items-center justify-between mb-4">
          <div>
            <CardTitle>Role Compensation Structure</CardTitle>
            <CardDescription>
              Compensation details for each role across departments
            </CardDescription>
          </div>
          <Dialog
            open={showAddCompensationDialog}
            onOpenChange={setShowAddCompensationDialog}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Compensation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <DialogTitle>Add Role Compensation</DialogTitle>
                <DialogDescription>
                  Define compensation details for a specific role
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="comp-department">Department *</Label>
                    <Select
                      value={compensationFormData.department}
                      onValueChange={(value) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          department: value
                        })
                      }
                    >
                      <SelectTrigger id="comp-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comp-role">Role *</Label>
                    <Select
                      value={compensationFormData.role}
                      onValueChange={(value) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          role: value
                        })
                      }
                    >
                      <SelectTrigger id="comp-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter(
                            (r) =>
                              r.department === compensationFormData.department
                          )
                          .map((role) => (
                            <SelectItem key={role.id} value={role.role}>
                              {role.role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base-pay">Base Pay *</Label>
                    <Input
                      id="base-pay"
                      type="number"
                      placeholder="50000"
                      value={compensationFormData.basePay}
                      onChange={(e) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          basePay: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA</Label>
                    <Input
                      id="hra"
                      type="number"
                      placeholder="6000"
                      value={compensationFormData.hra}
                      onChange={(e) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          hra: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonus">Bonus</Label>
                    <Input
                      id="bonus"
                      type="number"
                      placeholder="5000"
                      value={compensationFormData.bonus}
                      onChange={(e) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          bonus: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deductions">Deductions</Label>
                    <Input
                      id="deductions"
                      type="number"
                      placeholder="3000"
                      value={compensationFormData.deductions}
                      onChange={(e) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          deductions: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCompensationDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddCompensation}>
                    Add Compensation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <HRTable columns={compensationColumns} data={compensations} />
        </CardContent>
      </Card>
    </div>
  );
}
