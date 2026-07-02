import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Field, FieldLabel } from './ui/field';
import { Button } from './ui/button';
import { DatePicker } from './ui/date-picker';
import { Spinner } from './ui/spinner';
import { Textarea } from './ui/textarea';
import { ApplicantExperience } from '@/types';
import { addApplicantExperience } from '@/lib/auth-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';



const applicantExperienceSchema = z.object({
    previousCompany: z.string().min(1, { message: "Previous company is required" }),
    jobTitle: z.string().min(1, { message: "Job title is required" }),
    yearsOfExperience: z.float64().min(0, { message: "Years of experience must be a positive number" }),
    jobDescription: z.string().min(1, { message: "Job description is required" }),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date({ message: "End date is required" }),
});


const ExperienceDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { control, handleSubmit } = useForm<ApplicantExperience>({
        resolver: zodResolver(applicantExperienceSchema),
        defaultValues: {
            previousCompany: "",
            jobTitle: "",
            yearsOfExperience: 0,
            jobDescription: "",
            startDate: new Date(),
            endDate: new Date(),
        }
    });

    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const { userId } = useUserMetadata(); // Assuming you have a hook to get user metadata
    const onSubmit = async (data: ApplicantExperience) => {
        setLoading(true);
        try {
            const response = await addApplicantExperience(data, Number(userId)); // Pass userId to the function
            if (response.status !== 200) {
                throw new Error("Failed to add experience details");
            }
            toast({
                title: "Experience Added",
                description: "Your experience details have been added successfully.",
            });
            onOpenChange(false);
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: (error as Error).message || "An error occurred while adding your experience details.",
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
                    <DialogTitle>
                        Add Experience
                    </DialogTitle>
                    <DialogDescription>
                        Add your work experience to showcase your professional background and skills. This information will help potential employers understand your career history and expertise.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Controller
                        name="jobTitle"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Job Title</FieldLabel>
                                <Input {...field} placeholder="Enter your job title" />
                                {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
                            </Field>
                        )}
                    />
                    <div className="flex gap-4 items-center justify-between">
                        <Controller
                            name="previousCompany"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Previous Company</FieldLabel>
                                    <Input {...field} placeholder="Enter your previous company name" />
                                    {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
                                </Field>
                            )}
                        />
                        <Controller
                            name="yearsOfExperience"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Years of Experience</FieldLabel>
                                    <Input
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        value={field.value}
                                        type="number" placeholder="Enter your years of experience" />
                                    {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
                                </Field>
                            )}
                        />
                    </div>
                    <Controller
                        name="jobDescription"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Job Description</FieldLabel>
                                {/* <Input {...field} placeholder="Enter your job description" /> */}
                                <Textarea {...field} placeholder="Enter your job description" />
                                {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
                            </Field>
                        )}
                    />
                    <div className="flex items-center justify-between gap-4">
                        <Controller
                            name="startDate"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Start Date</FieldLabel>
                                    <DatePicker
                                        date={field.value}
                                        onDateChange={field.onChange}
                                        placeholder="Select start date"
                                    />
                                    {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
                                </Field>
                            )}
                        />
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>End Date</FieldLabel>
                                    <DatePicker
                                        date={field.value}
                                        onDateChange={field.onChange}
                                        placeholder="Select end date"
                                    />
                                    {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
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

export default ExperienceDialog