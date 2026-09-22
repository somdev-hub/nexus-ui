"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const signupDetailedSchema = z
	.object({
		name: z.string().min(2, "Full name is required"),
		email: z.string().email("Please enter a valid email address"),
		phone: z.string().min(10, "Phone number is required"),
		address: z.string().min(5, "Address is required"),
		password: z.string().min(1, "Password is required"),
		confirmPassword: z.string().min(1, "Confirm password is required"),
		profilePhoto: z.string().optional()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"]
	});

type SignupDetailedFormData = z.infer<typeof signupDetailedSchema>;

export default function SignupPage() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<SignupDetailedFormData>({
		resolver: zodResolver(signupDetailedSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			phone: "",
			address: "",
			profilePhoto: ""
		}
	});

	const onSubmit = async (data: SignupDetailedFormData) => {
		setError("");
		setIsLoading(true);
		try {
			sessionStorage.setItem(
				"signupPersonalData",
				JSON.stringify({
					name: data.name,
					email: data.email,
					password: data.password,
					phone: data.phone,
					address: data.address,
					profilePhoto: data.profilePhoto || ""
				})
			);
			router.push("/signup/organization");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-background p-4">
			<Card className="w-full max-w-md p-4 gap-2">
				<CardHeader className="p-0">
					<CardTitle className="text-2xl">Create Account</CardTitle>
					<CardDescription>Sign up to get started with Nexus</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							{error && (
								<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
							)}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name *</FormLabel>
										<FormControl>
											<Input placeholder="John Doe" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email *</FormLabel>
										<FormControl>
											<Input type="email" placeholder="m@example.com" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone Number *</FormLabel>
										<FormControl>
											<Input type="tel" placeholder="7891040789" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="address"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Address *</FormLabel>
										<FormControl>
											<Textarea placeholder="City, State, Postal Code" disabled={isLoading} className="resize-none" {...field} />
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
										<FormLabel>Password *</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
										<p className="text-xs text-muted-foreground">Minimum 6 characters</p>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password *</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? "Processing..." : "Continue"}
							</Button>
							<div className="text-center text-sm">
								<span className="text-muted-foreground">Already have an account? </span>
								<Link href="/login" className="text-primary hover:underline">Sign in</Link>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
