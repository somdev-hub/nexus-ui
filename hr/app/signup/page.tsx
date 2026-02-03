"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { FieldSeparator } from "@/components/ui/field";
import type { PersonalFormData } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PersonalFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    department: "",
    role: "",
    title: "",
    personalEmail: "",
    profilePicture: null,
    gender: "",
    age: 0,
    dateOfBirth: null
  });
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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
        setFormData((prev) => ({
          ...prev,
          profilePicture: file
        }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("Please select an image file");
      }
    }
  };

  const removeProfilePicture = () => {
    setFormData((prev) => ({
      ...prev,
      profilePicture: null
    }));
    setProfilePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone ||
      !formData.address ||
      !formData.title
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Store personal data in sessionStorage for the next step
      sessionStorage.setItem(
        "signupPersonalData",
        JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          department: formData.department,
          title: formData.title,
          personalEmail: formData.personalEmail,
          gender: formData.gender,
          age: formData.age,
          dateOfBirth:
            formData.dateOfBirth instanceof Date
              ? formData.dateOfBirth.toISOString()
              : null
        })
      );

      // Mark that personal details have been completed
      sessionStorage.setItem("signupStep", "compensation");

      // Redirect to compensation step
      router.push("/signup/compensation");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#eeeeee]">
      <Card className="w-full max-w-lg gap-2">
        <CardHeader className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                Step 1 of 3: Enter your personal details
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-xs text-muted-foreground">of 3</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="">
            <div className=" no-scrollbar max-h-[70vh] overflow-y-auto space-y-4 px-4 pb-2">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Company Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input
                    id="personalEmail"
                    name="personalEmail"
                    type="email"
                    placeholder="john@personal.com"
                    value={formData.personalEmail}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="7891040789"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="HR Manager"
                    value={formData.title}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      handleSelectChange("department", value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HUMAN_RESOURCES">
                        Human Resources
                      </SelectItem>
                      <SelectItem value="OPERATIONS">Operations</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="PRODUCTS">Products</SelectItem>
                      <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                      <SelectItem value="FLEET">Fleet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="120"
                    placeholder="30"
                    value={formData.age || ""}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="City, State, Postal Code"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Profile Picture (Optional)</Label>
                <div
                  onDrop={handleProfilePictureChange}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  {profilePreview ? (
                    <div className="space-y-2">
                      <Image
                        src={profilePreview}
                        alt="Profile preview"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full mx-auto object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeProfilePicture}
                        className="text-red-500 hover:text-red-700 text-xs inline-flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <p>Drag and drop your image here, or</p>
                        <label className="text-primary hover:underline cursor-pointer">
                          click to select
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                            disabled={isLoading}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters
                  </p>
                </div>

                <div className="space-y-2 flex-1">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>
            <CardFooter className="block bg-muted-foreground/10 p-4">
              <FieldSeparator />
              <div className=" space-y-2">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Processing..." : "Continue to Compensation"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Already have an account?{" "}
                  </span>
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
