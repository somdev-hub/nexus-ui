"use client"

import React from 'react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from 'next/image';
import { login, LoginRequest } from '@/lib/auth-service';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
    personalEmail: z.email({ message: "Invalid email address" }),
    password: z.string(),
});

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { control, handleSubmit } = useForm<LoginRequest>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            personalEmail: "",
            password: "",
        },
    })
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const onSubmit = async (data: LoginRequest, e?: React.BaseSyntheticEvent) => {
        e?.stopPropagation();
        try {
            setLoading(true);
            console.log("[LOGIN PAGE] Calling login with:", data.personalEmail);
            const response = await login(data);
            console.log("[LOGIN PAGE] Login successful, redirecting to /");
            const updatedUser = {
                id: response.user.id,
                personalEmail: response.user.personalEmail,
                name: response.user.name,
                role: response.user.role,
                avatar: response.user.avatar
            }

            sessionStorage.setItem("auth_user", JSON.stringify(updatedUser));

            toast({
                title: "Login successful",
                description: "Redirecting to homepage...",
                variant: "success"
            });
            console.log("✅ Success:", data);
            router.push("/");
        } catch (error) {
            console.error("[LOGIN PAGE] Login error:", error);
            toast({
                title: "Login failed",
                description: (error as Error).message || "An error occurred during login.",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    }


    return (
        <div className={cn("flex flex-col gap-6 h-[70dvh]", className)} {...props}>
            <Card className="overflow-hidden p-0 h-full">
                <CardContent className="grid p-0 md:grid-cols-2 h-full">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)} action="javascript:void(0)">
                        <FieldGroup className="gap-10">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                                <p className="text-balance text-muted-foreground">
                                    Login to your Acme Inc account
                                </p>
                            </div>
                            <div className=" gap-4 flex flex-col mt-4">
                                <Controller
                                    name="personalEmail"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field>
                                            <FieldLabel htmlFor="email">Email</FieldLabel>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="m@example.com"
                                                required
                                                {...field}
                                            />
                                            {fieldState.error && (
                                                <FieldDescription className="text-destructive">
                                                    {fieldState.error.message}
                                                </FieldDescription>
                                            )}
                                        </Field>
                                    )} />
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Field>
                                            <div className="flex items-center">
                                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                                <Link
                                                    href="/forget-password"
                                                    className="ml-auto text-sm underline-offset-2 hover:underline"
                                                >
                                                    Forgot your password?
                                                </Link>
                                            </div>
                                            <Input id="password" placeholder="••••••••" type="password" required {...field} />
                                            {fieldState.error && (
                                                <FieldDescription className="text-destructive">
                                                    {fieldState.error.message}
                                                </FieldDescription>
                                            )}
                                        </Field>)} />
                                <Field>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? <Spinner /> : (
                                            <>
                                                <span>Login</span>
                                                <LogIn />
                                            </>
                                        )}
                                    </Button>
                                </Field>

                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <Link href="signup">Sign up</Link>
                                </FieldDescription>
                            </div>
                        </FieldGroup>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            width={400}
                            height={400}
                            src="https://github.com/shadcn.png"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}


const Login = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <LoginForm className="w-full max-w-3xl" />
        </div>
    )
}

export default Login