"use client";

import { useState, useEffect } from "react";
import { useOrgId } from "@/hooks/use-user-metadata";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, Briefcase } from "lucide-react";
import { departmentsData, rolesData } from "./data";
import type {
  Department,
  RoleRecord,
  RoleCompensation,
  GrantPermission
} from "@/types";
import { ResourceType } from "@/types/ResourceTypes";
import { PermissionAction } from "@/types/PermissionAction";
import {
  grantPermission,
  createDepartment,
  createRole,
  addRoleCompensation,
  getDeptOverview,
  getAllDeptOverview,
  getDeptRoles,
  fetchDeptRolesTable,
  fetchRoleCompensation
} from "@/lib/auth-service";

export default function OrganizationPage() {
  // Get organization ID from user metadata
  const userOrgId = useOrgId();

  const [departments, setDepartments] = useState<Department[]>(departmentsData);
  const [roles, setRoles] = useState<RoleRecord[]>(rolesData);
  const [compensations, setCompensations] = useState<RoleCompensation[]>([]);
  const [deptRoles, setDeptRoles] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [compensationDeptRoles, setCompensationDeptRoles] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // Dialog states
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [showAddCompensationDialog, setShowAddCompensationDialog] =
    useState(false);
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [showGrantPermissionDialog, setShowGrantPermissionDialog] =
    useState(false);

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
  const [compensationFormData, setCompensationFormData] =
    useState<RoleCompensation>({
      orgId: 0, // Will be set from userOrgId when submitting
      role: "",
      deptId: 0,
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

  // Grant Permission form state
  const [grantPermissionFormData, setGrantPermissionFormData] =
    useState<GrantPermission>({
      resourceName: "",
      description: "",
      resourceType: ResourceType.DOCUMENT,
      role: "",
      actions: [PermissionAction.READ],
      departmentId: 0
    });

  const [grantPermissionExtraFields, setGrantPermissionExtraFields] = useState({
    endpoint: "",
    featureId: ""
  });

  // Overview data state
  const [overviewData, setOverviewData] = useState({
    totalDepartments: 0,
    totalEmployees: 0,
    totalRoles: 0,
    totalPermissions: 0
  });

  // Pagination states
  const [rolesCurrentPage, setRolesCurrentPage] = useState(1);
  const [compensationCurrentPage, setCompensationCurrentPage] = useState(1);
  const [compensationTotalPages, setCompensationTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch department overview
  useEffect(() => {
    if (!userOrgId) return;

    const fetchDepartments = async () => {
      try {
        const orgId = parseInt(userOrgId);
        const data = await getDeptOverview(orgId);
        console.log(data);

        if (data) {
          setDepartments(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Failed to fetch departments");
      }
    };

    const fetchOverviewData = async () => {
      try {
        const orgId = parseInt(userOrgId);
        const overview = await getAllDeptOverview(orgId);
        if (overview) {
          setOverviewData(overview);
        }
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
      }
    };

    fetchDepartments();
    fetchOverviewData();
  }, [userOrgId]);

  // Fetch roles for selected department in grant permission dialog
  useEffect(() => {
    if (grantPermissionFormData.departmentId === 0) {
      return;
    }

    const fetchRoles = async () => {
      try {
        const rolesData = await getDeptRoles(
          grantPermissionFormData.departmentId
        );
        if (rolesData) {
          setDeptRoles(rolesData);
        }
      } catch (error) {
        console.error("Failed to fetch department roles:", error);
        toast.error("Failed to fetch department roles");
      }
    };

    fetchRoles();

    return () => {
      setDeptRoles([]);
    };
  }, [grantPermissionFormData.departmentId]);

  // Fetch roles for selected department in compensation dialog
  useEffect(() => {
    if (compensationFormData.deptId === 0) {
      return;
    }

    const fetchRoles = async () => {
      try {
        const rolesData = await getDeptRoles(compensationFormData.deptId || 0);
        if (rolesData) {
          setCompensationDeptRoles(rolesData);
        }
      } catch (error) {
        console.error("Failed to fetch department roles:", error);
        toast.error("Failed to fetch department roles");
      }
    };

    fetchRoles();

    return () => {
      setCompensationDeptRoles([]);
    };
  }, [compensationFormData.deptId]);

  // Fetch roles table data
  useEffect(() => {
    if (!userOrgId) return;

    const fetchRolesTable = async () => {
      try {
        const orgId = parseInt(userOrgId);
        const rolesTableData = await fetchDeptRolesTable(orgId, 0, 10);

        if (rolesTableData) {
          const formattedRoles: RoleRecord[] = rolesTableData.map((role) => ({
            id: role.role,
            department: role.departmentName,
            role: role.role,
            employeeCount: role.noOfEmployees,
            createdOn: role.createdOn,
            permissions: role.permissions,
            status: (role.status === "Active" ? "Active" : "Inactive") as
              | "Active"
              | "Inactive"
          }));
          setRoles(formattedRoles);
        }
      } catch (error) {
        console.error("Failed to fetch roles table:", error);
        toast.error("Failed to fetch roles table");
      }
    };

    fetchRolesTable();
  }, [userOrgId]);

  // Fetch compensation data with pagination
  useEffect(() => {
    if (!userOrgId) return;

    const fetchCompensationData = async () => {
      try {
        const orgId = parseInt(userOrgId);
        const pageNo = compensationCurrentPage - 1;
        const data = await fetchRoleCompensation(orgId, pageNo, 10);

        if (data) {
          setCompensations(data.content);
          setCompensationTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch role compensation:", error);
        toast.error("Failed to fetch role compensation");
      }
    };

    fetchCompensationData();
  }, [userOrgId, compensationCurrentPage]);

  // Calculate total employees
  const totalEmployees = departments.reduce(
    (sum, dept) => sum + dept.members,
    0
  );

  // Calculate pagination for roles
  const rolesStartIndex = (rolesCurrentPage - 1) * itemsPerPage;
  const rolesEndIndex = rolesStartIndex + itemsPerPage;
  const rolesPaginatedData = roles.slice(rolesStartIndex, rolesEndIndex);
  const rolesTotalPages = Math.ceil(roles.length / itemsPerPage);

  // Handle add department
  const handleAddDepartment = async () => {
    if (!departmentFormData.name.trim()) {
      toast.error("Please enter a department name");
      return;
    }

    try {
      const orgId = userOrgId ? parseInt(userOrgId) : 1;
      const response = await createDepartment(orgId, departmentFormData.name);

      // Check if departmentId is present and status indicates success
      if (response.departmentId) {
        const newDepartment: Department = {
          departmentId: response.departmentId.toString(),
          departmentName: response.departmentName,
          members: response.members.length,
          roles: response.roles.length,
          departmentHead: "TBD"
        };
        setDepartments([...departments, newDepartment]);
        toast.success("Department created successfully");
        setDepartmentFormData({ name: "" });
        setShowAddDepartmentDialog(false);
      } else {
        toast.error("Failed to create department: No department ID returned");
      }
    } catch (error: unknown) {
      toast.error(`Failed to create department: ${(error as Error).message}`);
    }
  };

  // Handle add role
  const handleAddRole = async () => {
    if (!roleFormData.department || !roleFormData.role) {
      toast.error("Please fill in all required fields (Department and Role)");
      return;
    }

    try {
      // Find department ID based on department name
      const department = departments.find(
        (dept) => dept.departmentName === roleFormData.department
      );

      if (!department) {
        toast.error("Invalid department selected");
        return;
      }

      const deptId = parseInt(department.departmentId);

      const response = await createRole(roleFormData.role, deptId);

      // Check if response status is 200 (OK) or 201 (CREATED)
      if (response.status === 200 || response.status === 201) {
        const newRole: RoleRecord = {
          id: response.data.roleId || `ROLE${roles.length + 1}`,
          department: roleFormData.department,
          role: roleFormData.role,
          employeeCount: 0,
          description: roleFormData.description,
          permissions: roleFormData.permissions,
          status: "Active"
        };

        setRoles([...roles, newRole]);

        // Show different message based on status code
        if (response.status === 201) {
          toast.success("New role created and assigned to department");
        } else {
          toast.success("Role already existed and assigned to department");
        }

        setRoleFormData({
          department: "",
          role: "",
          description: "",
          permissions: []
        });
        setShowAddRoleDialog(false);
      } else {
        toast.error("Failed to create role: Invalid response status");
      }
    } catch (error: unknown) {
      toast.error(`Failed to create role: ${(error as Error).message}`);
    }
  };

  const handleAddCompensation = async () => {
    if (
      !compensationFormData.role ||
      !compensationFormData.deptId ||
      compensationFormData.minBasePay === 0 ||
      compensationFormData.maxBasePay === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Ensure orgId is set from current user's organization
    if (!userOrgId) {
      toast.error("Organization information not available");
      return;
    }

    try {
      const submissionData: RoleCompensation = {
        ...compensationFormData,
        orgId: parseInt(userOrgId)
      };
      const response = await addRoleCompensation(submissionData);

      if (response) {
        toast.success("Role compensation details added successfully");

        // Reset form and pagination to fetch fresh data
        setCompensationFormData({
          orgId: 0, // Will be set from userOrgId when submitting
          role: "",
          deptId: 0,
          minBasePay: 0,
          maxBasePay: 0,
          minTotalBonuses: 0,
          maxTotalBonuses: 0,
          minTotalDeductions: 0,
          maxTotalDeductions: 0,
          minAnnualSalary: "",
          maxAnnualSalary: ""
        });
        setCompensationDeptRoles([]);
        setCompensationCurrentPage(1);
        setShowAddCompensationDialog(false);
      } else {
        toast.error("Failed to add role compensation: No response from server");
      }
    } catch (error: unknown) {
      toast.error(
        `Failed to add role compensation: ${(error as Error).message}`
      );
    }
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

  // Handle add grant permission
  const handleAddGrantPermission = async () => {
    if (
      !grantPermissionFormData.resourceName ||
      !grantPermissionFormData.description ||
      !grantPermissionFormData.role ||
      grantPermissionFormData.departmentId === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const isModuleType =
      grantPermissionFormData.resourceType === ResourceType.MODULE ||
      grantPermissionFormData.resourceType === ResourceType.API_ENDPOINT ||
      grantPermissionFormData.resourceType === ResourceType.UI_COMPONENT;
    const isFeatureType =
      grantPermissionFormData.resourceType === ResourceType.FEATURE;

    if (isModuleType && !grantPermissionExtraFields.endpoint) {
      toast.error("Please fill in the endpoint field");
      return;
    }

    if (isFeatureType && !grantPermissionExtraFields.featureId) {
      toast.error("Please fill in the feature ID field");
      return;
    }

    try {
      // Build the permission data including optional fields
      const permissionData: GrantPermission = {
        ...grantPermissionFormData,
        resourceUrl: isModuleType
          ? grantPermissionExtraFields.endpoint
          : undefined,
        featureId: isFeatureType
          ? grantPermissionExtraFields.featureId
          : undefined
      };

      const response = await grantPermission(permissionData);

      // Check if permissionId is present in response
      if (response.permissionId) {
        toast.success("Permission granted successfully");
        setGrantPermissionFormData({
          resourceName: "",
          description: "",
          resourceType: ResourceType.DOCUMENT,
          role: "",
          actions: [PermissionAction.READ],
          departmentId: 0
        });
        setGrantPermissionExtraFields({
          endpoint: "",
          featureId: ""
        });
        setShowGrantPermissionDialog(false);
      } else {
        toast.error("Failed to grant permission: No permission ID returned");
      }
    } catch (error: unknown) {
      toast.error(`Failed to grant permission: ${(error as Error).message}`);
    }
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
      accessorKey: "createdOn",
      header: "Created On"
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
      accessorKey: "deptId",
      header: "Department ID"
    },
    {
      accessorKey: "minBasePay",
      header: "Min Base Pay",
      cell: (row: RoleCompensation) =>
        `₹${(row.minBasePay || 0).toLocaleString()}`
    },
    {
      accessorKey: "maxBasePay",
      header: "Max Base Pay",
      cell: (row: RoleCompensation) =>
        `₹${(row.maxBasePay || 0).toLocaleString()}`
    },
    {
      accessorKey: "minTotalBonuses",
      header: "Min Bonuses",
      cell: (row: RoleCompensation) =>
        `₹${(row.minTotalBonuses || 0).toLocaleString()}`
    },
    {
      accessorKey: "maxTotalBonuses",
      header: "Max Bonuses",
      cell: (row: RoleCompensation) =>
        `₹${(row.maxTotalBonuses || 0).toLocaleString()}`
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
              <p className="text-3xl font-bold">
                {overviewData.totalDepartments}
              </p>
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
              <p className="text-3xl font-bold">
                {overviewData.totalEmployees}
              </p>
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
              <p className="text-3xl font-bold">{overviewData.totalRoles}</p>
              <Briefcase className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">
                {overviewData.totalPermissions}
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
            <Card key={dept.departmentId} className="p-4 gap-2">
              <CardHeader className="p-0">
                <CardTitle className="text-lg">{dept.departmentName}</CardTitle>
                <CardDescription>
                  Head: {dept.departmentHead ? dept.departmentHead : "TBA"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Employees
                  </span>
                  <Badge>{dept.members}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Roles</span>
                  <Badge>{dept.roles}</Badge>
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
          <div className="flex gap-2">
            <Dialog
              open={showAddRoleDialog}
              onOpenChange={setShowAddRoleDialog}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Role</DialogTitle>
                  <DialogDescription>
                    Create a new role and assign to a department
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                      <SelectTrigger id="role-department" className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem
                            key={dept.departmentId}
                            value={dept.departmentName}
                          >
                            {dept.departmentName}
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
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddRole();
                        }
                      }}
                    />
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
            <Dialog
              open={showGrantPermissionDialog}
              onOpenChange={setShowGrantPermissionDialog}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Grant Permission
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle>Grant Permission</DialogTitle>
                  <DialogDescription>
                    Grant permissions to roles for specific resources and
                    actions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grant-department">Department *</Label>
                      <Select
                        value={grantPermissionFormData.departmentId.toString()}
                        onValueChange={(value) =>
                          setGrantPermissionFormData({
                            ...grantPermissionFormData,
                            departmentId: parseInt(value)
                          })
                        }
                      >
                        <SelectTrigger id="grant-department" className="w-full">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept, idx) => (
                            <SelectItem
                              key={dept.departmentId}
                              value={dept.departmentId}
                            >
                              {dept.departmentName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grant-role">Role *</Label>
                      <Select
                        value={grantPermissionFormData.role}
                        onValueChange={(value) =>
                          setGrantPermissionFormData({
                            ...grantPermissionFormData,
                            role: value
                          })
                        }
                        disabled={grantPermissionFormData.departmentId === 0}
                      >
                        <SelectTrigger id="grant-role" className="w-full">
                          <SelectValue
                            placeholder={
                              grantPermissionFormData.departmentId === 0
                                ? "Select department first"
                                : "Select role"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {deptRoles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grant-resource-type">
                        Resource Type *
                      </Label>
                      <Select
                        value={grantPermissionFormData.resourceType}
                        onValueChange={(value) =>
                          setGrantPermissionFormData({
                            ...grantPermissionFormData,
                            resourceType: value as ResourceType
                          })
                        }
                      >
                        <SelectTrigger
                          id="grant-resource-type"
                          className="w-full"
                        >
                          <SelectValue placeholder="Select resource type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ResourceType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grant-action">Actions *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="grant-action"
                            variant="outline"
                            className="w-full justify-start text-left"
                          >
                            {grantPermissionFormData.actions.length > 0
                              ? `${grantPermissionFormData.actions.length} action(s) selected`
                              : "Select actions"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-4">
                          <div className="space-y-3">
                            {Object.values(PermissionAction).map((action) => (
                              <div
                                key={action}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`action-${action}`}
                                  checked={grantPermissionFormData.actions.includes(
                                    action
                                  )}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setGrantPermissionFormData({
                                        ...grantPermissionFormData,
                                        actions: [
                                          ...grantPermissionFormData.actions,
                                          action
                                        ]
                                      });
                                    } else {
                                      setGrantPermissionFormData({
                                        ...grantPermissionFormData,
                                        actions:
                                          grantPermissionFormData.actions.filter(
                                            (a) => a !== action
                                          )
                                      });
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`action-${action}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grant-resource-name">Resource Name *</Label>
                    <Input
                      id="grant-resource-name"
                      placeholder="e.g., Employee Report"
                      value={grantPermissionFormData.resourceName}
                      onChange={(e) =>
                        setGrantPermissionFormData({
                          ...grantPermissionFormData,
                          resourceName: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grant-description">Description *</Label>
                    <Textarea
                      id="grant-description"
                      placeholder="Describe what this permission grants"
                      value={grantPermissionFormData.description}
                      onChange={(e) =>
                        setGrantPermissionFormData({
                          ...grantPermissionFormData,
                          description: e.target.value
                        })
                      }
                      rows={3}
                    />
                  </div>

                  {(grantPermissionFormData.resourceType ===
                    ResourceType.MODULE ||
                    grantPermissionFormData.resourceType ===
                      ResourceType.API_ENDPOINT ||
                    grantPermissionFormData.resourceType ===
                      ResourceType.UI_COMPONENT) && (
                    <div className="space-y-2">
                      <Label htmlFor="grant-endpoint">Endpoint *</Label>
                      <Input
                        id="grant-endpoint"
                        placeholder="e.g., /api/employees, /dashboard/reports"
                        value={grantPermissionExtraFields.endpoint}
                        onChange={(e) =>
                          setGrantPermissionExtraFields({
                            ...grantPermissionExtraFields,
                            endpoint: e.target.value
                          })
                        }
                      />
                    </div>
                  )}

                  {grantPermissionFormData.resourceType ===
                    ResourceType.FEATURE && (
                    <div className="space-y-2">
                      <Label htmlFor="grant-feature-id">Feature ID *</Label>
                      <Input
                        id="grant-feature-id"
                        placeholder="e.g., FEAT-001, FEAT-PAYROLL"
                        value={grantPermissionExtraFields.featureId}
                        onChange={(e) =>
                          setGrantPermissionExtraFields({
                            ...grantPermissionExtraFields,
                            featureId: e.target.value
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowGrantPermissionDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddGrantPermission}>
                      Grant Permission
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <HRTable columns={roleColumns} data={rolesPaginatedData} />
          {rolesTotalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setRolesCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        rolesCurrentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: rolesTotalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setRolesCurrentPage(page)}
                          isActive={rolesCurrentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setRolesCurrentPage((prev) =>
                          Math.min(prev + 1, rolesTotalPages)
                        )
                      }
                      className={
                        rolesCurrentPage === rolesTotalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
                  Define compensation range for a role
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="comp-department">Department *</Label>
                    <Select
                      value={(compensationFormData.deptId || 0).toString()}
                      onValueChange={(value) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          deptId: parseInt(value)
                        })
                      }
                    >
                      <SelectTrigger id="comp-department" className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="w-full block">
                        {departments.map((dept) => (
                          <SelectItem
                            className="w-full"
                            key={dept.departmentId}
                            value={dept.departmentId}
                          >
                            {dept.departmentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="comp-role">Role *</Label>
                    <Select
                      value={compensationFormData.role}
                      onValueChange={(value) =>
                        setCompensationFormData({
                          ...compensationFormData,
                          role: value
                        })
                      }
                      disabled={compensationFormData.deptId === 0}
                    >
                      <SelectTrigger id="comp-role" className="w-full">
                        <SelectValue
                          placeholder={
                            compensationFormData.deptId === 0
                              ? "Select department first"
                              : "Select role"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {compensationDeptRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      <Label htmlFor="min-deduction">
                        Min Total Deductions
                      </Label>
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
                      <Label htmlFor="max-deduction">
                        Max Total Deductions
                      </Label>
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
                      <Label htmlFor="min-annual-salary">
                        Min Annual Salary
                      </Label>
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
                      <Label htmlFor="max-annual-salary">
                        Max Annual Salary
                      </Label>
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
        <CardContent className="p-0 space-y-4">
          <HRTable columns={compensationColumns} data={compensations} />
          {compensationTotalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCompensationCurrentPage((prev) =>
                          Math.max(prev - 1, 1)
                        )
                      }
                      className={
                        compensationCurrentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: compensationTotalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCompensationCurrentPage(page)}
                        isActive={compensationCurrentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCompensationCurrentPage((prev) =>
                          Math.min(prev + 1, compensationTotalPages)
                        )
                      }
                      className={
                        compensationCurrentPage === compensationTotalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
