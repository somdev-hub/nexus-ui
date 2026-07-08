"use client"

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Camera, FileUp, Plus, SquareArrowOutUpRight, UserRoundPen, CheckCircle2, Circle, Clock, XCircle, Briefcase, GraduationCap, Award, MapPin, Mail, Phone, Calendar, User, Building2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useCallback, useEffect, useState } from 'react';
import EducationDialog from '@/components/education-dialog';
import ExperienceDialog from '@/components/experience-dialog';
import SkillDialog from '@/components/skill-dialog';
import { Applicant } from '@/types';
import { getApplicant } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';
import EditProfileDialog from '@/components/edit-profile-dialog';

type PageKey = "Profile Info" | "Jobs Applied" | "Resume" | "Jobs Rejected";

const ProfileInfo = ({ userId, editProfileDialogOpen, setEditProfileDialogOpen }: { userId: string | undefined; editProfileDialogOpen: boolean; setEditProfileDialogOpen: (open: boolean) => void }) => {
    const [applicant, setApplicant] = useState<Applicant | null>(null);
    const [loading, setLoading] = useState(true);

    const [openEducationDialog, setOpenEducationDialog] = useState(false);
    const [openExperienceDialog, setOpenExperienceDialog] = useState(false);
    const [openSkillDialog, setOpenSkillDialog] = useState(false);
    const { toast } = useToast();

    const fetchApplicantData = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await getApplicant(Number(userId));
            setApplicant(response);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch applicant data.",
                variant: "destructive",
            });
            console.error("Error fetching applicant data:", error);
        } finally {
            setLoading(false);
        }
    }, [toast, userId]);

    useEffect(() => {
        fetchApplicantData(); // eslint-disable-line react-hooks/set-state-in-effect
    }, [fetchApplicantData]);

    // Compute profile completion percentage
    const computeCompletion = (): number => {
        if (!applicant) return 0;
        const fields = [
            applicant.applicantFirstName,
            applicant.applicantLastName,
            applicant.applicantEmail,
            applicant.applicantPhone,
            applicant.applicantAddress,
            applicant.applicantCity,
            applicant.applicantState,
            applicant.applicantCountry,
            applicant.applicantDateOfBirth,
            applicant.applicantGender,
        ];
        const filled = fields.filter(f => f && f.toString().trim() !== '').length;
        const hasEducation = applicant.applicantEducations?.length > 0;
        const hasExperience = applicant.applicantExperiences?.length > 0;
        const hasSkills = applicant.applicantSkills?.length > 0;
        const bonus = (hasEducation ? 1 : 0) + (hasExperience ? 1 : 0) + (hasSkills ? 1 : 0);
        return Math.round(((filled + bonus) / (fields.length + 3)) * 100);
    };

    const completionPercent = computeCompletion();

    if (loading) {
        return (
            <div className="space-y-8">
                <section>
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-20 w-full" />
                </section>
                <section>
                    <Skeleton className="h-6 w-40 mb-4" />
                    <Skeleton className="h-20 w-full" />
                </section>
                <section>
                    <Skeleton className="h-6 w-24 mb-4" />
                    <Skeleton className="h-12 w-full" />
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Profile Completion */}
            <section className="p-4 rounded-lg border bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Profile Completion</h4>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                    {completionPercent < 50
                        ? "Your profile is incomplete. Fill in your details to stand out to recruiters."
                        : completionPercent < 80
                            ? "Almost there! Add more details to complete your profile."
                            : "Great job! Your profile is well-rounded."}
                </p>
            </section>

            {/* Personal Information */}
            <section>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-medium text-lg flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Personal Information
                    </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Full Name</p>
                        <p className="text-sm font-medium">{applicant ? `${applicant.applicantFirstName} ${applicant.applicantLastName}` : "—"}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                        <p className="text-sm font-medium truncate">{applicant ? applicant.applicantEmail : "—"}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantPhone : "—"}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</p>
                        <p className="text-sm font-medium">{applicant ? `${applicant.applicantAddress}, ${applicant.applicantCity}, ${applicant.applicantState}, ${applicant.applicantCountry} - ${applicant.applicantPinCode}` : "—"}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date of Birth</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantDateOfBirth : "—"}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Age</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantAge : "—"}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Gender</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantGender : "—"}</p>
                    </div>
                </div>
            </section>

            {/* Education */}
            <section>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-medium text-lg flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        Education
                    </h4>
                    <Button variant="outline" size="sm" onClick={() => setOpenEducationDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
                <div className="space-y-4">
                    {applicant && applicant.applicantEducations?.length > 0 ? (
                        <div className="space-y-3">
                            {applicant.applicantEducations.map((education) => (
                                <div key={education.applicantEducationId} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow group">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="font-medium">{education.degree}</h5>
                                            <p className="text-sm text-muted-foreground">{education.institute}</p>
                                            <p className="text-xs text-muted-foreground">{education.city}, {education.state}, {education.country}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">
                                            {new Date(education.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(education.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className="flex w-full items-center justify-center rounded-lg border border-dashed p-8 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            onClick={() => setOpenEducationDialog(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Education
                        </div>
                    )}
                </div>
            </section>

            {/* Work Experience */}
            <section>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-medium text-lg flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Work Experience
                    </h4>
                    <Button variant="outline" size="sm" onClick={() => setOpenExperienceDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
                <div className="space-y-4">
                    {applicant && applicant.applicantExperiences?.length > 0 ? (
                        <div className="space-y-3">
                            {applicant.applicantExperiences.map((experience) => (
                                <div key={experience.applicantExperienceId} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow group">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="font-medium">{experience.jobTitle}</h5>
                                            <p className="text-sm text-muted-foreground">{experience.previousCompany}</p>
                                            {experience.jobDescription && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{experience.jobDescription}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">
                                        {new Date(experience.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(experience.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className="flex w-full items-center justify-center rounded-lg border border-dashed p-8 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            onClick={() => setOpenExperienceDialog(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Experience
                        </div>
                    )}
                </div>
            </section>

            {/* Skills */}
            <section>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-medium text-lg flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        Skills
                    </h4>
                    <Button variant="outline" size="sm" onClick={() => setOpenSkillDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
                <div>
                    {applicant && applicant.applicantSkills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {applicant.applicantSkills.map((skill) => (
                                <Badge key={skill.applicantSkillId} variant="secondary" className="px-3 py-1.5 text-sm hover:bg-secondary/80 transition-colors">
                                    {skill.skillName}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <div
                            className="flex w-full items-center justify-center rounded-lg border border-dashed p-8 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            onClick={() => setOpenSkillDialog(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Skill
                        </div>
                    )}
                </div>
            </section>

            {/* Dialogs */}
            <EducationDialog open={openEducationDialog} onOpenChange={setOpenEducationDialog} onSuccess={fetchApplicantData} />
            <ExperienceDialog open={openExperienceDialog} onOpenChange={setOpenExperienceDialog} onSuccess={fetchApplicantData} />
            <SkillDialog open={openSkillDialog} onOpenChange={setOpenSkillDialog} onSuccess={fetchApplicantData} />
            {applicant && (
                <EditProfileDialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen} applicant={applicant} onSuccess={fetchApplicantData} />
            )}
        </div>
    );
};

const Resume = ({ applicant }: { applicant: Applicant | null }) => {
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    const { userId } = useUserMetadata();

    const documents = applicant?.applicantDocuments?.filter(d => d.hrDocumentType === 'RESUME') || [];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Resume must be under 5MB.", variant: "destructive" });
            return;
        }
        setUploading(true);
        try {
            // Simulated upload — replace with actual API call when available
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast({ title: "Resume Uploaded", description: "Your resume has been uploaded successfully." });
        } catch {
            toast({ title: "Upload Failed", description: "Could not upload resume. Please try again.", variant: "destructive" });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h4 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Resume
                </h4>
            </div>

            {documents.length > 0 ? (
                <div className="space-y-3">
                    {documents.map((doc) => (
                        <div key={doc.hrDocumentId} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{doc.documentName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Uploaded {doc.createdOn ? new Date(doc.createdOn).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                                    <SquareArrowOutUpRight className="h-4 w-4 mr-1" />
                                    View
                                </a>
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                    No resume uploaded yet.
                </div>
            )}

            <label className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                {uploading ? (
                    <span className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full animate-spin border-2 border-t-transparent border-muted-foreground" />
                        Uploading...
                    </span>
                ) : (
                    <>
                        <FileUp className="h-5 w-5 mr-2" />
                        {documents.length > 0 ? 'Upload New Resume' : 'Upload Resume'}
                    </>
                )}
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
            <p className="text-xs text-muted-foreground text-center">PDF only, max 5MB</p>
        </div>
    );
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; bgClass: string }> = {
    "Under Review": { variant: "secondary", icon: <Clock className="h-3 w-3" />, bgClass: "bg-yellow-50 dark:bg-yellow-950/20" },
    "Interview Scheduled": { variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, bgClass: "bg-blue-50 dark:bg-blue-950/20" },
    "Offer Received": { variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, bgClass: "bg-green-50 dark:bg-green-950/20" },
    "Rejected": { variant: "destructive", icon: <XCircle className="h-3 w-3" />, bgClass: "bg-red-50 dark:bg-red-950/20" },
};

const JobCard = ({ job, index, navigator }: { job: any; index: number; navigator: any }) => {
    const config = statusConfig[job.status] || { variant: "secondary" as const, icon: <Circle className="h-3 w-3" />, bgClass: "" };
    return (
        <Card
            className={`p-4 ${config.bgClass} hover:cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            onClick={() => navigator.push(`/recruitment/${index}`)}
        >
            <CardContent className="p-0">
                <div className="flex justify-between items-start border-b pb-3 mb-3">
                    <div>
                        <h4 className="font-medium text-sm">{job.position}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3" />
                            {job.company}
                        </p>
                    </div>
                    <SquareArrowOutUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                <ul className="flex flex-col gap-2 text-xs">
                    <li className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Applied</span>
                        <span className="font-medium">{job.appliedOn}</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={config.variant} className="gap-1 text-xs">
                            {config.icon}
                            {job.status}
                        </Badge>
                    </li>
                    <li className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
                        <span className="font-medium truncate max-w-30">{job.location}</span>
                    </li>
                </ul>
            </CardContent>
        </Card>
    );
};

const JobsApplied = ({ appliedJobs, navigator }: { appliedJobs: any[]; navigator: any }) => {
    const activeJobs = appliedJobs.filter(j => j.status !== "Rejected");
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h4 className="font-medium text-lg flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Applied Jobs
                    <Badge variant="secondary" className="ml-1 text-xs">{activeJobs.length}</Badge>
                </h4>
            </div>
            {activeJobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeJobs.map((job, index) => (
                        <JobCard key={index} job={job} index={index} navigator={navigator} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">No active applications</p>
                    <p className="text-xs text-muted-foreground mt-1">Start applying to jobs to see them here.</p>
                </div>
            )}
        </div>
    );
};

const JobsRejected = ({ appliedJobs, navigator }: { appliedJobs: any[]; navigator: any }) => {
    const rejectedJobs = appliedJobs.filter(j => j.status === "Rejected");
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h4 className="font-medium text-lg flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    Rejected Applications
                    <Badge variant="outline" className="ml-1 text-xs">{rejectedJobs.length}</Badge>
                </h4>
            </div>
            {rejectedJobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rejectedJobs.map((job, index) => (
                        <JobCard key={index} job={job} index={index} navigator={navigator} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-300 dark:text-green-700 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">No rejected applications</p>
                    <p className="text-xs text-muted-foreground mt-1">That&apos;s great news! Keep up the good work.</p>
                </div>
            )}
        </div>
    );
};

const NAV_ITEMS: { key: PageKey; icon: React.ReactNode; label: string }[] = [
    { key: "Profile Info", icon: <User className="h-4 w-4" />, label: "Profile Info" },
    { key: "Jobs Applied", icon: <Briefcase className="h-4 w-4" />, label: "Jobs Applied" },
    { key: "Resume", icon: <FileText className="h-4 w-4" />, label: "Resume" },
    { key: "Jobs Rejected", icon: <XCircle className="h-4 w-4" />, label: "Rejected" },
];

const Profile = () => {
    const navigator = useRouter();
    const { personalEmail, name, avatar, role, userId } = useUserMetadata();
    const [activePage, setActivePage] = useState<PageKey>("Profile Info");
    const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
    const [applicant, setApplicant] = useState<Applicant | null>(null);

    // Fetch applicant once at top level so Resume can use it
    useEffect(() => {
        if (!userId) return;
        getApplicant(Number(userId))
            .then(setApplicant)
            .catch(console.error);
    }, [userId]);

    const appliedJobs = [
        { company: "Cosmos Ltd.", position: "Software Engineer", appliedOn: "12th Jun 2026", status: "Under Review", location: "San Francisco, CA" },
        { company: "Nebula Inc.", position: "Frontend Developer", appliedOn: "5th May 2026", status: "Rejected", location: "New York, NY" },
        { company: "Stellar Solutions", position: "Data Scientist", appliedOn: "20th Apr 2026", status: "Interview Scheduled", location: "Remote" },
        { company: "Galactic Tech", position: "Product Manager", appliedOn: "15th Mar 2026", status: "Offer Received", location: "Austin, TX" },
        { company: "Quantum Dynamics", position: "Backend Engineer", appliedOn: "1st Feb 2026", status: "Rejected", location: "Chicago, IL" },
    ];

    const renderPage = () => {
        switch (activePage) {
            case "Profile Info": return <ProfileInfo userId={userId} editProfileDialogOpen={editProfileDialogOpen} setEditProfileDialogOpen={setEditProfileDialogOpen} />;
            case "Jobs Applied": return <JobsApplied appliedJobs={appliedJobs} navigator={navigator} />;
            case "Resume": return <Resume applicant={applicant} />;
            case "Jobs Rejected": return <JobsRejected appliedJobs={appliedJobs} navigator={navigator} />;
            default: return null;
        }
    };

    return (
        <div className="my-8 h-[calc(100vh-9rem)]">
            <Card className="p-0 gap-2 h-full overflow-hidden flex flex-col">
                <CardContent className="p-0 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 border-b bg-gradient-to-r from-muted/30 to-background flex-shrink-0">
                        <div className="flex gap-4 items-center">
                            <div className="rounded-full overflow-hidden ring-2 ring-border ring-offset-2 ring-offset-background">
                                <div className="relative flex items-center justify-center group hover:cursor-pointer">
                                    <Image
                                        src={avatar ?? "https://github.com/shadcn.png"}
                                        alt={name ?? "User Avatar"}
                                        width={64}
                                        height={64}
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 group-hover:flex hidden items-center justify-center bg-black/40 text-white rounded-full transition-all">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex gap-2 items-center flex-wrap">
                                    <h2 className="text-xl font-bold">{name ?? "User Name"}</h2>
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                        {role ?? "User"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {personalEmail ?? "user@example.com"}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setEditProfileDialogOpen(true)} className="flex-shrink-0">
                            <UserRoundPen className="h-4 w-4 mr-1" />
                            Edit Profile
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col md:flex-row flex-1 min-h-0">
                        {/* Sidebar */}
                        <div className="md:w-1/5 lg:w-1/6 p-4 border-r border-border bg-muted/20 flex-shrink-0 h-full">
                            <ul className="flex flex-col gap-1 text-sm h-full">
                                {NAV_ITEMS.map((item) => (
                                    <li
                                        key={item.key}
                                        onClick={() => setActivePage(item.key)}
                                        className={`cursor-pointer px-3 py-2.5 rounded-md flex items-center gap-2.5 transition-all duration-150
                                            ${activePage === item.key
                                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 h-full min-h-0 overflow-auto">
                            {renderPage()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile;