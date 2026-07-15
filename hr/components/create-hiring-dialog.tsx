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
import { useOrgId, useUserId } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import {
    getAllDepartments,
    getDeptRoles,
    createHiringRequisition,
    updateHiringRequisition,
    FullRecruitmentRequisition
} from "@/lib/auth-service";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Textarea } from "./ui/textarea";

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
    location?: string;
    minYearsOfExperience?: number;
    maxYearsOfExperience?: number;
    orgName?: string;
};

export function CreateHiringDialog({
    smallButton = false,
    editData,
    onSuccess,
    open: externalOpen,
    onOpenChange: externalOnOpenChange
}: {
    smallButton?: boolean;
    editData?: FullRecruitmentRequisition;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const orgId = useOrgId();
    const empId = useUserId();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const isControlledByParent = externalOpen !== undefined;
    const dialogOpen = isControlledByParent ? externalOpen : open;

    const handleOpenChange = (newOpen: boolean) => {
        if (isControlledByParent && externalOnOpenChange) {
            externalOnOpenChange(newOpen);
        } else {
            setOpen(newOpen);
        }
    };
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    const [form, setForm] = useState<CreateHiringForm>(() => {
        if (editData) {
            return {
                title: editData.title,
                shortDescription: editData.shortDescription,
                description: editData.description,
                departmentName: editData.departmentName,
                deptId: editData.departmentId,
                roleName: editData.roleName,
                roleId: 0,
                openingTillDate: editData.openingTillDate,
                totalCompensation: editData.totalCompensation,
                hiringType:
                    (editData.hiringType as "PERMANENT" | "CONTRACT" | "INTERN" | "") ||
                    "",
                location: editData.location,
                minYearsOfExperience: editData.minYearsOfExperience,
                maxYearsOfExperience: editData.maxYearsOfExperience,
                orgName: editData.orgName
            };
        }
        return {
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
            location: "",
            minYearsOfExperience: undefined,
            maxYearsOfExperience: undefined,
            orgName: ""
        };
    });

    const [departments, setDepartments] = useState<
        Array<{ deptId: number; deptName: string }>
    >([]);
    const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);

    useEffect(() => {
        if (!dialogOpen || !orgId) return;

        const fetchDepartments = async () => {
            setIsLoadingDepartments(true);
            try {
                const parsedOrgId = parseInt(orgId);
                const deptData = await getAllDepartments(parsedOrgId);
                setDepartments(deptData || []);

                // If in edit mode and we have a deptId, fetch roles for that department
                if (editData && editData.departmentId > 0) {
                    setIsLoadingRoles(true);
                    try {
                        const roleData = await getDeptRoles(editData.departmentId);
                        setRoles(roleData || []);
                    } catch (error) {
                        console.error("Failed to load roles:", error);
                        setRoles([]);
                    } finally {
                        setIsLoadingRoles(false);
                    }
                }
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
    }, [dialogOpen, orgId, editData, toast]);

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
            !form.location ||
            !form.minYearsOfExperience ||
            !form.maxYearsOfExperience ||
            !form.orgName
        ) {
            toast({
                title: "Missing required fields",
                description:
                    "Please fill in all fields to " +
                    (editData ? "update" : "create") +
                    " a hiring requisition.",
                variant: "destructive"
            });
            return;
        }

        if (!empId || !orgId) {
            toast({
                title: "User information missing",
                description: "Unable to determine user or organization information.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: form.title,
                shortDescription: form.shortDescription,
                description: form.description,
                orgId: parseInt(orgId),
                departmentName: form.departmentName,
                departmentId: form.deptId,
                roleName: form.roleName,
                openingTillDate: form.openingTillDate,
                totalCompensation: form.totalCompensation,
                hiringType: form.hiringType as "PERMANENT" | "CONTRACT" | "INTERN",
                location: form.location,
                minYearsOfExperience: form.minYearsOfExperience,
                maxYearsOfExperience: form.maxYearsOfExperience,
                orgName: form.orgName
            };

            if (editData) {
                // Update mode
                await updateHiringRequisition(
                    editData.recruitmentId,
                    parseInt(empId),
                    payload
                );
                toast({
                    title: "Hiring requisition updated successfully",
                    description: `Requisition for ${form.title} has been updated.`
                });
            } else {
                // Create mode
                await createHiringRequisition(parseInt(empId), payload);
                toast({
                    title: "Hiring requisition created successfully",
                    description: `Requisition for ${form.title} has been created.`
                });
            }

            handleOpenChange(false);
            onSuccess?.();
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
                location: "",
                minYearsOfExperience: undefined,
                maxYearsOfExperience: undefined,
                orgName: ""
            });
        } catch (error) {
            console.error(
                (editData ? "Update" : "Create") + " hiring requisition error:",
                error
            );
            toast({
                title:
                    (editData ? "Failed to update" : "Failed to create") + " requisition",
                description:
                    error instanceof Error ? error.message : "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
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
                    <DialogTitle>
                        {editData ? "Edit Hiring Requisition" : "Create Hiring Requisition"}
                    </DialogTitle>
                    <DialogDescription>
                        {editData
                            ? "Update the job opening details"
                            : "Create a new job opening or hiring requisition"}
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
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shortDescription">Short Description *</Label>
                        <Textarea
                            id="shortDescription"
                            name="shortDescription"
                            placeholder="Brief summary of the role"
                            value={form.shortDescription}
                            onChange={handleInputChange}
                        />
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
                        <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="e.g., New York, NY"
                                value={form.location}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minYearsOfExperience">Minimum Years of Experience *</Label>
                            <Input
                                id="minYearsOfExperience"
                                name="minYearsOfExperience"
                                type="number"
                                placeholder="e.g., 3"
                                value={form.minYearsOfExperience || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxYearsOfExperience">Maximum Years of Experience *</Label>
                            <Input
                                id="maxYearsOfExperience"
                                name="maxYearsOfExperience"
                                type="number"
                                placeholder="e.g., 10"
                                value={form.maxYearsOfExperience || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="orgName">Organization Name *</Label>
                            <Input
                                id="orgName"
                                name="orgName"
                                placeholder="e.g., Tech Corp"
                                value={form.orgName}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? editData
                                    ? "Updating..."
                                    : "Creating..."
                                : editData
                                    ? "Update Requisition"
                                    : "Create Requisition"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
