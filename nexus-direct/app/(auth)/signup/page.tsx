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
import * as z from "zod"
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, LogIn, Upload } from 'lucide-react';
import { signup } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


interface SignupForm {
    firstName: string;
    lastName: string;
    personalEmail: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    gender: Gender;
    age: number;
    dateOfBirth: Date;
    role: string;
    password?: string;
    confirmPassword?: string;
    profilePhoto?: FileList;
}

type Gender = "MALE" | "FEMALE" | "OTHER";

const signupSchema = z.object({
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    personalEmail: z.email(),
    phone: z.string().min(10).max(15),
    address: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    age: z.number().min(0),
    dateOfBirth: z.date(),
    role: z.string(),
    password: z.string().min(8).or(z.literal("")).optional(),
    confirmPassword: z.string().min(8).or(z.literal("")).optional(),
    profilePhoto: z.any().optional(),
});

const SignupFormFirstPage = ({
    control
}: {
    control: Control<SignupForm, unknown, SignupForm>
}) => {
    return (

        <>
            <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                        <Input id="firstName" placeholder="John" {...field} />
                    </Field>
                )}
            />
            <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input id="lastName" placeholder="Doe" {...field} />
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
                name="address"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="address">Address</FieldLabel>
                        <Input id="address" placeholder="123 Main St" {...field} />
                    </Field>
                )}
            />
            <div className="flex gap-2">
                <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                        <Field>
                            <FieldLabel htmlFor="city">City</FieldLabel>
                            <Input id="city" placeholder="New York" {...field} />
                        </Field>
                    )}
                />
                <Controller
                    name="pincode"
                    control={control}
                    render={({ field }) => (
                        <Field>
                            <FieldLabel htmlFor="pincode">Pin Code</FieldLabel>
                            <Input id="pincode" placeholder="10001" {...field} />
                        </Field>
                    )}
                />

            </div>
            <div className="flex gap-2">
                <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                        <Field>
                            <FieldLabel htmlFor="state">State</FieldLabel>
                            <Input id="state" placeholder="NY" {...field} />
                        </Field>
                    )}
                />
                <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                        <Field>
                            <FieldLabel htmlFor="country">Country</FieldLabel>
                            <Input id="country" placeholder="USA" {...field} />
                        </Field>
                    )}
                />
            </div>
        </>
    )
}

const SignupFormFourthPage = ({
    control
}: {
    control: Control<SignupForm, unknown, SignupForm>
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const profilePhotoRef = React.useRef<HTMLInputElement | null>(null);
    return (
        <>
            {/* // profile picture upload field can be added here in future */}

            <Controller
                name="profilePhoto"
                control={control}
                render={({ field }) => (
                    <div>
                        <p className="text-sm font-medium mb-2">Profile Picture</p>
                        <label
                            onClick={() => profilePhotoRef.current?.click()}
                            htmlFor="profilePhoto"
                            className={`border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:bg-gray-100 transition-all duration-300 ease-in-out flex items-center ${field.value && field.value.length > 0 ? "justify-start p-2" : "justify-center p-4"} gap-2`}
                        >
                            {
                                field.value && field.value.length > 0 ? (
                                    <div className="flex gap-2 items-center justify-start">
                                        {/* preview */}
                                        <Image
                                            width={48}
                                            height={48}
                                            src={URL.createObjectURL(field.value[0])}
                                            alt="Profile Preview"
                                            className="rounded-md object-cover mx-auto"
                                        />
                                        <p className="text-gray-500 text-sm">{field.value[0].name}</p>
                                    </div>
                                ) :
                                    <>
                                        <Upload className="text-gray-500 w-4 h-4" />
                                        <p className="text-gray-500 text-sm">Upload Profile Picture (Optional)</p>
                                    </>

                            }
                            <Input id="profilePhoto" type="file"
                                accept="image/*"
                                className="hidden"
                                ref={profilePhotoRef}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    field.onChange(e.target.files);
                                }}
                            />
                        </label>
                    </div>
                )}
            />

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
    const { toast } = useToast();
    const { control, handleSubmit } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            personalEmail: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            gender: "MALE",
            age: 0,
            dateOfBirth: new Date(),
            role: "APPLICANT",
            password: "",
            confirmPassword: "",
            profilePhoto: undefined
        }
    });

    const [page, setPage] = useState(0);

    const onSubmit = handleSubmit(async (data) => {
        console.log("✅ Success:", data);

        const response = await signup({
            firstName: data.firstName,
            lastName: data.lastName,
            personalEmail: data.personalEmail,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            pincode: data.pincode,
            gender: data.gender,
            age: data.age,
            dateOfBirth: data.dateOfBirth.toISOString(),
            password: data.password || "",
            profilePicture: data.profilePhoto && data.profilePhoto.length > 0 ? data.profilePhoto[0] : null
        })

        const updatedUser = {
            id: response.user.id,
            personalEmail: data.personalEmail,
            name: `${data.firstName} ${data.lastName}`,
            role: response.user.role,
            avatar: response.user.avatar
        }

        sessionStorage.setItem("auth_user", JSON.stringify(updatedUser));

        toast({
            title: "Signup successful",
            description: "You can now log in with your credentials.",
            variant: "success"
        });
    },
        (errors) => {
            console.log("❌ Validation errors:", errors);  // ← add this
        });


    return (
        <div className={cn("flex flex-col gap-6 h-[80dvh]", className)} {...props}>
            <Card className="overflow-hidden p-0 h-full">
                <CardContent className="grid p-0 md:grid-cols-2 h-full">
                    <form className="p-6 md:p-8" onClick={(e) => e.preventDefault()}>
                        <FieldGroup className="">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Create an account</h1>
                                <p className="text-balance text-muted-foreground">
                                    Enter your details to get started
                                </p>
                            </div>
                            <div className=" gap-4 flex flex-col mt-2 transition-all duration-300 ease-in-out">
                                {page === 0 ? (<SignupFormFirstPage control={control} />) : page === 1 ? (<SignupFormSecondPage control={control} />) : page === 2 ? (<SignupFormThirdPage control={control} />) : page === 3 ? (<SignupFormFourthPage control={control} />) : null}
                                {
                                    page != 3 ?
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
                                                <Button type="submit" className="w-full py-4.5 mt-4" onClick={onSubmit}>
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
                                    Already have an account? <Link href="login">Log in</Link>
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