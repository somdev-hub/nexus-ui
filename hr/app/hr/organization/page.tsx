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
import { computeSalaryTotals } from "@/utils/salary-calculator";

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

  // Compensation form state
  const [compensationFormData, setCompensationFormData] =
    useState<CompensationData>({
      basePay: 0,
      hra: 0,
      pf: 0,
      gratuity: 0,
      insurancePremium: 0,
      grossPay: 0,
      netPay: 0,
      annualPackage: "",
      bonuses: [],
      deductions: [],
      bankRecords: []
    });

  const [compensationMetadata, setCompensationMetadata] = useState({
    department: "",
    role: ""
  });

  const [bonusInput, setBonusInput] = useState<Bonus>({
    bonusType: "",
    amount: 0,
    percentageOfSalary: 0,
    expiresOn: new Date()
  });

  const [deductionInput, setDeductionInput] = useState<Deduction>({
    deductionType: "",
    description: "",
    amount: 0,
    percentageOfSalary: 0,
    expiresOn: new Date()
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

  // Handle base pay change with auto-calculation
  const handleBasePayChange = (basePay: number) => {
    setCompensationFormData((prev) => ({
      ...prev,
      basePay
    }));

    if (basePay > 0) {
      const totals = computeSalaryTotals(
        basePay,
        compensationFormData.bonuses,
        compensationFormData.deductions
      );
      const totalBonus = compensationFormData.bonuses.reduce(
        (sum, b) => sum + b.amount,
        0
      );
      const totalDeductions = compensationFormData.deductions.reduce(
        (sum, d) => sum + d.amount,
        0
      );
      const finalNetPay = totals.netPay + totalBonus - totalDeductions;

      setCompensationFormData((prev) => ({
        ...prev,
        hra: totals.hra,
        pf: totals.pf,
        gratuity: totals.gratuity,
        insurancePremium: totals.insurancePremium,
        grossPay: totals.grossPay,
        netPay: finalNetPay
      }));
    }
  };

  // Handle add bonus
  const handleAddBonus = () => {
    if (!bonusInput.bonusType || bonusInput.percentageOfSalary === 0) {
      toast.error("Please fill bonus details");
      return;
    }
    setCompensationFormData((prev) => {
      const amount = prev.basePay * (bonusInput.percentageOfSalary / 100);
      const newBonus = { ...bonusInput, amount };
      const bonuses = [...prev.bonuses, newBonus];

      const totals = computeSalaryTotals(
        prev.basePay,
        bonuses,
        prev.deductions
      );
      const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);
      const totalDeductions = prev.deductions.reduce(
        (sum, d) => sum + d.amount,
        0
      );
      const finalNetPay = totals.netPay + totalBonus - totalDeductions;

      return {
        ...prev,
        bonuses,
        hra: totals.hra,
        pf: totals.pf,
        gratuity: totals.gratuity,
        insurancePremium: totals.insurancePremium,
        grossPay: totals.grossPay,
        netPay: finalNetPay
      };
    });
    setBonusInput({
      bonusType: "",
      amount: 0,
      percentageOfSalary: 0,
      expiresOn: new Date()
    });
    toast.success("Bonus added");
  };

  // Handle remove bonus
  const handleRemoveBonus = (index: number) => {
    setCompensationFormData((prev) => {
      const bonuses = prev.bonuses.filter((_, i) => i !== index);
      const totals = computeSalaryTotals(
        prev.basePay,
        bonuses,
        prev.deductions
      );
      const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);
      const totalDeductions = prev.deductions.reduce(
        (sum, d) => sum + d.amount,
        0
      );
      const finalNetPay = totals.netPay + totalBonus - totalDeductions;
      return {
        ...prev,
        bonuses,
        hra: totals.hra,
        pf: totals.pf,
        gratuity: totals.gratuity,
        insurancePremium: totals.insurancePremium,
        grossPay: totals.grossPay,
        netPay: finalNetPay
      };
    });
  };

  // Handle add deduction
  const handleAddDeduction = () => {
    if (
      !deductionInput.deductionType ||
      deductionInput.percentageOfSalary === 0
    ) {
      toast.error("Please fill deduction details");
      return;
    }
    setCompensationFormData((prev) => {
      const amount = prev.basePay * (deductionInput.percentageOfSalary / 100);
      const newDeduction = { ...deductionInput, amount };
      const deductions = [...prev.deductions, newDeduction];

      const totals = computeSalaryTotals(
        prev.basePay,
        prev.bonuses,
        deductions
      );
      const totalBonus = prev.bonuses.reduce((sum, b) => sum + b.amount, 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const finalNetPay = totals.netPay + totalBonus - totalDeductions;

      return {
        ...prev,
        deductions,
        hra: totals.hra,
        pf: totals.pf,
        gratuity: totals.gratuity,
        insurancePremium: totals.insurancePremium,
        grossPay: totals.grossPay,
        netPay: finalNetPay
      };
    });
    setDeductionInput({
      deductionType: "",
      description: "",
      amount: 0,
      percentageOfSalary: 0,
      expiresOn: new Date()
    });
    toast.success("Deduction added");
  };

  // Handle remove deduction
  const handleRemoveDeduction = (index: number) => {
    setCompensationFormData((prev) => {
      const deductions = prev.deductions.filter((_, i) => i !== index);
      const totals = computeSalaryTotals(
        prev.basePay,
        prev.bonuses,
        deductions
      );
      const totalBonus = prev.bonuses.reduce((sum, b) => sum + b.amount, 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const finalNetPay = totals.netPay + totalBonus - totalDeductions;
      return {
        ...prev,
        deductions,
        hra: totals.hra,
        pf: totals.pf,
        gratuity: totals.gratuity,
        insurancePremium: totals.insurancePremium,
        grossPay: totals.grossPay,
        netPay: finalNetPay
      };
    });
  };

  const handleAddCompensation = () => {
    if (
      !compensationMetadata.department ||
      !compensationMetadata.role ||
      compensationFormData.basePay === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalBonus = compensationFormData.bonuses.reduce(
      (sum, b) => sum + b.amount,
      0
    );
    const totalDeductions = compensationFormData.deductions.reduce(
      (sum, d) => sum + d.amount,
      0
    );
    const totalCompensation =
      compensationFormData.basePay +
      compensationFormData.hra +
      totalBonus -
      totalDeductions;

    const newCompensation: RoleCompensation = {
      id: `COMP${compensations.length + 1}`,
      department: compensationMetadata.department,
      role: compensationMetadata.role,
      basePay: compensationFormData.basePay,
      hra: compensationFormData.hra,
      bonus: totalBonus,
      deductions: totalDeductions,
      totalCompensation
    };

    setCompensations([...compensations, newCompensation]);
    toast.success("Compensation details added successfully");

    // Reset form
    setCompensationFormData({
      basePay: 0,
      hra: 0,
      pf: 0,
      gratuity: 0,
      insurancePremium: 0,
      grossPay: 0,
      netPay: 0,
      annualPackage: "",
      bonuses: [],
      deductions: [],
      bankRecords: []
    });
    setCompensationMetadata({
      department: "",
      role: ""
    });
    setBonusInput({
      bonusType: "",
      amount: 0,
      percentageOfSalary: 0,
      expiresOn: new Date()
    });
    setDeductionInput({
      deductionType: "",
      description: "",
      amount: 0,
      percentageOfSalary: 0,
      expiresOn: new Date()
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
                      value={compensationMetadata.department}
                      onValueChange={(value) =>
                        setCompensationMetadata({
                          ...compensationMetadata,
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
                      value={compensationMetadata.role}
                      onValueChange={(value) =>
                        setCompensationMetadata({
                          ...compensationMetadata,
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
                              r.department === compensationMetadata.department
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

                <div className="space-y-2">
                  <Label htmlFor="base-pay">Base Pay *</Label>
                  <Input
                    id="base-pay"
                    type="number"
                    placeholder="50000"
                    value={compensationFormData.basePay || ""}
                    onChange={(e) =>
                      handleBasePayChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Bonus Section */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Bonuses</h3>
                  <div className="space-y-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="bonus-type">Bonus Type</Label>
                        <Input
                          id="bonus-type"
                          placeholder="e.g., Annual Bonus"
                          value={bonusInput.bonusType}
                          onChange={(e) =>
                            setBonusInput({
                              ...bonusInput,
                              bonusType: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bonus-percentage">
                          Bonus % of Salary
                        </Label>
                        <Input
                          id="bonus-percentage"
                          type="number"
                          placeholder="10"
                          value={bonusInput.percentageOfSalary || ""}
                          onChange={(e) =>
                            setBonusInput({
                              ...bonusInput,
                              percentageOfSalary:
                                parseFloat(e.target.value) || 0
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bonus-expires">Expires On</Label>
                        <Input
                          id="bonus-expires"
                          type="date"
                          value={
                            bonusInput.expiresOn.toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setBonusInput({
                              ...bonusInput,
                              expiresOn: new Date(e.target.value)
                            })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddBonus}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Bonus
                    </Button>
                  </div>

                  {compensationFormData.bonuses.length > 0 && (
                    <div className="space-y-2">
                      {compensationFormData.bonuses.map((bonus, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {bonus.bonusType}
                            </p>
                            <p className="text-xs text-gray-600">
                              {bonus.percentageOfSalary}% = $
                              {bonus.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Expires:{" "}
                              {new Date(bonus.expiresOn).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBonus(idx)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deduction Section */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Deductions</h3>
                  <div className="space-y-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="deduction-type">Deduction Type</Label>
                        <Input
                          id="deduction-type"
                          placeholder="e.g., Tax"
                          value={deductionInput.deductionType}
                          onChange={(e) =>
                            setDeductionInput({
                              ...deductionInput,
                              deductionType: e.target.value
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deduction-percentage">
                          Deduction % of Salary
                        </Label>
                        <Input
                          id="deduction-percentage"
                          type="number"
                          placeholder="5"
                          value={deductionInput.percentageOfSalary || ""}
                          onChange={(e) =>
                            setDeductionInput({
                              ...deductionInput,
                              percentageOfSalary:
                                parseFloat(e.target.value) || 0
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deduction-description">Description</Label>
                      <Input
                        id="deduction-description"
                        placeholder="e.g., Income tax deduction"
                        value={deductionInput.description}
                        onChange={(e) =>
                          setDeductionInput({
                            ...deductionInput,
                            description: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deduction-expires">Expires On</Label>
                      <Input
                        id="deduction-expires"
                        type="date"
                        value={
                          deductionInput.expiresOn.toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setDeductionInput({
                            ...deductionInput,
                            expiresOn: new Date(e.target.value)
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddDeduction}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deduction
                    </Button>
                  </div>

                  {compensationFormData.deductions.length > 0 && (
                    <div className="space-y-2">
                      {compensationFormData.deductions.map((deduction, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {deduction.deductionType}
                            </p>
                            <p className="text-xs text-gray-600">
                              {deduction.description}
                            </p>
                            <p className="text-xs text-gray-600">
                              {deduction.percentageOfSalary}% = $
                              {deduction.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Expires:{" "}
                              {new Date(
                                deduction.expiresOn
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDeduction(idx)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-calculated Gross and Net Pay Display */}
                {compensationFormData.basePay > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-4 space-y-3 mt-4">
                    <p className="text-sm font-medium text-green-900">
                      Compensation Summary:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">HRA (50%)</p>
                        <p className="font-semibold">
                          ${compensationFormData.hra.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">PF (12%)</p>
                        <p className="font-semibold">
                          ${compensationFormData.pf.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gratuity (4.81%)</p>
                        <p className="font-semibold">
                          ${compensationFormData.gratuity.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Insurance (2%)</p>
                        <p className="font-semibold">
                          ${compensationFormData.insurancePremium.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Bonuses</p>
                        <p className="font-semibold text-blue-600">
                          $
                          {compensationFormData.bonuses
                            .reduce((sum, b) => sum + b.amount, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Deductions</p>
                        <p className="font-semibold text-red-600">
                          $
                          {compensationFormData.deductions
                            .reduce((sum, d) => sum + d.amount, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-1 md:col-span-2 border-t pt-3">
                        <p className="text-gray-600">Gross Pay</p>
                        <p className="font-semibold text-green-600 text-lg">
                          ${compensationFormData.grossPay.toFixed(2)}
                        </p>
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-gray-600">Net Pay</p>
                        <p className="font-semibold text-green-700 text-lg">
                          ${compensationFormData.netPay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
