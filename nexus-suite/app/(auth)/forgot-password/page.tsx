"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import Link from "next/link";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess(false);

		if (!email) {
			setError("Please enter your email address");
			return;
		}

		setIsLoading(true);

		try {
			// TODO: Call forgot password API
			// await forgotPassword(email);
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
			setSuccess(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Request failed. Please try again."
			);
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
						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
									{error}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isLoading}
									required
								/>
							</div>

							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? "Sending..." : "Send Reset Link"}
							</Button>

							<div className="text-center text-sm">
								<Link href="/login" className="text-primary hover:underline">
									Back to Login
								</Link>
							</div>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}