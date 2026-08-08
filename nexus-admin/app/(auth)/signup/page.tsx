"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Control, Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LogIn } from "lucide-react";

import { signup } from "@/lib/auth-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";

type Gender = "MALE" | "FEMALE" | "OTHER";

interface SignupForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    gender: Gender;
    age: number;
    dateOfBirth: Date;
    password: string;
    confirmPassword: string;
}

const signupSchema = z
    .object({
        firstName: z.string().min(2).max(100),
        lastName: z.string().min(2).max(100),
        email: z.email(),
        phone: z.string().min(10).max(15),
        address: z.string().min(2).max(200),
        city: z.string().min(2).max(100),
        state: z.string().min(2).max(100),
        country: z.string().min(2).max(100),
        pincode: z.string().min(4).max(10),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]),
        age: z.number().min(0),
        dateOfBirth: z.date(),
        password: z.string().min(6),
        confirmPassword: z.string().min(6),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

const SignupFormFirstPage = ({
    control,
}: {
    control: Control<SignupForm, SignupForm>;
}) => (
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
            name="email"
            control={control}
            render={({ field }) => (
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
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
                    <Input id="phone" placeholder="7891040789" {...field} />
                </Field>
            )}
        />
    </>
);

const SignupFormSecondPage = ({
    control,
}: {
    control: Control<SignupForm, SignupForm>;
}) => (
    <>
        <Controller
            name="gender"
            control={control}
            render={({ field }) => (
                <Field>
                    <FieldLabel htmlFor="gender">Gender</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <Input
                        id="age"
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                        onDateChange={field.onChange}
                        placeholder="Select your date of birth"
                    />
                </Field>
            )}
        />
    </>
);

const SignupFormThirdPage = ({
    control,
}: {
    control: Control<SignupForm, SignupForm>;
}) => (
    <>
        <Controller
            name="address"
            control={control}
            render={({ field }) => (
                <Field>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <Input id="address" placeholder="City, State, Postal Code" {...field} />
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
);

const SignupFormFourthPage = ({
    control,
}: {
    control: Control<SignupForm, SignupForm>;
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Controller
                name="password"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="********"
                                {...field}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500">
                                {showPassword ? (
                                    <EyeOff onClick={() => setShowPassword(false)} className="h-4 w-4" />
                                ) : (
                                    <Eye onClick={() => setShowPassword(true)} className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                    </Field>
                )}
            />
            <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="********"
                            {...field}
                        />
                    </Field>
                )}
            />
        </>
    );
};

export function SignupFormContent({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);

    const { control, handleSubmit } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
            gender: "MALE",
            age: 0,
            dateOfBirth: new Date(),
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = handleSubmit(async (data, e) => {
        e?.stopPropagation();
        try {
            setIsLoading(true);

            const response = await signup({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                city: data.city,
                state: data.state,
                country: data.country,
                pincode: data.pincode,
                gender: data.gender,
                age: data.age,
                dateOfBirth: data.dateOfBirth.toISOString(),
                password: data.password,
            });

            const updatedUser = {
                id: response.user.id,
                email: response.user.email,
                name: `${data.firstName} ${data.lastName}`,
                role: response.user.role,
                avatar: response.user.avatar,
            };

            localStorage.setItem("auth_user", JSON.stringify(updatedUser));

            toast({
                title: "Signup successful",
                description: "Redirecting to home...",
                variant: "success",
            });
            router.push("/");
        } catch (error) {
            toast({
                title: "Signup failed",
                description: "An error occurred during signup. Please try again.",
                variant: "destructive",
            });
            console.error("Signup error:", error);
        } finally {
            setIsLoading(false);
        }
    });

    return (
        <div className={cn("flex flex-col gap-6 h-[80dvh]", className)} {...props}>
            <Card className="overflow-hidden p-0 h-full">
                <CardContent className="grid p-0 md:grid-cols-2 h-full">
                    <form className="p-6 md:p-8" onSubmit={onSubmit} action="javascript:void(0)">
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Create Admin Account</h1>
                                <p className="text-balance text-muted-foreground">
                                    Enter your details to get started
                                </p>
                            </div>

                            <div className="mt-2 flex flex-col gap-4">
                                {page === 0 ? (
                                    <SignupFormFirstPage control={control} />
                                ) : page === 1 ? (
                                    <SignupFormSecondPage control={control} />
                                ) : page === 2 ? (
                                    <SignupFormThirdPage control={control} />
                                ) : (
                                    <SignupFormFourthPage control={control} />
                                )}

                                {page !== 3 ? (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <Button type="button" className="w-full py-4.5" onClick={() => setPage(page + 1)}>
                                            Next <ArrowRight />
                                        </Button>
                                        {page > 0 && (
                                            <Button type="button" className="w-full py-4.5" variant="outline" onClick={() => setPage(page - 1)}>
                                                Back <ArrowLeft />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <Button type="submit" className="w-full py-4.5" disabled={isLoading}>
                                            {isLoading ? (
                                                <Spinner />
                                            ) : (
                                                <>
                                                    Sign Up <LogIn />
                                                </>
                                            )}
                                        </Button>
                                        <Button type="button" className="w-full py-4.5" variant="outline" onClick={() => setPage(page - 1)}>
                                            Back <ArrowLeft />
                                        </Button>
                                    </div>
                                )}

                                <FieldDescription className="text-center">
                                    Already have an account? <Link href="/login">Log in</Link>
                                </FieldDescription>
                            </div>
                        </FieldGroup>
                    </form>

                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="https://github.com/shadcn.png"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return (
        <SignupFormContent className="w-full max-w-4xl" />
    );
}
