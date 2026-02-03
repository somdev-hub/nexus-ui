"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FieldSeparator } from "@/components/ui/field";
import type {
  PersonalData,
  BankRecord,
  CompensationData,
  Bonus,
  Deduction
} from "@/types";
import { computeSalaryTotals } from "@/utils/salary-calculator";

export default function CompensationPage() {
  const router = useRouter();
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [compensation, setCompensation] = useState<CompensationData>({
    basePay: 0,
    hra: 0, // 50% of basePay (auto-calculated)
    pf: 0, // 12% of basePay (auto-calculated)
    gratuity: 0, // 4.81% of basePay (auto-calculated)
    insurancePremium: 0, // 2% of netPay (auto-calculated)
    grossPay: 0, // auto-calculated
    netPay: 0, // auto-calculated
    annualPackage: "",
    bonuses: [],
    deductions: [],
    bankRecords: []
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
  const [bankRecord, setBankRecord] = useState<BankRecord>({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "SAVINGS",
    branchAddress: "",
    panNumber: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    // Retrieve personal data from sessionStorage
    const stored = sessionStorage.getItem("signupPersonalData");
    const signupStep = sessionStorage.getItem("signupStep");

    if (!stored || signupStep !== "compensation") {
      // Redirect back to signup if no personal data or step is not compensation
      setIsUnauthorized(true);
      const timer = setTimeout(() => {
        router.push("/signup");
      }, 2000);
      return () => clearTimeout(timer);
    }
    setPersonalData(JSON.parse(stored));
  }, [router]);

  const handleBankInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBankRecord((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-calculate compensation fields based on basePay
  const handleBasePay = (basePay: number) => {
    // Recompute bonus/deduction amounts from percentages based on new basePay
    const updatedBonuses = compensation.bonuses.map((b) => ({
      ...b,
      amount: basePay * (b.percentageOfSalary / 100)
    }));
    const updatedDeductions = compensation.deductions.map((d) => ({
      ...d,
      amount: basePay * (d.percentageOfSalary / 100)
    }));

    // Calculate salary components using utility function
    const salaryCalc = computeSalaryTotals(
      basePay,
      updatedBonuses,
      updatedDeductions
    );

    // Add bonuses
    const totalBonus = updatedBonuses.reduce((sum, b) => sum + b.amount, 0);

    // Subtract deductions
    const totalDeductions = updatedDeductions.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    // Final net pay
    const finalNetPay = salaryCalc.netPay + totalBonus - totalDeductions;

    setCompensation((prev) => ({
      ...prev,
      basePay,
      hra: salaryCalc.hra,
      pf: salaryCalc.pf,
      gratuity: salaryCalc.gratuity,
      insurancePremium: salaryCalc.insurancePremium,
      grossPay: salaryCalc.grossPay,
      netPay: finalNetPay,
      bonuses: updatedBonuses,
      deductions: updatedDeductions
    }));
  };

  const addBonus = () => {
    if (!bonusInput.bonusType || bonusInput.percentageOfSalary === 0) {
      toast.error("Please fill bonus details");
      return;
    }
    setCompensation((prev) => {
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

  const removeBonus = (index: number) => {
    setCompensation((prev) => {
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

  const addDeduction = () => {
    if (
      !deductionInput.deductionType ||
      deductionInput.percentageOfSalary === 0
    ) {
      toast.error("Please fill deduction details");
      return;
    }
    setCompensation((prev) => {
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

  const removeDeduction = (index: number) => {
    setCompensation((prev) => {
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

  const addBankRecord = () => {
    if (
      !bankRecord.bankName ||
      !bankRecord.accountNumber ||
      !bankRecord.ifscCode
    ) {
      toast.error("Please fill all required bank details");
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
      branchAddress: "",
      panNumber: ""
    });
    toast.success("Bank record added");
  };

  const removeBankRecord = (index: number) => {
    setCompensation((prev) => ({
      ...prev,
      bankRecords: prev.bankRecords.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (compensation.bankRecords.length === 0) {
      setError("Please add at least one bank record");
      return;
    }

    if (!personalData) {
      setError("Personal data not found. Please start over.");
      router.push("/signup");
      return;
    }

    setIsLoading(true);

    try {
      // Store compensation data in sessionStorage
      sessionStorage.setItem(
        "signupCompensationData",
        JSON.stringify(compensation)
      );

      // Mark that compensation details have been completed
      sessionStorage.setItem("signupStep", "organization");

      // Redirect to organization step
      router.push("/signup/organization");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to proceed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isUnauthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md p-4 gap-2">
          <CardHeader className="p-0">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please complete the personal details form first
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to signup page...
            </p>
            <Button
              onClick={() => router.push("/signup")}
              className="w-full"
              variant="outline"
            >
              Go to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!personalData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md p-4 gap-2">
          <CardContent className="p-0">
            <p className="text-center text-sm text-muted-foreground">
              Loading...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#eeeeee] p-4">
      <Toaster position="top-right" richColors />
      <Card className="w-full max-w-2xl gap-2">
        <CardHeader className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Compensation Details</CardTitle>
              <CardDescription>
                Step 2 of 3: Enter compensation and bank information
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">2</div>
              <div className="text-xs text-muted-foreground">of 3</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-4 overflow-y-auto max-h-[calc(100vh-280px)] no-scrollbar">
          <form
            onSubmit={handleSubmit}
            id="compensation-form"
            className="space-y-6"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {/* Summary of personal information */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-900 font-medium mb-2">HR Summary:</p>
              <div className="text-blue-800 space-y-1 text-xs">
                <p>
                  <strong>Name:</strong> {personalData.name}
                </p>
                <p>
                  <strong>Email:</strong> {personalData.email}
                </p>
                <p>
                  <strong>Title:</strong> {personalData.title}
                </p>
              </div>
            </div>

            {/* Compensation Section */}
            <div>
              <h3 className="font-semibold mb-4">Compensation Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="basePay">Base Pay *</Label>
                  <Input
                    id="basePay"
                    type="number"
                    placeholder="50000"
                    value={compensation.basePay || ""}
                    onChange={(e) =>
                      handleBasePay(parseFloat(e.target.value) || 0)
                    }
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualPackage">Annual Package</Label>
                  <Input
                    id="annualPackage"
                    placeholder="e.g., 12 LPA"
                    value={compensation.annualPackage}
                    onChange={(e) =>
                      setCompensation((prev) => ({
                        ...prev,
                        annualPackage: e.target.value
                      }))
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Bonus Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Add Bonuses</h3>
                <Badge variant="secondary">
                  {compensation.bonuses.length} Added
                </Badge>
              </div>
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bonusType">Bonus Type</Label>
                    <Input
                      id="bonusType"
                      placeholder="e.g., Performance Bonus"
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
                    {/* Amount is derived from percentage; input removed */}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonusPercentage">
                      Percentage of Salary
                    </Label>
                    <Input
                      id="bonusPercentage"
                      type="number"
                      placeholder="10"
                      value={bonusInput.percentageOfSalary || ""}
                      onChange={(e) =>
                        setBonusInput({
                          ...bonusInput,
                          percentageOfSalary: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonusExpires">Expires On</Label>
                    <Input
                      id="bonusExpires"
                      type="date"
                      value={
                        bonusInput.expiresOn instanceof Date
                          ? bonusInput.expiresOn.toISOString().split("T")[0]
                          : ""
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
                  variant="outline"
                  onClick={addBonus}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bonus
                </Button>
              </div>

              {compensation.bonuses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Added Bonuses:</p>
                  {compensation.bonuses.map((bonus, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg flex justify-between items-start"
                    >
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>{bonus.bonusType}</strong>
                        </p>
                        <p className="text-muted-foreground">
                          ${bonus.amount.toLocaleString()}{" "}
                          {bonus.percentageOfSalary > 0 &&
                            `(${bonus.percentageOfSalary}%)`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBonus(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deduction Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Add Deductions</h3>
                <Badge variant="secondary">
                  {compensation.deductions.length} Added
                </Badge>
              </div>
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deductionType">Deduction Type</Label>
                    <Input
                      id="deductionType"
                      placeholder="e.g., Tax, Loan"
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
                    {/* Amount is derived from percentage; input removed */}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deductionDescription">Description</Label>
                    <Input
                      id="deductionDescription"
                      placeholder="Optional description"
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
                    <Label htmlFor="deductionExpires">Expires On</Label>
                    <Input
                      id="deductionExpires"
                      type="date"
                      value={
                        deductionInput.expiresOn instanceof Date
                          ? deductionInput.expiresOn.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setDeductionInput({
                          ...deductionInput,
                          expiresOn: new Date(e.target.value)
                        })
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDeduction}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deduction
                </Button>
              </div>

              {compensation.deductions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Added Deductions:</p>
                  {compensation.deductions.map((deduction, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg flex justify-between items-start"
                    >
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>{deduction.deductionType}</strong>
                        </p>
                        <p className="text-muted-foreground">
                          ${deduction.amount.toLocaleString()}
                        </p>
                        {deduction.description && (
                          <p className="text-xs text-gray-500">
                            {deduction.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDeduction(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bank Records Section */}
            <div>
              <h3 className="font-semibold mb-4">Bank Information</h3>

              <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      placeholder="HDFC Bank"
                      value={bankRecord.bankName}
                      onChange={handleBankInputChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <select
                      id="accountType"
                      name="accountType"
                      value={bankRecord.accountType}
                      onChange={handleBankInputChange}
                      disabled={isLoading}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="SAVINGS">Savings</option>
                      <option value="CHECKING">Checking</option>
                      <option value="CURRENT">Current</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">
                      Account Holder Name
                    </Label>
                    <Input
                      id="accountHolderName"
                      name="accountHolderName"
                      placeholder="John Doe"
                      value={bankRecord.accountHolderName}
                      onChange={handleBankInputChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      placeholder="1234567890"
                      value={bankRecord.accountNumber}
                      onChange={handleBankInputChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      name="ifscCode"
                      placeholder="HDFC0001234"
                      value={bankRecord.ifscCode}
                      onChange={handleBankInputChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchAddress">Branch Address</Label>
                    <Input
                      id="branchAddress"
                      name="branchAddress"
                      placeholder="123 Main St, City"
                      value={bankRecord.branchAddress}
                      onChange={handleBankInputChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      name="panNumber"
                      placeholder="ABCDE1234F"
                      value={bankRecord.panNumber}
                      onChange={handleBankInputChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addBankRecord}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Add Bank Record
                </Button>
              </div>

              {/* Bank Records List */}
              {compensation.bankRecords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Added Bank Records</h4>
                  {compensation.bankRecords.map((record, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg flex justify-between items-start"
                    >
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>{record.bankName}</strong>
                        </p>
                        <p className="text-muted-foreground">
                          A/C: {record.accountNumber} ({record.accountType})
                        </p>
                        <p className="text-muted-foreground text-xs">
                          IFSC: {record.ifscCode}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBankRecord(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compensation Summary */}
            {compensation.basePay > 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-4 space-y-3 mt-4">
                <p className="text-sm font-medium text-green-900">
                  Compensation Summary:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">HRA (50%)</p>
                    <p className="font-semibold">
                      ${compensation.hra.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">PF (12%)</p>
                    <p className="font-semibold">
                      ${compensation.pf.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gratuity (4.81%)</p>
                    <p className="font-semibold">
                      ${compensation.gratuity.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Insurance (2%)</p>
                    <p className="font-semibold">
                      ${compensation.insurancePremium.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Bonuses</p>
                    <p className="font-semibold text-blue-600">
                      $
                      {compensation.bonuses
                        .reduce((sum, b) => sum + b.amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Deductions</p>
                    <p className="font-semibold text-red-600">
                      $
                      {compensation.deductions
                        .reduce((sum, d) => sum + d.amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gross Pay</p>
                    <p className="font-semibold text-green-600">
                      ${compensation.grossPay.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Net Pay</p>
                    <p className="font-semibold text-green-700">
                      ${compensation.netPay.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="block bg-muted-foreground/10 p-4">
          <FieldSeparator />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                sessionStorage.removeItem("signupStep");
                router.push("/signup");
              }}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              form="compensation-form"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Continue to Organization"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
