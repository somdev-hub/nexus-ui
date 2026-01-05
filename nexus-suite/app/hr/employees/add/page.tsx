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
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AddEmployeePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    joinDate: "",
    salary: "",
    address: "",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
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
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/iam/users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          joinDate: formData.joinDate,
          salary: formData.salary,
          address: formData.address,
          notes: formData.notes
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add employee");
      }

      const data = await response.json();
      setCredentials({
        email: data.email,
        password: data.password
      });
      setShowCredentials(true);
      toast.success("Employee added successfully");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        joinDate: "",
        salary: "",
        address: "",
        notes: ""
      });
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
                <FieldLabel htmlFor="fullName">Full Name *</FieldLabel>
                <FieldContent>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
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
                <FieldLabel htmlFor="joinDate">Join Date</FieldLabel>
                <FieldContent>
                  <Input
                    id="joinDate"
                    name="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="salary">Salary</FieldLabel>
                <FieldContent>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="50000"
                    disabled={isLoading}
                  />
                </FieldContent>
              </Field>
            </div>

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

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the employee"
                  rows={4}
                  disabled={isLoading}
                />
              </FieldContent>
            </Field>

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
