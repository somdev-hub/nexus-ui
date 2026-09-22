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
import Link from "next/link";

const forgotPasswordSchema = z.object({
	email: z.string().email("Please enter a valid email address")
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const form = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" }
	});

	const onSubmit = async (data: ForgotPasswordFormData) => {
		setError("");
		setSuccess(false);
		setIsLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Request failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-background">
			<Card className="w-full max-w-md p-4 gap-2">
				<CardHeader className="p-0">
					<CardTitle className="text-2xl">Forgot Password</CardTitle>
					<CardDescription>Enter your email to reset your password</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{success ? (
						<div className="space-y-4">
							<div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
								If an account exists for this email, you will receive password reset instructions shortly.
							</div>
							<Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
								Back to Login
							</Button>
						</div>
					) : (
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								{error && (
									<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
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
								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? "Sending..." : "Send Reset Link"}
								</Button>
								<div className="text-center text-sm">
									<Link href="/login" className="text-primary hover:underline">Back to Login</Link>
								</div>
							</form>
						</Form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
