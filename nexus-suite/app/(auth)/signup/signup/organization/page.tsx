"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/components/ui/form";
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

const organizationSchema = z.object({
	orgName: z.string().min(2, "Organization name is required"),
	orgType: z.enum(["RETAILER", "SUPPLIER", "LOGISTICS"], {
		message: "Please select organization type"
	})
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

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
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<OrganizationFormData>({
		resolver: zodResolver(organizationSchema),
		defaultValues: { orgName: "", orgType: undefined as unknown as OrganizationFormData["orgType"] }
	});

	useEffect(() => {
		const stored = sessionStorage.getItem("signupPersonalData");
		if (!stored) {
			router.push("/signup");
			return;
		}
		setPersonalData(JSON.parse(stored));
	}, [router]);

	const onSubmit = async (data: OrganizationFormData) => {
		setError("");
		if (!personalData) {
			setError("Personal data not found. Please start over.");
			router.push("/signup");
			return;
		}
		setIsLoading(true);
		try {
			const signupResponse = await signup({
				name: personalData.name,
				email: personalData.email,
				password: personalData.password,
				phone: personalData.phone,
				address: personalData.address,
				profilePhoto: personalData.profilePhoto
			});
			const userId = signupResponse.user.id;
			const orgResponse = await createOrganization(userId, data.orgName, data.orgType);
			const orgId = orgResponse.orgId;
			const role = orgResponse.people[0].role.name;
			const updatedUser = {
				id: userId,
				email: personalData.email,
				name: personalData.name,
				role: role,
				organizationId: orgId,
				avatar: `/avatars/${personalData.name}.jpg`
			};
			localStorage.setItem("auth_user", JSON.stringify(updatedUser));
			sessionStorage.removeItem("signupPersonalData");
			toast.success("Account created successfully!");
			router.push("/retailer/dashboard");
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Signup failed. Please try again.";
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
						<p className="text-center text-sm text-muted-foreground">Loading...</p>
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
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							{error && (
								<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
							)}
							<FormField
								control={form.control}
								name="orgName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Organization Name *</FormLabel>
										<FormControl>
											<Input placeholder="Acme Corporation" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="orgType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Organization Type *</FormLabel>
										<Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select organization type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="RETAILER">Retailer</SelectItem>
												<SelectItem value="SUPPLIER">Supplier</SelectItem>
												<SelectItem value="LOGISTICS">Logistics</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? "Creating account..." : "Create account"}
							</Button>
							<div className="text-center text-sm">
								<span className="text-muted-foreground">Want to go back? </span>
								<Link href="/signup" className="text-primary hover:underline">Edit personal info</Link>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
