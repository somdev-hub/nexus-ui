"use client";

import { useState } from "react";
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
import { Copy, Check, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { addUser, createPeople } from "@/lib/auth-service";

interface BankRecord {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchAddress: string;
}

interface Bonus {
  bonusType: string;
  amount: number;
  percentageOfSalary: number;
  issuesOn: string;
  updatedOn: string;
  expiresOn: string;
}

interface Deduction {
  deductionType: string;
  amount: number;
  description: string;
  percentageOfSalary: number;
  issuedOn: string;
  updatedOn: string;
  expiresOn: string;
}

interface CompensationData {
  basePay: number;
  hra: number;
  gratuity: number;
  pr: number;
  netPay: number;
  annualPackage: string;
  total: number;
  netMonthlyPay: number;
  bonuses: Bonus[];
  deductions: Bonus[];
  bankRecords: BankRecord[];
}

export default function AddEmployeePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    effectiveFrom: "",
    address: "",
    notes: "",
    department: "",
    title: "",
    personalEmail: "",
    remarks: "",
    orgId: ""
  });
  const [compensation, setCompensation] = useState<CompensationData>({
    basePay: 0,
    hra: 0,
    gratuity: 0,
    pr: 0,
    netPay: 0,
    annualPackage: "",
    total: 0,
    netMonthlyPay: 0,
    bonuses: [],
    deductions: [],
    bankRecords: []
  });
  const [bankRecord, setBankRecord] = useState<BankRecord>({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "SAVINGS",
    branchAddress: ""
  });
  const [bonus, setBonus] = useState<Bonus>({
    bonusType: "",
    amount: 0,
    percentageOfSalary: 0,
    issuesOn: new Date().toISOString().split("T")[0],
    updatedOn: new Date().toISOString().split("T")[0],
    expiresOn: ""
  });
  const [deduction, setDeduction] = useState<Deduction>({
    deductionType: "",
    amount: 0,
    description: "",
    percentageOfSalary: 0,
    issuedOn: new Date().toISOString().split("T")[0],
    updatedOn: new Date().toISOString().split("T")[0],
    expiresOn: ""
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [hrDocuments, setHrDocuments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showCompensation, setShowCompensation] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(
    null
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = async (text: string, field: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field === "email" ? "Email" : "Password"} copied!`);
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
        setProfilePicture(file);
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
    setCompensation((prev) => ({
      ...prev,
      bankRecords: [...prev.bankRecords, bankRecord]
    }));
    setBankRecord({
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      accountType: "SAVINGS",
      branchAddress: ""
    });
    toast.success("Bank record added");
  };

  const removeBankRecord = (index: number) => {
    setCompensation((prev) => ({
      ...prev,
      bankRecords: prev.bankRecords.filter((_, i) => i !== index)
    }));
  };

  const addBonus = () => {
    if (!bonus.bonusType || bonus.amount === 0) {
      toast.error("Please fill bonus details");
      return;
    }
    setCompensation((prev) => ({
      ...prev,
      bonuses: [...prev.bonuses, bonus]
    }));
    setBonus({
      bonusType: "",
      amount: 0,
      percentageOfSalary: 0,
      issuesOn: new Date().toISOString().split("T")[0],
      updatedOn: new Date().toISOString().split("T")[0],
      expiresOn: ""
    });
    toast.success("Bonus added");
  };

  const removeBonus = (index: number) => {
    setCompensation((prev) => ({
      ...prev,
      bonuses: prev.bonuses.filter((_, i) => i !== index)
    }));
  };

  const addDeduction = () => {
    if (!deduction.deductionType || deduction.amount === 0) {
      toast.error("Please fill deduction details");
      return;
    }
    setCompensation((prev) => ({
      ...prev,
      deductions: [...prev.deductions, deduction]
    }));
    setDeduction({
      deductionType: "",
      amount: 0,
      description: "",
      percentageOfSalary: 0,
      issuedOn: new Date().toISOString().split("T")[0],
      updatedOn: new Date().toISOString().split("T")[0],
      expiresOn: ""
    });
    toast.success("Deduction added");
  };

  const removeDeduction = (index: number) => {
    setCompensation((prev) => ({
      ...prev,
      deductions: prev.deductions.filter((_, i) => i !== index)
    }));
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
    if (compensation.bankRecords.length === 0) {
      toast.error("Please add at least one bank record");
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Add user
      const addUserResponse = await addUser(
        formData.name,
        formData.email,
        formData.phone,
        formData.effectiveFrom,
        0,
        formData.address,
        formData.notes,
        formData.role,
        localStorage.getItem("org_id")
      );

      // Step 2: Assign role to user
      await createPeople(addUserResponse.userId, formData.role);

      // Step 3: Handle file uploads (profile picture and HR documents)
      if (profilePicture || hrDocuments.length > 0) {
        const formDataToUpload = new FormData();
        if (profilePicture) {
          formDataToUpload.append("profilePicture", profilePicture);
        }
        hrDocuments.forEach((doc, index) => {
          formDataToUpload.append(`hrDocument_${index}`, doc);
        });
        formDataToUpload.append("userId", addUserResponse.userId.toString());

        // You can send this to your backend API endpoint
        // await axios.post('/api/employee/upload', formDataToUpload);
      }

      setCredentials({
        email: addUserResponse.email,
        password: addUserResponse.password
      });
      setShowCompensation(false);
      setShowCredentials(true);
      toast.success("Employee added successfully");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        effectiveFrom: "",
        address: "",
        notes: "",
        department: "",
        title: "",
        personalEmail: "",
        remarks: "",
        orgId: ""
      });
      setCompensation({
        basePay: 0,
        hra: 0,
        gratuity: 0,
        pr: 0,
        netPay: 0,
        annualPackage: "",
        total: 0,
        netMonthlyPay: 0,
        bonuses: [],
        deductions: [],
        bankRecords: []
      });
      setBonus({
        bonusType: "",
        amount: 0,
        percentageOfSalary: 0,
        issuesOn: new Date().toISOString().split("T")[0],
        updatedOn: new Date().toISOString().split("T")[0],
        expiresOn: ""
      });
      setDeduction({
        deductionType: "",
        amount: 0,
        description: "",
        percentageOfSalary: 0,
        issuedOn: new Date().toISOString().split("T")[0],
        updatedOn: new Date().toISOString().split("T")[0],
        expiresOn: ""
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

              <Field className="w-full">
                <FieldLabel htmlFor="role">Role *</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="DIRECTOR">Director</SelectItem>
                      <SelectItem value="PRODUCT_MANAGER">
                        Product Manager
                      </SelectItem>
                      <SelectItem value="CLERK">Clerk</SelectItem>
                      <SelectItem value="ACCOUNT_MANAGER">
                        Account Manager
                      </SelectItem>
                      <SelectItem value="OPERATION_MANAGER">
                        Operation Manager
                      </SelectItem>
                      <SelectItem value="WAREHOUSE_MANAGER">
                        Warehouse Manager
                      </SelectItem>
                      <SelectItem value="FLEET_MANAGER">
                        Fleet Manager
                      </SelectItem>
                      <SelectItem value="DRIVER">Driver</SelectItem>
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
                    value={formData.effectiveFrom}
                    onChange={handleInputChange}
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
                <FieldLabel htmlFor="department">Department</FieldLabel>
                <FieldContent>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology"
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
              <DialogContent className="p-0">
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
                        <FieldLabel>Base Pay</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={compensation.basePay}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                basePay: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>HRA</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={compensation.hra}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                hra: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Gratuity</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={compensation.gratuity}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                gratuity: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>PR (Professional Requisites)</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={compensation.pr}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                pr: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Net Pay</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={compensation.netPay}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                netPay: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Net Monthly Pay</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={compensation.netMonthlyPay}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                netMonthlyPay: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Annual Package</FieldLabel>
                        <FieldContent>
                          <Input
                            value={compensation.annualPackage}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                annualPackage: e.target.value
                              }))
                            }
                            placeholder="e.g., 2.5LPA"
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Total</FieldLabel>
                        <FieldContent>
                          <Input
                            type="number"
                            value={compensation.total}
                            onChange={(e) =>
                              setCompensation((prev) => ({
                                ...prev,
                                total: parseFloat(e.target.value) || 0
                              }))
                            }
                            placeholder="0"
                          />
                        </FieldContent>
                      </Field>
                    </div>
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
                          <FieldLabel>Amount</FieldLabel>
                          <FieldContent>
                            <Input
                              type="number"
                              value={bonus.amount}
                              onChange={(e) =>
                                setBonus((prev) => ({
                                  ...prev,
                                  amount: parseFloat(e.target.value) || 0
                                }))
                              }
                              placeholder="0"
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
                              value={bonus.expiresOn}
                              onChange={(e) =>
                                setBonus((prev) => ({
                                  ...prev,
                                  expiresOn: e.target.value
                                }))
                              }
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
                    {compensation.bonuses.length > 0 && (
                      <div className="space-y-2">
                        {compensation.bonuses.map((b, index) => (
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
                          <FieldLabel>Amount</FieldLabel>
                          <FieldContent>
                            <Input
                              type="number"
                              value={deduction.amount}
                              onChange={(e) =>
                                setDeduction((prev) => ({
                                  ...prev,
                                  amount: parseFloat(e.target.value) || 0
                                }))
                              }
                              placeholder="0"
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
                              value={deduction.expiresOn}
                              onChange={(e) =>
                                setDeduction((prev) => ({
                                  ...prev,
                                  expiresOn: e.target.value
                                }))
                              }
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
                    {compensation.deductions.length > 0 && (
                      <div className="space-y-2">
                        {compensation.deductions.map((d, index) => (
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
                                  accountType: value
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
                    {compensation.bankRecords.length > 0 && (
                      <div className="space-y-2">
                        {compensation.bankRecords.map((record, index) => (
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
                        ))}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
