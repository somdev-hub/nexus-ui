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
import type {
  Department,
  RoleRecord,
  RoleCompensation,
  CompensationData,
  Bonus,
  Deduction
} from "@/types";
import { EmployeeLevelTypes } from "@/types/EmployeeLevelTypes";
import { computeSalaryTotals } from "@/utils/salary-calculator";

export default function OrganizationPage() {
  const [departments, setDepartments] = useState<Department[]>(departmentsData);
  const [roles, setRoles] = useState<RoleRecord[]>(rolesData);
  const [compensations, setCompensations] =
    useState<RoleCompensation[]>(roleCompensationData);

  // Dialog states
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [showAddCompensationDialog, setShowAddCompensationDialog] =
    useState(false);
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);

  // Form states
  const [departmentFormData, setDepartmentFormData] = useState({
    name: ""
  });

  const [roleFormData, setRoleFormData] = useState({
    department: "",
    role: "",
    description: "",
    permissions: [] as string[]
  });

  // Compensation form state
  const [compensationFormData, setCompensationFormData] = useState<RoleCompensation>({
    orgId: 1,
    role: "",
    deptId: 0,
    employeeLevel: EmployeeLevelTypes.L0,
    minBasePay: 0,
    maxBasePay: 0,
    minTotalBonuses: 0,
    maxTotalBonuses: 0,
    minTotalDeductions: 0,
    maxTotalDeductions: 0,
    minAnnualSalary: "",
    maxAnnualSalary: ""
  });

  const [permissionInput, setPermissionInput] = useState("");

  // Calculate total employees
  const totalEmployees = departments.reduce(
    (sum, dept) => sum + dept.employeeCount,
    0
  );

  // Handle add department
  const handleAddDepartment = () => {
    if (!departmentFormData.name.trim()) {
      toast.error("Please enter a department name");
      return;
    }

    const newDepartment: Department = {
      id: `DEPT${departments.length + 1}`,
      name: departmentFormData.name,
      head: "TBD",
      employeeCount: 0,
      budget: 0
    };

    setDepartments([...departments, newDepartment]);
    toast.success("Department added successfully");
    setDepartmentFormData({
      name: ""
    });
    setShowAddDepartmentDialog(false);
  };

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

  const handleAddCompensation = () => {
    if (
      !compensationFormData.role ||
      !compensationFormData.deptId ||
      compensationFormData.minBasePay === 0 ||
      compensationFormData.maxBasePay === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newCompensation: RoleCompensation = {
      ...compensationFormData
    };

    setCompensations([...compensations, newCompensation]);
    toast.success("Role compensation details added successfully");

    // Reset form
    setCompensationFormData({
      orgId: 1,
      role: "",
      deptId: 0,
      employeeLevel: EmployeeLevelTypes.L0,
      minBasePay: 0,
      maxBasePay: 0,
      minTotalBonuses: 0,
      maxTotalBonuses: 0,
      minTotalDeductions: 0,
      maxTotalDeductions: 0,
      minAnnualSalary: "",
      maxAnnualSalary: ""
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
      accessorKey: "role",
      header: "Role"
    },
    {
      accessorKey: "employeeLevel",
      header: "Employee Level"
    },
    {
      accessorKey: "minBasePay",
      header: "Min Base Pay",
      cell: (row: RoleCompensation) => `$${(row.minBasePay || 0).toLocaleString()}`
    },
    {
      accessorKey: "maxBasePay",
      header: "Max Base Pay",
      cell: (row: RoleCompensation) => `$${(row.maxBasePay || 0).toLocaleString()}`
    },
    {
      accessorKey: "minTotalBonuses",
      header: "Min Bonuses",
      cell: (row: RoleCompensation) => `$${(row.minTotalBonuses || 0).toLocaleString()}`
    },
    {
      accessorKey: "maxTotalBonuses",
      header: "Max Bonuses",
      cell: (row: RoleCompensation) => `$${(row.maxTotalBonuses || 0).toLocaleString()}`
    },
    {
      accessorKey: "minAnnualSalary",
      header: "Min Annual Salary"
    },
    {
      accessorKey: "maxAnnualSalary",
      header: "Max Annual Salary"
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Departments Overview</h2>
          <Dialog
            open={showAddDepartmentDialog}
            onOpenChange={setShowAddDepartmentDialog}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new department in your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dept-name">Department Name *</Label>
                  <Input
                    id="dept-name"
                    placeholder="e.g., Engineering, Sales, HR"
                    value={departmentFormData.name}
                    onChange={(e) =>
                      setDepartmentFormData({ name: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddDepartment();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDepartmentDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddDepartment}>Add Department</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                  Define compensation range for a role and employee level
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="comp-department">Department *</Label>
                    <Select
                      value={compensationFormData.deptId.toString()}
                      onValueChange={(value) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          deptId: parseInt(value)
                        })
                      }
                    >
                      <SelectTrigger id="comp-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {departments.map((dept, idx) => (
                          <SelectItem key={dept.id} value={(idx + 1).toString()}>
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
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.role}>
                            {role.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emp-level">Employee Level *</Label>
                  <Select
                    value={compensationFormData.employeeLevel}
                    onValueChange={(value) =>
                      setCompensationFormData({
                        ...compensationFormData,
                        employeeLevel: value as EmployeeLevelTypes
                      })
                    }
                  >
                    <SelectTrigger id="emp-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EmployeeLevelTypes).map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Base Pay Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-base-pay">Min Base Pay *</Label>
                      <Input
                        id="min-base-pay"
                        type="number"
                        placeholder="30000"
                        value={compensationFormData.minBasePay || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            minBasePay: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-base-pay">Max Base Pay *</Label>
                      <Input
                        id="max-base-pay"
                        type="number"
                        placeholder="60000"
                        value={compensationFormData.maxBasePay || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            maxBasePay: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Bonuses Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-bonus">Min Total Bonuses</Label>
                      <Input
                        id="min-bonus"
                        type="number"
                        placeholder="5000"
                        value={compensationFormData.minTotalBonuses || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            minTotalBonuses: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-bonus">Max Total Bonuses</Label>
                      <Input
                        id="max-bonus"
                        type="number"
                        placeholder="15000"
                        value={compensationFormData.maxTotalBonuses || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            maxTotalBonuses: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Deductions Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-deduction">Min Total Deductions</Label>
                      <Input
                        id="min-deduction"
                        type="number"
                        placeholder="2000"
                        value={compensationFormData.minTotalDeductions || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            minTotalDeductions: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-deduction">Max Total Deductions</Label>
                      <Input
                        id="max-deduction"
                        type="number"
                        placeholder="5000"
                        value={compensationFormData.maxTotalDeductions || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            maxTotalDeductions: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Annual Salary Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-annual-salary">Min Annual Salary</Label>
                      <Input
                        id="min-annual-salary"
                        placeholder="360000"
                        value={compensationFormData.minAnnualSalary || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            minAnnualSalary: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-annual-salary">Max Annual Salary</Label>
                      <Input
                        id="max-annual-salary"
                        placeholder="720000"
                        value={compensationFormData.maxAnnualSalary || ""}
                        onChange={(e) =>
                          setCompensationFormData({
                            ...compensationFormData,
                            maxAnnualSalary: e.target.value
                          })
                        }
                      />
                    </div>
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
