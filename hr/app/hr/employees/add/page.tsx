"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Copy, Check, Upload, X, Download } from "lucide-react";
import { toast } from "sonner";
import { addUser, getAllDepartments, getDeptRoles } from "@/lib/auth-service";
import { Switch } from "@/components/ui/switch";
import { useOrgId } from "@/hooks/use-user-metadata";
import type { BankRecord, Bonus, Deduction, EmployeeRecord } from "@/types";
import { computeSalaryTotals } from "@/utils/salary-calculator";
import { BankAccountType } from "@/types/BankAccountTypes";
export default function AddEmployeePage() {
  const orgIdFromHook = useOrgId();
  const [formData, setFormData] = useState<EmployeeRecord>({
    name: "",
    email: "",
    phone: "",
    role: "",
    effectiveFrom: new Date(),
    address: "",
    notes: "",
    department: "",
    deptId: 0,
    isDeptHead: false,
    title: "",
    personalEmail: "",
    profilePhoto: "",
    remarks: "",
    orgId: 0,
    gender: "",
    age: 0,
    dateOfBirth: null,
    compensation: {
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
    }
  });
  const [bankRecord, setBankRecord] = useState<BankRecord>({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: BankAccountType.SAVINGS,
    branchAddress: "",
    panNumber: ""
  });
  const [bonus, setBonus] = useState<Bonus>({
    bonusType: "",
    amount: 0,
    percentageOfSalary: 0,
    expiresOn: new Date()
  });
  const [deduction, setDeduction] = useState<Deduction>({
    deductionType: "",
    amount: 0,
    description: "",
    percentageOfSalary: 0,
    expiresOn: new Date()
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [hrDocuments, setHrDocuments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showCompensation, setShowCompensation] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [documents, setDocuments] = useState<{
    email: string;
    userId: string;
    password: string;
    message: string;
    joiningLetter?: string;
    letterOfIntent?: string;
    compensationCard?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<
    | "email"
    | "password"
    | "userId"
    | "joiningLetter"
    | "letterOfIntent"
    | "compensationCard"
    | null
  >(null);
  const [departments, setDepartments] = useState<
    { deptId: number; deptName: string }[]
  >([]);
  const [departmentRoles, setDepartmentRoles] = useState<
    { id: number; name: string }[]
  >([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        console.log("[DEPT FETCH] orgIdFromHook:", orgIdFromHook);

        const orgId = orgIdFromHook ? parseInt(orgIdFromHook) : 0;
        console.log("[DEPT FETCH] Parsed orgId:", orgId);

        if (orgId > 0) {
          console.log("[DEPT FETCH] Fetching departments for orgId:", orgId);
          const data = await getAllDepartments(orgId);
          console.log("[DEPT FETCH] Departments received:", data);
          setDepartments(data || []);
          if (data && data.length > 0) {
            toast.success(`Loaded ${data.length} departments`);
          }
        } else {
          console.warn("[DEPT FETCH] Invalid orgId:", orgId);
          toast.warning("Organization ID not found. Please log in again.");
        }
      } catch (error) {
        console.error("[DEPT FETCH] Failed to fetch departments:", error);
        toast.error("Failed to fetch departments");
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [orgIdFromHook]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Convert age to number, keep others as strings
    const processedValue = name === "age" ? parseInt(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = async (name: string, value: string) => {
    console.log("[SELECT CHANGE] name:", name, "value:", value);

    if (name === "department") {
      const deptId = parseInt(value);
      setFormData((prev) => ({ ...prev, department: value, deptId }));

      // If department is selected, fetch roles for that department
      if (deptId > 0) {
        console.log("[DEPT SELECTED] Fetching roles for deptId:", deptId);
        setIsLoadingRoles(true);
        try {
          const roles = await getDeptRoles(deptId);
          console.log("[ROLES FETCHED] Roles received:", roles);
          setDepartmentRoles(roles || []);
        } catch (error) {
          console.error("[ROLES FETCH ERROR]", error);
          toast.error("Failed to fetch roles for this department");
          setDepartmentRoles([]);
        } finally {
          setIsLoadingRoles(false);
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const copyToClipboard = async (
    text: string,
    field:
      | "email"
      | "password"
      | "userId"
      | "joiningLetter"
      | "letterOfIntent"
      | "compensationCard"
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      const fieldNames: Record<string, string> = {
        email: "Email",
        password: "Password",
        userId: "User ID",
        joiningLetter: "Joining Letter URL",
        letterOfIntent: "Letter of Intent URL",
        compensationCard: "Compensation Card URL"
      };
      toast.success(`${fieldNames[field]} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleProfilePictureChange = (
    e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>
  ) => {
    let files: FileList | null = null;

    if ("dataTransfer" in e) {
      e.preventDefault();
      e.stopPropagation();
      files = e.dataTransfer.files;
    } else {
      files = e.target.files;
    }

    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        // Rename file to profile_pic
        const fileExtension = file.name.split(".").pop() || "jpg";
        const renamedFile = new File([file], `profile_pic.${fileExtension}`, {
          type: file.type
        });
        setProfilePicture(renamedFile);
        toast.success("Profile picture selected");
      } else {
        toast.error("Please select an image file");
      }
    }
  };

  const handleHRDocumentsDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files) {
      const newDocs = Array.from(files).filter(
        (file) =>
          file.type === "application/pdf" || file.type.startsWith("image/")
      );
      if (newDocs.length === 0) {
        toast.error("Please drop PDF or image files");
        return;
      }
      setHrDocuments((prev) => [...prev, ...newDocs]);
      toast.success(`${newDocs.length} document(s) added`);
    }
  };

  const handleHRDocumentsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newDocs = Array.from(e.target.files);
      setHrDocuments((prev) => [...prev, ...newDocs]);
      toast.success(`${newDocs.length} document(s) added`);
    }
  };

  const removeHRDocument = (index: number) => {
    setHrDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const addBankRecord = () => {
    if (
      !bankRecord.bankName ||
      !bankRecord.accountNumber ||
      !bankRecord.ifscCode
    ) {
      toast.error("Please fill all bank details");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        bankRecords: [...prev.compensation.bankRecords, bankRecord]
      }
    }));
    setBankRecord({
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      accountType: BankAccountType.SAVINGS,
      branchAddress: "",
      panNumber: ""
    });
    toast.success("Bank record added");
  };

  const removeBankRecord = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        bankRecords: prev.compensation.bankRecords.filter((_, i) => i !== index)
      }
    }));
  };

  const addBonus = () => {
    if (
      !bonus.bonusType ||
      (bonus.amount === 0 && bonus.percentageOfSalary === 0)
    ) {
      toast.error("Please fill bonus details");
      return;
    }
    setFormData((prev) => {
      const amount =
        prev.compensation.basePay * (bonus.percentageOfSalary / 100);
      const newBonus = { ...bonus, amount };
      const bonuses = [...prev.compensation.bonuses, newBonus];
      const totals = computeSalaryTotals(
        prev.compensation.basePay,
        bonuses,
        prev.compensation.deductions
      );

      return {
        ...prev,
        compensation: {
          ...prev.compensation,
          bonuses,
          ...totals
        }
      };
    });
    setBonus({
      bonusType: "",
      amount: 0,
      percentageOfSalary: 0,
      expiresOn: new Date()
    });
    toast.success("Bonus added");
  };

  const removeBonus = (index: number) => {
    setFormData((prev) => {
      const bonuses = prev.compensation.bonuses.filter((_, i) => i !== index);
      const totals = computeSalaryTotals(
        prev.compensation.basePay,
        bonuses,
        prev.compensation.deductions
      );

      return {
        ...prev,
        compensation: {
          ...prev.compensation,
          bonuses,
          ...totals
        }
      };
    });
  };

  const addDeduction = () => {
    if (
      !deduction.deductionType ||
      (deduction.amount === 0 && deduction.percentageOfSalary === 0)
    ) {
      toast.error("Please fill deduction details");
      return;
    }
    setFormData((prev) => {
      const amount =
        prev.compensation.basePay * (deduction.percentageOfSalary / 100);
      const newDeduction = { ...deduction, amount };
      const deductions = [...prev.compensation.deductions, newDeduction];
      const totals = computeSalaryTotals(
        prev.compensation.basePay,
        prev.compensation.bonuses,
        deductions
      );

      return {
        ...prev,
        compensation: {
          ...prev.compensation,
          deductions,
          ...totals
        }
      };
    });
    setDeduction({
      deductionType: "",
      amount: 0,
      description: "",
      percentageOfSalary: 0,
      expiresOn: new Date()
    });
    toast.success("Deduction added");
  };

  const removeDeduction = (index: number) => {
    setFormData((prev) => {
      const deductions = prev.compensation.deductions.filter(
        (_, i) => i !== index
      );
      const totals = computeSalaryTotals(
        prev.compensation.basePay,
        prev.compensation.bonuses,
        deductions
      );

      return {
        ...prev,
        compensation: {
          ...prev.compensation,
          deductions,
          ...totals
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Show compensation dialog instead of direct submission
    setShowCompensation(true);
  };

  const completeCompensation = async () => {
    if (formData.compensation.bankRecords.length === 0) {
      toast.error("Please add at least one bank record");
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Add user with all details and files
      const addUserResponse = await addUser(
        formData.name,
        formData.email,
        formData.phone,
        formData.effectiveFrom.toISOString().split("T")[0],
        formData.compensation.basePay,
        formData.address,
        formData.notes,
        formData.role,
        orgIdFromHook || "",
        formData.deptId,
        formData.isDeptHead,
        profilePicture || undefined,
        hrDocuments,
        formData.compensation as unknown as Record<string, unknown>,
        formData.title,
        formData.personalEmail,
        formData.remarks,
        formData.gender,
        formData.age,
        formData.dateOfBirth
      );

      // Step 2: Assign role to user
      // await createPeople(addUserResponse.userId, formData.role);

      // Store documents data and show documents dialog
      setDocuments({
        email: addUserResponse.email,
        userId: addUserResponse.userId,
        password: addUserResponse.password,
        message: addUserResponse.message,
        joiningLetter: addUserResponse.joiningLetter,
        letterOfIntent: addUserResponse.letterOfIntent,
        compensationCard: addUserResponse.compensationCard
      });

      // Close all other dialogs and open documents dialog
      setShowCompensation(false);
      setShowCredentials(false);
      setShowDocuments(true);
      toast.success("Employee added successfully!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        effectiveFrom: new Date(),
        address: "",
        notes: "",
        department: "",
        deptId: 0,
        isDeptHead: false,
        title: "",
        personalEmail: "",
        remarks: "",
        orgId: 0,
        profilePhoto: "",
        gender: "",
        age: 0,
        dateOfBirth: null,
        compensation: {
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
        }
      });
      setBonus({
        bonusType: "",
        amount: 0,
        percentageOfSalary: 0,
        expiresOn: new Date()
      });
      setDeduction({
        deductionType: "",
        amount: 0,
        description: "",
        percentageOfSalary: 0,
        expiresOn: new Date()
      });
      setProfilePicture(null);
      setHrDocuments([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add employee"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Employee</h1>
        <p className="text-gray-500 mt-2">Create a new employee profile</p>
      </div>

      <Card className="p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle>Employee Information</CardTitle>
          <CardDescription>Fill in the employee details below</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="name">Full Name *</FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="title">Job Title</FieldLabel>
                <FieldContent>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Developer"
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="department">Department</FieldLabel>
                  <FieldContent>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        handleSelectChange("department", value)
                      }
                      disabled={isLoading || isLoadingDepartments}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingDepartments
                              ? "Loading..."
                              : "Select department"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {departments &&
                          departments.length > 0 &&
                          departments.map((dept) => (
                            <SelectItem
                              key={dept.deptId}
                              value={dept.deptId.toString()}
                            >
                              {dept.deptName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                <Field className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="department-head"
                      checked={formData.isDeptHead}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          isDeptHead: checked
                        }))
                      }
                      disabled={isLoading}
                    />
                    <FieldLabel
                      htmlFor="department-head"
                      className="mb-0 cursor-pointer"
                    >
                      Department Head
                    </FieldLabel>
                  </div>
                </Field>
              </div>
              <Field className="w-full">
                <FieldLabel htmlFor="role">Role *</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                    disabled={
                      isLoading ||
                      isLoadingRoles ||
                      departmentRoles.length === 0
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingRoles
                            ? "Loading roles..."
                            : departmentRoles.length === 0
                              ? "Select department first"
                              : "Select role"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentRoles &&
                        departmentRoles.length > 0 &&
                        departmentRoles.map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.name.toString()}
                          >
                            {role.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="m@example.com"
                    required
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <FieldContent>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="7891040789"
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="effectiveFrom">Effective From</FieldLabel>
                <FieldContent>
                  <Input
                    id="effectiveFrom"
                    name="effectiveFrom"
                    type="date"
                    value={
                      formData.effectiveFrom instanceof Date
                        ? formData.effectiveFrom.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const dateString = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        effectiveFrom: new Date(dateString)
                      }));
                    }}
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <FieldContent>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="City, State, Postal Code"
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <FieldContent>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the employee"
                  rows={4}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="personalEmail">Personal Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="personalEmail"
                    name="personalEmail"
                    type="email"
                    value={formData.personalEmail}
                    onChange={handleInputChange}
                    placeholder="personal@example.com"
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
                <FieldContent>
                  <Input
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Additional remarks"
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <FieldContent>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gender: e.target.value
                      }))
                    }
                    disabled={isLoading}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="age">Age</FieldLabel>
                <FieldContent>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.age || ""}
                    onChange={handleInputChange}
                    placeholder="30"
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                <FieldContent>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={
                      formData.dateOfBirth instanceof Date
                        ? formData.dateOfBirth.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: dateValue ? new Date(dateValue) : null
                      }));
                    }}
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
            </div>

            {/* Profile Picture Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <FieldLabel className="mb-2">Profile Picture</FieldLabel>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleProfilePictureChange}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
              >
                {profilePicture ? (
                  <div className="space-y-2">
                    <p className="font-medium text-green-600">
                      ✓ {profilePicture.name}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProfilePicture(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your profile picture here, or click to
                      select
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="profilePicture"
                    />
                    <label htmlFor="profilePicture">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Choose Image</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* HR Documents Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <FieldLabel className="mb-2">HR Documents</FieldLabel>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleHRDocumentsDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop HR documents (PDF, images), or click to select
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleHRDocumentsSelect}
                  className="hidden"
                  id="hrDocuments"
                />
                <label htmlFor="hrDocuments">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Choose Files</span>
                  </Button>
                </label>
              </div>
              {hrDocuments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {hrDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm text-gray-600 truncate">
                        {doc.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHRDocument(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? "Adding Employee..." : "Add Employee"}
              </Button>
              <Button
                type="reset"
                variant="outline"
                size="lg"
                disabled={isLoading}
              >
                Clear Form
              </Button>
            </div>

            <Dialog open={showCompensation} onOpenChange={setShowCompensation}>
              <DialogContent className="p-0 max-w-3xl">
                <DialogHeader className="px-4 pt-4">
                  <DialogTitle>Compensation & Bank Details</DialogTitle>
                  <DialogDescription>
                    Add compensation structure and bank account information
                  </DialogDescription>
                </DialogHeader>

                <div className="no-scrollbar flex flex-col gap-2 max-h-[65vh] overflow-y-auto px-4">
                  {/* Compensation Details */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-lg">
                      Compensation Structure
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Base Pay *</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={formData.compensation.basePay}
                            onChange={(e) => {
                              const basePay = parseFloat(e.target.value) || 0;
                              // Recompute bonus/deduction amounts from percentages based on new basePay
                              const updatedBonuses =
                                formData.compensation.bonuses.map((b) => ({
                                  ...b,
                                  amount: basePay * (b.percentageOfSalary / 100)
                                }));
                              const updatedDeductions =
                                formData.compensation.deductions.map((d) => ({
                                  ...d,
                                  amount: basePay * (d.percentageOfSalary / 100)
                                }));
                              const totals = computeSalaryTotals(
                                basePay,
                                updatedBonuses,
                                updatedDeductions
                              );
                              setFormData((prev) => ({
                                ...prev,
                                compensation: {
                                  ...prev.compensation,
                                  basePay,
                                  ...totals,
                                  bonuses: updatedBonuses,
                                  deductions: updatedDeductions
                                }
                              }));
                            }}
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Annual Package</FieldLabel>
                        <FieldContent>
                          <Input
                            value={formData.compensation.annualPackage}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                compensation: {
                                  ...prev.compensation,
                                  annualPackage: e.target.value
                                }
                              }))
                            }
                            placeholder="e.g., 12 LPA"
                          />
                        </FieldContent>
                      </Field>
                    </div>

                    {/* Auto-calculated fields display */}
                    {formData.compensation.basePay > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
                        <p className="text-sm font-medium text-blue-900">
                          Auto-Calculated Components (from base pay):
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">HRA (50%)</p>
                            <p className="font-semibold">
                              ${formData.compensation.hra.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">PF (12%)</p>
                            <p className="font-semibold">
                              ${formData.compensation.pf.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Gratuity (4.81%)</p>
                            <p className="font-semibold">
                              ${formData.compensation.gratuity.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Insurance (2%)</p>
                            <p className="font-semibold">
                              $
                              {formData.compensation.insurancePremium.toFixed(
                                2
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bonuses */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Bonuses</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Bonus Type</FieldLabel>
                          <FieldContent>
                            <Input
                              value={bonus.bonusType}
                              onChange={(e) =>
                                setBonus((prev) => ({
                                  ...prev,
                                  bonusType: e.target.value
                                }))
                              }
                              placeholder="e.g., Travel Allowance"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Percentage of Salary</FieldLabel>
                          <FieldContent>
                            <Input
                              type="number"
                              value={bonus.percentageOfSalary}
                              onChange={(e) =>
                                setBonus((prev) => ({
                                  ...prev,
                                  percentageOfSalary:
                                    parseFloat(e.target.value) || 0
                                }))
                              }
                              placeholder="0"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Expires On</FieldLabel>
                          <FieldContent>
                            <Input
                              type="date"
                              value={
                                bonus.expiresOn instanceof Date
                                  ? bonus.expiresOn.toISOString().split("T")[0]
                                  : bonus.expiresOn || ""
                              }
                              onChange={(e) => {
                                const date = e.target.value
                                  ? new Date(e.target.value)
                                  : new Date();
                                setBonus((prev) => ({
                                  ...prev,
                                  expiresOn: date
                                }));
                              }}
                            />
                          </FieldContent>
                        </Field>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addBonus}
                        className="w-full"
                      >
                        Add Bonus
                      </Button>
                    </div>
                    {formData.compensation.bonuses.length > 0 && (
                      <div className="space-y-2">
                        {formData.compensation.bonuses.map((b, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {b.bonusType} - ${b.amount}
                              </p>
                              <p className="text-xs text-gray-500">
                                {b.percentageOfSalary}% of salary
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBonus(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Deductions */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Deductions</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Deduction Type</FieldLabel>
                          <FieldContent>
                            <Input
                              value={deduction.deductionType}
                              onChange={(e) =>
                                setDeduction((prev) => ({
                                  ...prev,
                                  deductionType: e.target.value
                                }))
                              }
                              placeholder="e.g., Provident Fund"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Description</FieldLabel>
                          <FieldContent>
                            <Input
                              value={deduction.description}
                              onChange={(e) =>
                                setDeduction((prev) => ({
                                  ...prev,
                                  description: e.target.value
                                }))
                              }
                              placeholder="Deduction description"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Percentage of Salary</FieldLabel>
                          <FieldContent>
                            <Input
                              type="number"
                              value={deduction.percentageOfSalary}
                              onChange={(e) =>
                                setDeduction((prev) => ({
                                  ...prev,
                                  percentageOfSalary:
                                    parseFloat(e.target.value) || 0
                                }))
                              }
                              placeholder="0"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Expires On</FieldLabel>
                          <FieldContent>
                            <Input
                              type="date"
                              value={
                                deduction.expiresOn instanceof Date
                                  ? deduction.expiresOn
                                      .toISOString()
                                      .split("T")[0]
                                  : deduction.expiresOn || ""
                              }
                              onChange={(e) => {
                                const date = e.target.value
                                  ? new Date(e.target.value)
                                  : new Date();
                                setDeduction((prev) => ({
                                  ...prev,
                                  expiresOn: date
                                }));
                              }}
                            />
                          </FieldContent>
                        </Field>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addDeduction}
                        className="w-full"
                      >
                        Add Deduction
                      </Button>
                    </div>
                    {formData.compensation.deductions.length > 0 && (
                      <div className="space-y-2">
                        {formData.compensation.deductions.map((d, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded space-y-1"
                          >
                            <p className="font-medium text-sm">
                              {d.deductionType} - ${d.amount}
                            </p>
                            <p className="text-xs text-gray-500">
                              {d.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {d.percentageOfSalary}% of salary
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDeduction(index)}
                              className="mt-2"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pay Summary */}
                  {formData.compensation.basePay > 0 && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-lg">Pay Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Gross Pay</p>
                          <p className="font-semibold text-green-600">
                            ${formData.compensation.grossPay.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Net Pay</p>
                          <p className="font-semibold text-green-700">
                            ${formData.compensation.netPay.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Details */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Bank Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Bank Name *</FieldLabel>
                          <FieldContent>
                            <Input
                              value={bankRecord.bankName}
                              onChange={(e) =>
                                setBankRecord((prev) => ({
                                  ...prev,
                                  bankName: e.target.value
                                }))
                              }
                              placeholder="e.g., State Bank of India"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Account Holder Name</FieldLabel>
                          <FieldContent>
                            <Input
                              value={bankRecord.accountHolderName}
                              onChange={(e) =>
                                setBankRecord((prev) => ({
                                  ...prev,
                                  accountHolderName: e.target.value
                                }))
                              }
                              placeholder={formData.name}
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Account Number *</FieldLabel>
                          <FieldContent>
                            <Input
                              value={bankRecord.accountNumber}
                              onChange={(e) =>
                                setBankRecord((prev) => ({
                                  ...prev,
                                  accountNumber: e.target.value
                                }))
                              }
                              placeholder="123456789012"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>IFSC Code *</FieldLabel>
                          <FieldContent>
                            <Input
                              value={bankRecord.ifscCode}
                              onChange={(e) =>
                                setBankRecord((prev) => ({
                                  ...prev,
                                  ifscCode: e.target.value.toUpperCase()
                                }))
                              }
                              placeholder="SBIN1234"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Account Type</FieldLabel>
                          <FieldContent>
                            <Select
                              value={bankRecord.accountType}
                              onValueChange={(value) =>
                                setBankRecord((prev) => ({
                                  ...prev,
                                  accountType: value as BankAccountType
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SAVINGS">Savings</SelectItem>
                                <SelectItem value="CURRENT">Current</SelectItem>
                              </SelectContent>
                            </Select>
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>Branch Address</FieldLabel>
                          <FieldContent>
                            <Input
                              value={bankRecord.branchAddress}
                              onChange={(e) =>
                                setBankRecord((prev) => ({
                                  ...prev,
                                  branchAddress: e.target.value
                                }))
                              }
                              placeholder="Bengalore, main road"
                            />
                          </FieldContent>
                        </Field>
                        <Field>
                          <FieldLabel>PAN Number</FieldLabel>
                          <FieldContent>
                            <Input
                              value={bankRecord.panNumber}
                              onChange={(e) =>
                                setBankRecord((prev) => ({
                                  ...prev,
                                  panNumber: e.target.value
                                }))
                              }
                              placeholder="ABCDE1234F"
                            />
                          </FieldContent>
                        </Field>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addBankRecord}
                        className="w-full"
                      >
                        Add Bank Record
                      </Button>
                    </div>
                    {formData.compensation.bankRecords.length > 0 && (
                      <div className="space-y-2">
                        {formData.compensation.bankRecords.map(
                          (record, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded space-y-1"
                            >
                              <p className="font-medium text-sm">
                                {record.bankName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Account: {record.accountNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                IFSC: {record.ifscCode}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBankRecord(index)}
                                className="mt-2"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="bg-muted p-4">
                  <div className="flex gap-4">
                    <Button
                      className="w-full flex-1"
                      type="button"
                      variant="outline"
                      onClick={() => setShowCompensation(false)}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={completeCompensation}
                      disabled={isLoading}
                      className="flex-1 w-full"
                    >
                      {isLoading ? "Creating Employee..." : "Create Employee"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Employee Credentials</DialogTitle>
                  <DialogDescription>
                    Please save these credentials securely. The password cannot
                    be retrieved later.
                  </DialogDescription>
                </DialogHeader>
                {credentials && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={credentials.email}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(credentials.email, "email")
                          }
                        >
                          {copiedField === "email" ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={credentials.password}
                          readOnly
                          type="password"
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(credentials.password, "password")
                          }
                        >
                          {copiedField === "password" ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setShowCredentials(false)}
                >
                  Done
                </Button>
              </DialogContent>
            </Dialog>

            <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
              <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle>Employee Credentials & Documents</DialogTitle>
                  <DialogDescription>
                    Save these credentials securely. Please share with the new
                    employee.
                  </DialogDescription>
                </DialogHeader>
                {documents && (
                  <div className="space-y-6">
                    {/* Credentials Section */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold text-sm text-blue-900">
                        Login Credentials
                      </h4>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          User ID
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={documents.userId || ""}
                            readOnly
                            className="flex-1 bg-white"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(documents.userId || "", "userId")
                            }
                            title="Copy User ID"
                          >
                            {copiedField === "userId" ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={documents.email || ""}
                            readOnly
                            className="flex-1 bg-white"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(documents.email || "", "email")
                            }
                            title="Copy Email"
                          >
                            {copiedField === "email" ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={documents.password || ""}
                            readOnly
                            type="password"
                            className="flex-1 bg-white"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(
                                documents.password || "",
                                "password"
                              )
                            }
                            title="Copy Password"
                          >
                            {copiedField === "password" ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {documents.message && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Status:</strong> {documents.message}
                        </p>
                      </div>
                    )}

                    {/* Documents Section */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-900">
                        Generated Documents
                      </h4>

                      {documents.joiningLetter && (
                        <div className="border rounded-lg p-4 space-y-3">
                          <h5 className="font-medium text-sm">
                            Joining Letter
                          </h5>
                          <div className="flex items-center gap-2">
                            <Input
                              value={documents.joiningLetter}
                              readOnly
                              className="flex-1 text-xs bg-gray-50"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                copyToClipboard(
                                  documents.joiningLetter || "",
                                  "joiningLetter"
                                )
                              }
                              title="Copy URL"
                            >
                              {copiedField === "joiningLetter" ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <a
                            href={documents.joiningLetter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      )}

                      {documents.letterOfIntent && (
                        <div className="border rounded-lg p-4 space-y-3">
                          <h5 className="font-medium text-sm">
                            Letter of Intent
                          </h5>
                          <div className="flex items-center gap-2">
                            <Input
                              value={documents.letterOfIntent}
                              readOnly
                              className="flex-1 text-xs bg-gray-50"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                copyToClipboard(
                                  documents.letterOfIntent || "",
                                  "letterOfIntent"
                                )
                              }
                              title="Copy URL"
                            >
                              {copiedField === "letterOfIntent" ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <a
                            href={documents.letterOfIntent}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      )}

                      {documents.compensationCard && (
                        <div className="border rounded-lg p-4 space-y-3">
                          <h5 className="font-medium text-sm">
                            Compensation Card
                          </h5>
                          <div className="flex items-center gap-2">
                            <Input
                              value={documents.compensationCard}
                              readOnly
                              className="flex-1 text-xs bg-gray-50"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                copyToClipboard(
                                  documents.compensationCard || "",
                                  "compensationCard"
                                )
                              }
                              title="Copy URL"
                            >
                              {copiedField === "compensationCard" ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <a
                            href={documents.compensationCard}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  className="w-full mt-4"
                  onClick={() => setShowDocuments(false)}
                >
                  Close
                </Button>
              </DialogContent>
            </Dialog>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
