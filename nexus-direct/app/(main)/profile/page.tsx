"use client"

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

type PageKey = "Profile Info" | "Jobs Applied" | "Resume" | "Shipping Partner" | "Jobs Rejected";

const ProfileInfo = ({ userId }: { userId: string }) => {
    const [applicant, setApplicant] = useState<Applicant | null>(null);

    const [openEducationDialog, setOpenEducationDialog] = useState(false);
    const [openExperienceDialog, setOpenExperienceDialog] = useState(false);
    const [openSkillDialog, setOpenSkillDialog] = useState(false);

    useEffect(()=>{
        const fetchApplicantData = async () => {
            try {
                const response = await getApplicant(Number(userId));
                setApplicant(response);
            } catch (error) {
                console.error("Error fetching applicant data:", error);
            }
        };

        fetchApplicantData();
    }, [userId]);

    return (
        <div>
            <h3 className="font-semibold">Profile Info</h3>
            <section className="mt-4">
                <h4 className="font-medium border-b-2 pb-2 mb-2">Education</h4>
                <div className="flex w-full bg-gray-100 rounded-full p-2 justify-center text-sm font-medium hover:cursor-pointer hover:bg-gray-200 duration-300 items-center gap-2 text-gray-700 hover:text-gray-900">
                    <Plus />
                    <span onClick={() => setOpenEducationDialog(true)}>Add Education</span>
                </div>
            </section>
            <section className="mt-4">
                <h4 className="font-medium border-b-2 pb-2 mb-2">Work Experience</h4>
                <div className="flex w-full bg-gray-100 rounded-full p-2 justify-center text-sm font-medium hover:cursor-pointer hover:bg-gray-200 duration-300 items-center gap-2 text-gray-700 hover:text-gray-900">
                    <Plus />
                    <span onClick={() => setOpenExperienceDialog(true)}>Add Experience</span>
                </div>
            </section>
            <section className="mt-4">
                <h4 className="font-medium border-b-2 pb-2 mb-2">Skills</h4>
                <div className="flex w-full bg-gray-100 rounded-full p-2 justify-center text-sm font-medium hover:cursor-pointer hover:bg-gray-200 duration-300 items-center gap-2 text-gray-700 hover:text-gray-900">
                    <Plus />
                    <span onClick={() => setOpenSkillDialog(true)}>Add Skill</span>
                </div>
            </section>

            {/* dialogs */}
            <EducationDialog open={openEducationDialog} onOpenChange={setOpenEducationDialog} />
            <ExperienceDialog open={openExperienceDialog} onOpenChange={setOpenExperienceDialog} />
            <SkillDialog open={openSkillDialog} onOpenChange={setOpenSkillDialog} />
        </div>
    );
};

const Resume = () => {
    return (
        <div>
            <h3 className="font-semibold">Resume</h3>
            <div className="mt-4 flex w-full border-2 border-dashed border-gray-300 rounded-lg p-8 justify-center text-sm font-medium hover:cursor-pointer hover:bg-gray-100 duration-300 items-center gap-2 text-gray-500 hover:text-gray-700">
                <FileUp className="w-5 h-5" />
                <span>Upload Resume</span>
            </div>
        </div>
    );
}

const JobsApplied = ({ appliedJobs, navigator }: { appliedJobs: any[], navigator: any }) => {
    return (
        <div>
            <h3 className="font-semibold">Applied Jobs</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                                    <p className="text-sm text-gray-500">{job.company}</p>
                                </div>
                                <SquareArrowOutUpRight className="w-4 h-4 text-gray-500" />
                            </div>
                            <ul className="flex flex-col gap-2 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Applied on:</span>
                                    <span>{job.appliedOn}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <Badge variant={job.status === "Rejected" ? "destructive" : job.status === "Offer Received" ? "default" : "secondary"}>
                                        {job.status}
                                    </Badge>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Location:</span>
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