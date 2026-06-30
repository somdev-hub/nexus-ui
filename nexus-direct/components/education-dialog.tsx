import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Field, FieldLabel } from './ui/field';
import { DatePicker } from './ui/date-picker';
import { Button } from './ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from './ui/spinner';
import { ApplicantEducation } from '@/types';
import { addApplicantEducation } from '@/lib/auth-service';


const applicantEducationSchema = z.object({
    institute: z.string().min(1, { message: "Institute is required" }),
    degree: z.string().min(1, { message: "Degree is required" }),
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State is required" }),
    country: z.string().min(1, { message: "Country is required" }),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date({ message: "End date is required" }),
});

const EducationDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const { control, handleSubmit } = useForm<ApplicantEducation>({
        resolver: zodResolver(applicantEducationSchema),
        defaultValues: {
            institute: "",
            degree: "",
            city: "",
            state: "",
            country: "",
            startDate: new Date(),
            endDate: new Date(),
        }
    });
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const onSubmit = async (data: ApplicantEducation) => {
        setLoading(true);
        try {
            const response = await addApplicantEducation(data);
            if (response.status !== 200) {
                throw new Error("Failed to add education details");
            }
            toast({
                title: "Education Added",
                description: "Your education details have been added successfully.",
            });
            onOpenChange(false);
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: (error as Error).message || "An error occurred while adding your education details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Add Education</DialogTitle>
                    <DialogDescription>
                        Add your educational background to showcase your qualifications and achievements. This information will help potential employers understand your academic history and skills.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Controller
                        name="institute"
                        control={control}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel>Institute</FieldLabel>
                                <Input {...field} placeholder="Enter your institute name" />
                            </Field>
                        )}
                    />
                    <Controller
                        name="degree"
                        control={control}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel>Degree</FieldLabel>
                                <Input {...field} placeholder="Enter your degree" />
                            </Field>
                        )}
                    />
                    <div className="flex gap-4 items-center justify-between">
                        <Controller
                            name="city"
                            control={control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>City</FieldLabel>
                                    <Input {...field} placeholder="Enter the city" />
                                </Field>
                            )}
                        />
                        <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>State</FieldLabel>
                                    <Input {...field} placeholder="Enter the state" />
                                </Field>
                            )}
                        />
                        <Controller
                            name="country"
                            control={control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>Country</FieldLabel>
                                    <Input {...field} placeholder="Enter the country" />
                                </Field>
                            )}
                        />
                    </div>
                    <div className="flex items-center gap-4 justify-between">
                        <Controller
                            name="startDate"
                            control={control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>Start Date</FieldLabel>
                                    <DatePicker date={field.value} onDateChange={field.onChange} placeholder="Select start date" />
                                </Field>
                            )}
                        />
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>End Date</FieldLabel>
                                    <DatePicker date={field.value} onDateChange={field.onChange} placeholder="Select end date" />
                                </Field>
                            )}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner /> : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EducationDialog