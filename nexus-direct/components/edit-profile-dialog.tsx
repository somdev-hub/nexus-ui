import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Applicant } from "@/types";
import { z } from 'zod';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './ui/input';
import { Field, FieldLabel } from './ui/field';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { DatePicker } from './ui/date-picker';
import { Trash2 } from 'lucide-react';
import { Textarea } from './ui/textarea';

const applicantSchema = z.object({
    applicantFirstName: z.string().min(1, { message: "First name is required" }),
    applicantLastName: z.string().min(1, { message: "Last name is required" }),
    applicantEmail: z.email({ message: "Invalid email address" }),
    applicantPhone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
    applicantGender: z.string().optional(),
    applicantDateOfBirth: z.string().optional(),
    applicantAge: z.number().min(0, { message: "Age must be a positive number" }).optional(),
    applicantAddress: z.string().optional(),
    applicantCity: z.string().optional(),
    applicantState: z.string().optional(),
    applicantCountry: z.string().optional(),
    applicantPinCode: z.string().optional(),
    applicantEducations: z.array(z.object({
        applicantEducationId: z.number().optional(),
        institute: z.string().min(1, { message: "Institute is required" }),
        degree: z.string().min(1, { message: "Degree is required" }),
        city: z.string().min(1, { message: "City is required" }),
        state: z.string().min(1, { message: "State is required" }),
        country: z.string().min(1, { message: "Country is required" }),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    })).optional(),
    applicantExperiences: z.array(z.object({
        applicantExperienceId: z.number().optional(),
        previousCompany: z.string().min(1, { message: "Company is required" }),
        jobTitle: z.string().min(1, { message: "Job title is required" }),
        yearsOfExperience: z.number().min(0, { message: "Years of experience must be positive" }).optional(),
        jobDescription: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    })).optional(),
    applicantSkills: z.array(z.object({
        applicantSkillId: z.number().optional(),
        skillName: z.string().min(1, { message: "Skill name is required" }),
    })).optional(),
});

type ApplicantFormData = z.infer<typeof applicantSchema>;

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicant: Applicant;
    onProfileUpdated?: (updated: Applicant) => void;
}

const EditProfileDialog = ({ open, onOpenChange, applicant, onProfileUpdated }: EditProfileDialogProps) => {
    const { control, handleSubmit, formState: { errors } } = useForm<ApplicantFormData>({
        resolver: zodResolver(applicantSchema),
        defaultValues: {
            applicantFirstName: applicant.applicantFirstName || '',
            applicantLastName: applicant.applicantLastName || '',
            applicantEmail: applicant.applicantEmail || '',
            applicantPhone: applicant.applicantPhone || '',
            applicantGender: applicant.applicantGender || '',
            applicantDateOfBirth: applicant.applicantDateOfBirth || '',
            applicantAge: applicant.applicantAge || 0,
            applicantAddress: applicant.applicantAddress || '',
            applicantCity: applicant.applicantCity || '',
            applicantState: applicant.applicantState || '',
            applicantCountry: applicant.applicantCountry || '',
            applicantPinCode: applicant.applicantPinCode || '',
            applicantEducations: applicant.applicantEducations?.map(e => ({
                applicantEducationId: e.applicantEducationId,
                institute: e.institute,
                degree: e.degree,
                city: e.city,
                state: e.state,
                country: e.country,
                startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '',
                endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : '',
            })) || [],
            applicantExperiences: applicant.applicantExperiences?.map(e => ({
                applicantExperienceId: e.applicantExperienceId,
                previousCompany: e.previousCompany,
                jobTitle: e.jobTitle,
                yearsOfExperience: e.yearsOfExperience,
                jobDescription: e.jobDescription,
                startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '',
                endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : '',
            })) || [],
            applicantSkills: applicant.applicantSkills?.map(s => ({
                applicantSkillId: s.applicantSkillId,
                skillName: s.skillName,
            })) || [],
        }
    });

    const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
        control,
        name: 'applicantEducations',
    });

    const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
        control,
        name: 'applicantExperiences',
    });

    const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
        control,
        name: 'applicantSkills',
    });

    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const onSubmit = async (data: ApplicantFormData) => {
        setLoading(true);
        try {
            const updatedApplicant: Applicant = {
                ...applicant,
                applicantFirstName: data.applicantFirstName,
                applicantLastName: data.applicantLastName,
                applicantEmail: data.applicantEmail,
                applicantPhone: data.applicantPhone,
                applicantGender: data.applicantGender || '',
                applicantDateOfBirth: data.applicantDateOfBirth || '',
                applicantAge: data.applicantAge || 0,
                applicantAddress: data.applicantAddress || '',
                applicantCity: data.applicantCity || '',
                applicantState: data.applicantState || '',
                applicantCountry: data.applicantCountry || '',
                applicantPinCode: data.applicantPinCode || '',
                applicantEducations: data.applicantEducations?.map(e => ({
                    applicantEducationId: e.applicantEducationId,
                    institute: e.institute,
                    degree: e.degree,
                    city: e.city,
                    state: e.state,
                    country: e.country,
                    startDate: e.startDate ? new Date(e.startDate) : new Date(),
                    endDate: e.endDate ? new Date(e.endDate) : new Date(),
                })) || [],
                applicantExperiences: data.applicantExperiences?.map(e => ({
                    applicantExperienceId: e.applicantExperienceId,
                    previousCompany: e.previousCompany,
                    jobTitle: e.jobTitle,
                    yearsOfExperience: e.yearsOfExperience || 0,
                    jobDescription: e.jobDescription || '',
                    startDate: e.startDate ? new Date(e.startDate) : new Date(),
                    endDate: e.endDate ? new Date(e.endDate) : new Date(),
                })) || [],
                applicantSkills: data.applicantSkills?.map(s => ({
                    applicantSkillId: s.applicantSkillId,
                    skillName: s.skillName,
                })) || [],
            };
            const response = await apiClient.put<Applicant>(
                `/iam/recruitment/applicant/${applicant.applicantId}`,
                updatedApplicant
            );
            if (response.status !== 200) {
                throw new Error("Failed to update profile");
            }
            toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
            });
            onProfileUpdated?.(updatedApplicant);
            onOpenChange(false);
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: (error as Error).message || "An error occurred while updating your profile.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information here. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                                name="applicantFirstName"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>First Name *</FieldLabel>
                                        <Input {...field} placeholder="Enter your first name" />
                                        {errors.applicantFirstName && (
                                            <p className="text-sm text-destructive">{errors.applicantFirstName.message}</p>
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantLastName"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Last Name *</FieldLabel>
                                        <Input {...field} placeholder="Enter your last name" />
                                        {errors.applicantLastName && (
                                            <p className="text-sm text-destructive">{errors.applicantLastName.message}</p>
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantEmail"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Email *</FieldLabel>
                                        <Input {...field} type="email" placeholder="Enter your email" />
                                        {errors.applicantEmail && (
                                            <p className="text-sm text-destructive">{errors.applicantEmail.message}</p>
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantPhone"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Phone *</FieldLabel>
                                        <Input {...field} type="tel" placeholder="Enter your phone number" />
                                        {errors.applicantPhone && (
                                            <p className="text-sm text-destructive">{errors.applicantPhone.message}</p>
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantGender"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Gender</FieldLabel>
                                        <Input {...field} placeholder="Enter your gender" />
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantDateOfBirth"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Date of Birth</FieldLabel>
                                        <Input {...field} type="date" />
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantAge"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Age</FieldLabel>
                                        <Input
                                            type="number"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            placeholder="Enter your age"
                                        />
                                        {errors.applicantAge && (
                                            <p className="text-sm text-destructive">{errors.applicantAge.message}</p>
                                        )}
                                    </Field>
                                )}
                            />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                                name="applicantAddress"
                                control={control}
                                render={({ field }) => (
                                    <Field className="md:col-span-2">
                                        <FieldLabel>Address</FieldLabel>
                                        <Input {...field} placeholder="Enter your address" />
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantCity"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>City</FieldLabel>
                                        <Input {...field} placeholder="Enter your city" />
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantState"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>State</FieldLabel>
                                        <Input {...field} placeholder="Enter your state" />
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantCountry"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Country</FieldLabel>
                                        <Input {...field} placeholder="Enter your country" />
                                    </Field>
                                )}
                            />
                            <Controller
                                name="applicantPinCode"
                                control={control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Pin Code</FieldLabel>
                                        <Input {...field} placeholder="Enter your pin code" />
                                    </Field>
                                )}
                            />
                        </div>
                    </div>

                    {/* Education */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Education</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendEducation({
                                institute: '',
                                degree: '',
                                city: '',
                                state: '',
                                country: '',
                                startDate: '',
                                endDate: '',
                            })}>
                                Add Education
                            </Button>
                        </div>
                        {educationFields.map((field, index) => (
                            <div key={field.id} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Education #{index + 1}</h4>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(index)} className="text-destructive hover:text-destructive">
                                        <Trash2 />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Controller
                                        name={`applicantEducations.${index}.institute`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Institute *</FieldLabel>
                                                <Input {...field} placeholder="Enter institute name" />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantEducations.${index}.degree`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Degree *</FieldLabel>
                                                <Input {...field} placeholder="Enter degree" />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantEducations.${index}.city`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>City *</FieldLabel>
                                                <Input {...field} placeholder="Enter city" />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantEducations.${index}.state`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>State *</FieldLabel>
                                                <Input {...field} placeholder="Enter state" />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantEducations.${index}.country`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Country *</FieldLabel>
                                                <Input {...field} placeholder="Enter country" />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantEducations.${index}.startDate`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Start Date</FieldLabel>
                                                <DatePicker
                                                    date={field.value ? new Date(field.value) : undefined}
                                                    onDateChange={field.onChange}
                                                />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantEducations.${index}.endDate`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>End Date</FieldLabel>
                                                <DatePicker
                                                    date={field.value ? new Date(field.value) : undefined}
                                                    onDateChange={field.onChange}
                                                />
                                            </Field>
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                        {educationFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No education records added yet.</p>
                        )}
                    </div>

                    {/* Experience */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Experience</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendExperience({
                                previousCompany: '',
                                jobTitle: '',
                                yearsOfExperience: 0,
                                jobDescription: '',
                                startDate: '',
                                endDate: '',
                            })}>
                                Add Experience
                            </Button>
                        </div>
                        {experienceFields.map((field, index) => (
                            <div key={field.id} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Experience #{index + 1}</h4>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeExperience(index)} className="text-destructive hover:text-destructive">
                                        <Trash2 />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Controller
                                        name={`applicantExperiences.${index}.previousCompany`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Company *</FieldLabel>
                                                <Input {...field} placeholder="Enter company name" />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantExperiences.${index}.jobTitle`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Job Title *</FieldLabel>
                                                <Input {...field} placeholder="Enter job title" />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantExperiences.${index}.yearsOfExperience`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Years of Experience</FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                                    placeholder="Enter years"
                                                />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantExperiences.${index}.startDate`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Start Date</FieldLabel>
                                                <DatePicker
                                                    date={field.value ? new Date(field.value) : undefined}
                                                    onDateChange={field.onChange}
                                                />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantExperiences.${index}.endDate`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>End Date</FieldLabel>
                                                <DatePicker
                                                    date={field.value ? new Date(field.value) : undefined}
                                                    onDateChange={field.onChange}
                                                />
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name={`applicantExperiences.${index}.jobDescription`}
                                        control={control}
                                        render={({ field }) => (
                                            <Field className="md:col-span-2">
                                                <FieldLabel>Job Description</FieldLabel>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Enter job description"
                                                />
                                            </Field>
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                        {experienceFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No experience records added yet.</p>
                        )}
                    </div>

                    {/* Skills */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Skills</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendSkill({ skillName: '' })}>
                                Add Skill
                            </Button>
                        </div>
                        {skillFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
                                <Controller
                                    name={`applicantSkills.${index}.skillName`}
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} placeholder="Enter skill name" className="flex-1" />
                                    )}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(index)} className="text-destructive hover:text-destructive">
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                        {skillFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No skills added yet.</p>
                        )}
                    </div>

                    {/* Actions */}
                    <DialogFooter className="w-full">
                        <div className="flex justify-end gap-3 pt-4 w-full border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Spinner className="mr-2" /> : null}
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditProfileDialog