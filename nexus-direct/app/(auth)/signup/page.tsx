"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, LogIn } from 'lucide-react';


interface SignupForm {
    name: string;
    personalEmail: string;
    phone: string;
    address?: string;
    gender: Gender;
    age: number;
    dateOfBirth: Date;
    role: string;
    password?: string;
    confirmPassword?: string;
}

type Gender = "MALE" | "FEMALE" | "OTHER";

const signupSchema = z.object({
    name: z.string().min(2).max(100),
    personalEmail: z.email(),
    phone: z.string().min(10).max(15),
    address: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    age: z.number().min(0),
    dateOfBirth: z.date(),
    role: z.string(),
    password: z.string().min(8).or(z.literal("")).optional(),
    confirmPassword: z.string().min(8).or(z.literal("")).optional(),
});

const SignupFormFirstPage = ({
    control
}: {
    control: Control<SignupForm, unknown, SignupForm>
}) => {
    return (

        <>
            <Controller
                name="name"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="name">Name</FieldLabel>
                        <Input id="name" placeholder="John Doe" {...field} />
                    </Field>
                )}
            />
            <Controller
                name="personalEmail"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            {...field}
                        />
                    </Field>
                )}
            />
            <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="phone">Phone</FieldLabel>
                        <Input id="phone" placeholder="(555) 123-4567" {...field} />
                    </Field>
                )}
            />
            <Controller
                name="address"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="address">Address</FieldLabel>
                        <Input id="address" placeholder="123 Main St" {...field} />
                    </Field>
                )}
            />
        </>
    )
}

const SignupFormSecondPage = ({
    control
}: {
    control: Control<SignupForm, unknown, SignupForm>
}) => {
    return (

        <>
            <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="gender">Gender</FieldLabel>
                        <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                )}
            />
            <Controller
                name="age"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="age">Age</FieldLabel>
                        <Input id="age" type="number" placeholder="30" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </Field>
                )}
            />
            <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                        <DatePicker
                            date={field.value}
                            onDateChange={(date) => field.onChange(date)}
                            placeholder="Select your date of birth"
                        />
                    </Field>
                )}
            />
        </>
    )
}

const SignupFormThirdPage = ({
    control
}: {
    control: Control<SignupForm, unknown, SignupForm>
}) => {
    return (
        <>
            <Controller
                name="password"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input id="password" type="password" placeholder="********" {...field} />
                    </Field>
                )}
            />

            <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                        <Input id="confirmPassword" type="password" placeholder="********" {...field} />
                    </Field>
                )}
            />
        </>
    )
}

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const { control, handleSubmit } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            personalEmail: "",
            phone: "",
            address: "",
            gender: "MALE",
            age: 0,
            dateOfBirth: new Date(),
            role: "APPLICANT",
            password: "",
            confirmPassword: ""
        }
    });

    const [page, setPage] = useState(0);

    const onSubmit = handleSubmit((data) => {
        console.log("✅ Success:", data);
        toast.success("Account created successfully!");
    },
        (errors) => {
            console.log("❌ Validation errors:", errors);  // ← add this
        });

    return (
        <div className={cn("flex flex-col gap-6 h-[80dvh]", className)} {...props}>
            <Card className="overflow-hidden p-0 h-full">
                <CardContent className="grid p-0 md:grid-cols-2 h-full">
                    <form className="p-6 md:p-8" onSubmit={onSubmit}  onClick={(e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (button) {
            console.log('Button clicked:', button.type, button.textContent, button.outerHTML);
        }
    }}>
                        <FieldGroup className="">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Create an account</h1>
                                <p className="text-balance text-muted-foreground">
                                    Enter your details to get started
                                </p>
                            </div>
                            <div className=" gap-4 flex flex-col mt-2 transition-all duration-300 ease-in-out">
                                {page === 0 ? (<SignupFormFirstPage control={control} />) : page === 1 ? (<SignupFormSecondPage control={control} />) : page === 2 ? (<SignupFormThirdPage control={control} />) : null}
                                {
                                    page != 2 ?
                                        (
                                            <div className="flex flex-col gap-2 mt-4">
                                                <Button className="w-full py-4.5"
                                                    type="button"
                                                    onClick={
                                                        () => {
                                                            setPage(page + 1);
                                                        }
                                                    }
                                                >
                                                    Continue <ArrowRight type="button" />
                                                </Button>
                                                {
                                                    page > 0 &&
                                                    <Button type="button" className="w-full py-4.5" variant="outline" onClick={() => {
                                                        if (page > 0) {
                                                            setPage(page - 1);
                                                        }
                                                    }
                                                    }
                                                    >
                                                        Back <ArrowLeft />
                                                    </Button>}

                                            </div>
                                        ) :
                                        (
                                            <div className="flex flex-col gap-2 mt-4">
                                                <Button type="submit" className="w-full py-4.5 mt-4">
                                                    Complete Signup <LogIn />
                                                </Button>
                                                {
                                                    page > 0 &&
                                                    <Button type="button" className="w-full py-4.5" variant="outline" onClick={() => {
                                                        if (page > 0) {
                                                            setPage(page - 1);
                                                        }
                                                    }
                                                    }
                                                    >
                                                        Back <ArrowLeft />
                                                    </Button>}
                                            </div>
                                        )}

                                <FieldDescription className="text-center">
                                    Already have an account? <a href="/login">Log in</a>
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

const Signup = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <SignupForm className="w-full max-w-4xl" />
        </div>
    )
}

export default Signup