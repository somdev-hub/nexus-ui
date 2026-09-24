"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getDashboardPathForOrgType } from "@/lib/services/organization-service";
import { getOrganizationById } from "@/lib/services/organization-service";
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
import Link from "next/link";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const { login, isLoading } = useAuth();
	const router = useRouter();
	const [error, setError] = useState("");

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" }
	});

	const onSubmit = async (data: LoginFormData) => {
		setError("");
		try {
			await login(data.email, data.password);
			// Resolve orgType for correct dashboard (supplier vs retailer)
			try {
				const stored = localStorage.getItem("auth_user");
				if (stored) {
					const u = JSON.parse(stored);
					let orgType = u?.orgType ? String(u.orgType).toUpperCase() : undefined;
					if (!orgType && u?.orgId) {
						try {
							const org = await getOrganizationById(u.orgId);
							orgType = (org as any)?.orgType ? String((org as any).orgType).toUpperCase() : undefined;
							if (orgType) {
								u.orgType = orgType;
								localStorage.setItem("auth_user", JSON.stringify(u));
							}
						} catch {}
					}
					router.push(getDashboardPathForOrgType(orgType));
					return;
				}
			} catch {}
			router.push("/retailer/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed. Please try again.");
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-background">
			<Card className="w-full max-w-md p-4 gap-2">
				<CardHeader className="p-0">
					<CardTitle className="text-2xl">Login</CardTitle>
					<CardDescription>Sign in to your Nexus account</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							{error && (
								<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
									{error}
								</div>
							)}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input type="email" placeholder="m@example.com" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? "Signing in..." : "Sign in"}
							</Button>
							<div className="text-center text-sm">
								<span className="text-muted-foreground">Don&apos;t have an account? </span>
								<Link href="/signup" className="text-primary hover:underline">Sign up</Link>
							</div>
							<div className="text-center text-sm">
								<Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
