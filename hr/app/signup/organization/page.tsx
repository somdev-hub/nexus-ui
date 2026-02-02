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
import { FieldSeparator } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { signup, createOrganization } from "@/lib/auth-service";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface PersonalData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  department: string;
  title: string;
  personalEmail: string;
  profilePicture: File | null;
}

export default function OrganizationPage() {
  const router = useRouter();
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    // Retrieve personal data from sessionStorage
    const stored = sessionStorage.getItem("signupPersonalData");
    const signupStep = sessionStorage.getItem("signupStep");

    if (!stored || signupStep !== "organization") {
      // Redirect back to signup if no personal data or step is not organization
      setIsUnauthorized(true);
      const timer = setTimeout(() => {
        router.push("/signup");
      }, 2000);
      return () => clearTimeout(timer);
    }
    setPersonalData(JSON.parse(stored));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!orgName || !orgType) {
      setError("Please fill in all required fields");
      return;
    }

    if (!personalData) {
      setError("Personal data not found. Please start over.");
      router.push("/signup");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register user with personal data
      const signupResponse = await signup({
        name: personalData.name,
        email: personalData.email,
        password: personalData.password,
        phone: personalData.phone,
        address: personalData.address,
        profilePhoto: ""
      });

      const userId = signupResponse.user.id;

      // Step 2: Create organization and capture orgId and role
      const orgResponse = await createOrganization(userId, orgName, orgType);
      const orgId = orgResponse.orgId;
      const role = orgResponse.people[0].role.name;

      // Update user in localStorage with the role and orgId
      const updatedUser = {
        id: userId,
        email: personalData.email,
        name: personalData.name,
        role: role,
        organizationId: orgId,
        title: personalData.title,
        department: personalData.department,
        avatar: `/avatars/${personalData.name}.jpg`
      };
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));

      // Clear sessionStorage after successful signup
      sessionStorage.removeItem("signupPersonalData");
      sessionStorage.removeItem("signupCompensationData");
      sessionStorage.removeItem("signupStep");

      toast.success("Account created successfully!");

      // Redirect to dashboard
      router.push("/hr");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
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
      <Card className="w-full max-w-lg gap-2">
        <CardHeader className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Organization Setup</CardTitle>
              <CardDescription>
                Step 3 of 3: Enter your organization details
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-xs text-muted-foreground">of 3</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {/* Summary of personal information */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-900 font-medium mb-2">HR Details:</p>
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

            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name *</Label>
              <Input
                id="orgName"
                placeholder="Acme Corporation"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="orgType">Organization Type *</Label>
              <Select
                value={orgType}
                onValueChange={setOrgType}
                disabled={isLoading}
              >
                <SelectTrigger id="orgType" className="w-full">
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAILER">Retailer</SelectItem>
                  <SelectItem value="SUPPLIER">Supplier</SelectItem>
                  <SelectItem value="LOGISTICS">Logistics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
        <FieldSeparator />
        <CardFooter className="block bg-muted-foreground/10 p-4">
          <form onSubmit={handleSubmit} className="w-full">
            <Button type="submit" disabled={isLoading} className="w-full mb-3">
              {isLoading ? "Creating account..." : "Complete Setup"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Want to go back? </span>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("signupStep");
                router.push("/signup");
              }}
              className="text-primary hover:underline"
            >
              Edit personal info
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
