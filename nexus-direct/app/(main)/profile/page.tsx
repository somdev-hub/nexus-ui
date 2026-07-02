"use client"

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUp, Plus, SquareArrowOutUpRight, UserRoundPen } from 'lucide-react';
import { useRouter } from 'next/dist/client/components/navigation';
import Image from 'next/image';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { useEffect, useState } from 'react';
import EducationDialog from '@/components/education-dialog';
import ExperienceDialog from '@/components/experience-dialog';
import SkillDialog from '@/components/skill-dialog';
import { Applicant } from '@/types';
import { getApplicant } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';

type PageKey = "Profile Info" | "Jobs Applied" | "Resume" | "Shipping Partner" | "Jobs Rejected";

const ProfileInfo = ({ userId }: { userId: string | undefined }) => {
    const [applicant, setApplicant] = useState<Applicant | null>(null);
    const [loading, setLoading] = useState(true);

    const [openEducationDialog, setOpenEducationDialog] = useState(false);
    const [openExperienceDialog, setOpenExperienceDialog] = useState(false);
    const [openSkillDialog, setOpenSkillDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchApplicantData = async () => {
            try {
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
        };

        fetchApplicantData();
    }, [toast, userId]);

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
            {/* Personal Information */}
            <section>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-medium text-lg">Personal Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{applicant ? `${applicant.applicantFirstName} ${applicant.applicantLastName}` : "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantEmail : "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantPhone : "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="text-sm font-medium">{applicant ? `${applicant.applicantAddress}, ${applicant.applicantCity}, ${applicant.applicantState}, ${applicant.applicantCountry} - ${applicant.applicantPinCode}` : "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantDateOfBirth : "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantAge : "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="text-sm font-medium">{applicant ? applicant.applicantGender : "—"}</p>
                    </div>
                </div>
            </section>

            {/* Education */}
            <section>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-medium text-lg">Education</h4>
                    <Button variant="outline" size="sm" onClick={() => setOpenEducationDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
                <div className="space-y-4">
                    {applicant && applicant.applicantEducations.length > 0 ? (
                        <div className="space-y-4">
                            {applicant.applicantEducations.map((education) => (
                                <div key={education.applicantEducationId} className="flex items-start justify-between p-4 rounded-lg border bg-card">
                                    <div className="space-y-1">
                                        <h5 className="font-medium">{education.degree}</h5>
                                        <p className="text-sm text-muted-foreground">{education.institute}</p>
                                        <p className="text-sm text-muted-foreground">{education.city}, {education.state}, {education.country}</p>
                                    </div>
                                    <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                                        {new Date(education.startDate).getMonth() + 1}/{new Date(education.startDate).getFullYear()} - {new Date(education.endDate).getMonth() + 1}/{new Date(education.endDate).getFullYear()}
                                    </span>
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
                    <h4 className="font-medium text-lg">Work Experience</h4>
                    <Button variant="outline" size="sm" onClick={() => setOpenExperienceDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
                <div className="space-y-4">
                    {applicant && applicant.applicantExperiences.length > 0 ? (
                        <div className="space-y-4">
                            {applicant.applicantExperiences.map((experience) => (
                                <div key={experience.applicantExperienceId} className="flex items-start justify-between p-4 rounded-lg border bg-card">
                                    <div className="space-y-1">
                                        <h5 className="font-medium">{experience.jobTitle}</h5>
                                        <p className="text-sm text-muted-foreground">{experience.previousCompany}</p>
                                    </div>
                                    <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                                        {new Date(experience.startDate).getMonth() + 1}/{new Date(experience.startDate).getFullYear()} - {new Date(experience.endDate).getMonth() + 1}/{new Date(experience.endDate).getFullYear()}
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
                    <h4 className="font-medium text-lg">Skills</h4>
                    <Button variant="outline" size="sm" onClick={() => setOpenSkillDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
                <div>
                    {applicant && applicant.applicantSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {applicant.applicantSkills.map((skill) => (
                                <Badge key={skill.applicantSkillId} variant="secondary" className="px-3 py-1 text-sm">
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
            <EducationDialog open={openEducationDialog} onOpenChange={setOpenEducationDialog} />
            <ExperienceDialog open={openExperienceDialog} onOpenChange={setOpenExperienceDialog} />
            <SkillDialog open={openSkillDialog} onOpenChange={setOpenSkillDialog} />
        </div>
    );
};

const Resume = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h4 className="font-medium text-lg">Resume</h4>
            </div>
            <div className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                <FileUp className="h-5 w-5 mr-2" />
                Upload Resume
            </div>
        </div>
    );
}

const JobsApplied = ({ appliedJobs, navigator }: { appliedJobs: any[], navigator: any }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h4 className="font-medium text-lg">Applied Jobs</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {appliedJobs.map((job, index) => (
                    <Card
                        className={`p-4 ${job.status === "Rejected" ? "bg-red-50" : job.status === "Offer Received" ? "bg-green-50" : ""} hover:cursor-pointer hover:transform hover:scale-105 duration-300`}
                        key={index}
                        onClick={() => navigator.push(`/recruitment/${index}`)}
                    >
                        <CardContent className="p-0">
                            <div className="flex justify-between items-center border-b pb-2 mb-2">
                                <div>
                                    <h4 className="font-medium">{job.position}</h4>
                                    <p className="text-sm text-muted-foreground">{job.company}</p>
                                </div>
                                <SquareArrowOutUpRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <ul className="flex flex-col gap-2 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-muted-foreground">Applied on:</span>
                                    <span>{job.appliedOn}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant={job.status === "Rejected" ? "destructive" : job.status === "Offer Received" ? "default" : "secondary"}>
                                        {job.status}
                                    </Badge>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-muted-foreground">Location:</span>
                                    <span>{job.location}</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const NAV_ITEMS: PageKey[] = [
    "Profile Info",
    "Jobs Applied",
    "Resume",
    "Shipping Partner",
    "Jobs Rejected"
];

const Profile = () => {
    const navigator = useRouter();
    const { personalEmail, name, avatar, role, userId } = useUserMetadata();
    const [activePage, setActivePage] = useState<PageKey>("Jobs Applied");

    const appliedJobs = [
        { company: "Cosmos Ltd.", position: "Software Engineer", appliedOn: "12th Jun 2026", status: "Under Review", location: "San Francisco, CA" },
        { company: "Nebula Inc.", position: "Frontend Developer", appliedOn: "5th May 2026", status: "Rejected", location: "New York, NY" },
        { company: "Stellar Solutions", position: "Data Scientist", appliedOn: "20th Apr 2026", status: "Interview Scheduled", location: "Remote" },
        { company: "Galactic Tech", position: "Product Manager", appliedOn: "15th Mar 2026", status: "Offer Received", location: "Austin, TX" },
    ];

    const renderPage = () => {
        switch (activePage) {
            case "Profile Info": return <ProfileInfo userId={userId} />;
            case "Jobs Applied": return <JobsApplied appliedJobs={appliedJobs} navigator={navigator} />;
            case "Resume": return <Resume />;
            case "Shipping Partner": return <div>Shipping Partner</div>;
            case "Jobs Rejected": return <div>Jobs Rejected</div>;
            default: return null;
        }
    };

    return (
        <div className="my-8">
            <Card className="p-4 gap-2 min-h-[calc(100vh-9rem)]">
                <CardContent className="p-0">
                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-4 border-b">
                        <div className="flex gap-4 items-center">
                            <div className="rounded-full overflow-hidden">
                                <Image
                                    src={avatar ?? "https://github.com/shadcn.png"}
                                    alt={name ?? "User Avatar"}
                                    width={60}
                                    height={60}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-2 items-center">
                                    <h2 className="text-xl font-bold">{name ?? "User Name"}</h2>
                                    <Badge className="bg-blue-100 text-blue-800">
                                        {role ?? "User"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {personalEmail ?? "user@example.com"}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline">
                            <UserRoundPen />
                            Edit Profile
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="flex mt-4">
                        {/* Sidebar */}
                        <div className="w-1/7 p-4 border-r-2 border-solid border-gray-200">
                            <ul className="flex flex-col gap-2 text-sm">
                                {NAV_ITEMS.map((key) => (
                                    <li
                                        key={key}
                                        onClick={() => setActivePage(key)}
                                        className={`cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 ${activePage === key ? "bg-gray-100 font-medium" : ""}`}
                                    >
                                        {key}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Content */}
                        <div className="w-6/7 p-4">
                            {renderPage()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile;