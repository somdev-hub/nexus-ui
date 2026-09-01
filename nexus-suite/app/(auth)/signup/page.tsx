"use client";

import { useAuth } from "@/lib/auth-context";
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

export default function SignupPage() {
	const { signup, isLoading } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email || !password || !confirmPassword || !name) {
			setError("Please fill in all fields");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		try {
			await signup(email, password, name);
			router.push("/retailer/dashboard");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Signup failed. Please try again."
			);
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
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="John Doe"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={isLoading}
								required
							/>
						</div>

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

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
								required
								minLength={8}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								type="password"
								placeholder="••••••••"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								disabled={isLoading}
								required
							/>
						</div>

						<Button type="submit" disabled={isLoading} className="w-full">
							{isLoading ? "Creating account..." : "Create account"}
						</Button>

						<div className="text-center text-sm">
							<span className="text-muted-foreground">
								Already have an account?{" "}
							</span>
							<Link href="/login" className="text-primary hover:underline">
								Sign in
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}