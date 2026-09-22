"use client";

import { useAuth } from "@/lib/auth-context";
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
import Link from "next/link";

const signupSchema = z
	.object({
		name: z.string().min(2, "Full name must be at least 2 characters"),
		email: z.string().email("Please enter a valid email address"),
		password: z.string().min(1, "Password is required"),
		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"]
	});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
	const { signup, isLoading } = useAuth();
	const router = useRouter();
	const [error, setError] = useState("");

	const form = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
		defaultValues: { name: "", email: "", password: "", confirmPassword: "" }
	});

	const onSubmit = async (data: SignupFormData) => {
		setError("");
		try {
			await signup(data.email, data.password, data.name);
			router.push("/retailer/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-background">
			<Card className="w-full max-w-md p-4 gap-2">
				<CardHeader className="p-0">
					<CardTitle className="text-2xl">Create Account</CardTitle>
					<CardDescription>Sign up for your Nexus account</CardDescription>
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
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name</FormLabel>
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
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? "Creating account..." : "Create account"}
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
