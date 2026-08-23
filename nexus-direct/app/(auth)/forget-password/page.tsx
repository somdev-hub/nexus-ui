import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React from 'react'

export function PasswordForgotForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6 h-[70dvh]", className)} {...props}>
            <Card className="overflow-hidden p-0 h-full">
                <CardContent className="grid p-0 md:grid-cols-2 h-full">
                    <form className="p-6 md:p-8">
                        <FieldGroup className="gap-10">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Forgot Password</h1>
                                <p className="text-balance text-muted-foreground">
                                    Enter your email address and we&apos;ll send you a link to reset your password.
                                </p>
                            </div>
                            <div className=" gap-4 flex flex-col mt-4">

                                <Field>
                                    <FieldLabel htmlFor="email">Enter your registered email</FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        required
                                    />
                                </Field>
                                <Field>
                                    <Button type="submit">Send Reset Link</Button>
                                </Field>

                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <a href="#">Sign up</a>
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


const ForgetPassword = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <PasswordForgotForm className="w-full max-w-3xl" />
        </div>
    )
}

export default ForgetPassword