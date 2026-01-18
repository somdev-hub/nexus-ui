"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import Link from "next/link";
import { signup, createOrganization } from "@/lib/auth-service";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface PersonalData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profilePhoto: string;
}

export default function OrganizationPage() {
  const router = useRouter();
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Retrieve personal data from sessionStorage
    const stored = sessionStorage.getItem("signupPersonalData");
    if (!stored) {
      // Redirect back to signup if no personal data
      router.push("/signup");
      return;
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
      // Step 1: Register user
      const signupResponse = await signup({
        name: personalData.name,
        email: personalData.email,
        password: personalData.password,
        phone: personalData.phone,
        address: personalData.address,
        profilePhoto: personalData.profilePhoto
      });

      const userId = signupResponse.userId;

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
        avatar: `/avatars/${personalData.name}.jpg`
      };
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));

      // Clear sessionStorage after successful signup
      sessionStorage.removeItem("signupPersonalData");

      toast.success("Account created successfully!");

      // Redirect to dashboard
      router.push("/retailer/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Toaster position="top-right" richColors />
      <Card className="w-full max-w-md p-4 gap-2">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl">Organization Details</CardTitle>
          <CardDescription>Tell us about your organization</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

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

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Want to go back? </span>
              <Link href="/signup" className="text-primary hover:underline">
                Edit personal info
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
