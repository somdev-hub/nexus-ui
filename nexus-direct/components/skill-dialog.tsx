import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Field, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { ApplicantSkill } from '@/types';
import { addApplicantSkill } from '@/lib/auth-service';
import { useUserMetadata } from '@/hooks/use-user-metadata';



const applicantSkillSchema = z.object({
    skillName: z.string().min(1, { message: "Skill name is required" }),
});

const SkillDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { control, handleSubmit } = useForm<ApplicantSkill>({
        resolver: zodResolver(applicantSkillSchema),
        defaultValues: {
            skillName: "",
        }
    });
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const { userId } = useUserMetadata(); // Assuming you have a hook to get user metadata

    const onSubmit = async (data: ApplicantSkill) => {
        setLoading(true);
        try {
            const response = await addApplicantSkill(data, Number(userId)); // Pass userId to the function
            if (response.status !== 200) {
                throw new Error("Failed to add skill");
            }
            toast({
                title: "Skill Added",
                description: "Your skill has been added successfully.",
            });
            onOpenChange(false);
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: (error as Error).message || "An error occurred while adding your skill.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Add Skill
                    </DialogTitle>
                    <DialogDescription>
                        Enter the name of the skill you want to add.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                    <Controller
                        name="skillName"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Skill Name</FieldLabel>
                                <Input {...field} placeholder="Enter skill name" />
                                {fieldState.error && (
                                    <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                                )}
                            </Field>
                        )}
                    />
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

export default SkillDialog