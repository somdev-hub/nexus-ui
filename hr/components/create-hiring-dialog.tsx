"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import { getAllDepartments, getDeptRoles } from "@/lib/auth-service";
import { RichTextEditor } from "@/components/rich-text-editor";

type CreateHiringForm = {
  title: string;
  shortDescription: string;
  description: string;
  departmentName: string;
  deptId: number;
  roleName: string;
  roleId: number;
  openingTillDate: string;
  totalCompensation: string;
  hiringType: "PERMANENT" | "CONTRACT" | "INTERN" | "";
  hiringStatus: "OPEN" | "CLOSED" | "ON_HOLD" | "HIRED" | "";
};

export function CreateHiringDialog({
  smallButton = false
}: {
  smallButton?: boolean;
}) {
  const orgId = useOrgId();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [form, setForm] = useState<CreateHiringForm>({
    title: "",
    shortDescription: "",
    description: "",
    departmentName: "",
    deptId: 0,
    roleName: "",
    roleId: 0,
    openingTillDate: "",
    totalCompensation: "",
    hiringType: "",
    hiringStatus: ""
  });

  const [departments, setDepartments] = useState<
    Array<{ deptId: number; deptName: string }>
  >([]);
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (!open || !orgId) return;

    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const parsedOrgId = parseInt(orgId);
        const deptData = await getAllDepartments(parsedOrgId);
        setDepartments(deptData || []);
      } catch (error) {
        toast({
          title: "Failed to load departments",
          description:
            error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive"
        });
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [open, orgId, toast]);

  const handleDepartmentChange = async (deptId: string) => {
    const selectedDept = departments.find((d) => d.deptId === parseInt(deptId));

    setForm((prev) => ({
      ...prev,
      departmentName: selectedDept?.deptName || "",
      deptId: parseInt(deptId),
      roleName: "",
      roleId: 0
    }));

    if (parseInt(deptId) > 0) {
      setIsLoadingRoles(true);
      try {
        const roleData = await getDeptRoles(parseInt(deptId));
        setRoles(roleData || []);
      } catch (error) {
        toast({
          title: "Failed to load roles",
          description:
            error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive"
        });
        setRoles([]);
      } finally {
        setIsLoadingRoles(false);
      }
    } else {
      setRoles([]);
    }
  };

  const handleRoleChange = (roleId: string) => {
    const selectedRole = roles.find((r) => r.id === parseInt(roleId));

    setForm((prev) => ({
      ...prev,
      roleName: selectedRole?.name || "",
      roleId: parseInt(roleId)
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.title ||
      !form.shortDescription ||
      !form.description ||
      !form.departmentName ||
      !form.roleName ||
      !form.openingTillDate ||
      !form.totalCompensation ||
      !form.hiringType ||
      !form.hiringStatus
    ) {
      toast({
        title: "Missing required fields",
        description:
          "Please fill in all fields to create a hiring requisition.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call API to create hiring requisition
      toast({
        title: "Hiring requisition created",
        description: `Created requisition for ${form.title}`
      });
      setOpen(false);
      setForm({
        title: "",
        shortDescription: "",
        description: "",
        departmentName: "",
        deptId: 0,
        roleName: "",
        roleId: 0,
        openingTillDate: "",
        totalCompensation: "",
        hiringType: "",
        hiringStatus: ""
      });
    } catch (error) {
      toast({
        title: "Failed to create requisition",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {smallButton ? (
          <Button size="sm" className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Create Hiring
          </Button>
        ) : (
          <Card className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              <p className="font-medium">Create Hiring</p>
            </CardContent>
          </Card>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Create Hiring Requisition</DialogTitle>
          <DialogDescription>
            Create a new job opening or hiring requisition
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Senior Frontend Engineer"
                value={form.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description *</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                placeholder="Brief summary of the role"
                value={form.shortDescription}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <RichTextEditor
              value={form.description}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, description: value }))
              }
              placeholder="Enter detailed job description with formatting..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={form.deptId.toString()}
                onValueChange={handleDepartmentChange}
                disabled={isLoadingDepartments}
              >
                <SelectTrigger id="department" className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingDepartments
                        ? "Loading departments..."
                        : "Select a department"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept.deptId}
                      value={dept.deptId.toString()}
                    >
                      {dept.deptName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={form.roleId.toString()}
                onValueChange={handleRoleChange}
                disabled={isLoadingRoles || !form.deptId}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue
                    placeholder={
                      !form.deptId
                        ? "Select a department first"
                        : isLoadingRoles
                          ? "Loading roles..."
                          : "Select a role"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openingTillDate">Opening Till Date *</Label>
              <Input
                id="openingTillDate"
                name="openingTillDate"
                type="date"
                value={form.openingTillDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCompensation">Total Compensation *</Label>
              <Input
                id="totalCompensation"
                name="totalCompensation"
                type="number"
                placeholder="Annual salary"
                value={form.totalCompensation}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hiringType">Hiring Type *</Label>
              <Select
                value={form.hiringType}
                onValueChange={(value) =>
                  handleSelectChange("hiringType", value)
                }
              >
                <SelectTrigger id="hiringType" className="w-full">
                  <SelectValue placeholder="Select hiring type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hiringStatus">Hiring Status *</Label>
              <Select
                value={form.hiringStatus}
                onValueChange={(value) =>
                  handleSelectChange("hiringStatus", value)
                }
              >
                <SelectTrigger id="hiringStatus" className="w-full">
                  <SelectValue placeholder="Select hiring status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="HIRED">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Requisition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
