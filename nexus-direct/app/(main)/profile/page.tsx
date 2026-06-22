"use client"

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SquareArrowOutUpRight, UserRoundPen } from 'lucide-react';
import { useRouter } from 'next/dist/client/components/navigation';
import Image from 'next/image';
import React from 'react'

const Profile = () => {
    const navigator = useRouter();
    const appliedJobs = [
        {
            company: "Cosmos Ltd.",
            position: "Software Engineer",
            appliedOn: "12th Jun 2026",
            status: "Under Review",
            location: "San Francisco, CA"
        },
        {
            company: "Nebula Inc.",
            position: "Frontend Developer",
            appliedOn: "5th May 2026",
            status: "Rejected",
            location: "New York, NY"
        },
        {
            company: "Stellar Solutions",
            position: "Data Scientist",
            appliedOn: "20th Apr 2026",
            status: "Interview Scheduled",
            location: "Remote"
        },
        {
            company: "Galactic Tech",
            position: "Product Manager",
            appliedOn: "15th Mar 2026",
            status: "Offer Received",
            location: "Austin, TX"
        }
    ];
    return (
        <div className="my-8">
            <Card className="p-4 gap-2">
                <CardContent className="p-0">
                    <div className="flex justify-between items-center px-8 py-4 border-b">
                        <div className="flex gap-4 items-center">
                            <div className="rounded-full overflow-hidden">
                                <Image
                                    src="https://github.com/shadcn.png"
                                    alt="@shadcn"
                                    width={60}
                                    height={60}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-bold">Ariel</h2>
                                <p className="text-sm text-gray-500">
                                    ariel@gmail.com
                                </p>
                            </div>
                        </div>
                        <Button variant="outline">
                            <UserRoundPen />
                            Edit Profile
                        </Button>
                    </div>
                    <div className="flex mt-4">
                        <div className="w-1/7 p-4 border-r-2 border-solid border-gray-200">
                            <ul className="flex flex-col gap-2 text-sm">
                                <li className="hover:bg-gray-100 cursor-pointer p-2 rounded-md">Profile Info</li>
                                <li className="hover:bg-gray-100 cursor-pointer p-2 rounded-md bg-gray-100 font-medium">Jobs Applied</li>
                                <li className="hover:bg-gray-100 cursor-pointer p-2 rounded-md">Resume</li>
                                <li className="hover:bg-gray-100 cursor-pointer p-2 rounded-md">Shipping partner</li>
                                <li className="hover:bg-gray-100 cursor-pointer p-2 rounded-md">Jobs Rejected</li>
                            </ul>
                        </div>
                        <div className="w-6/7 p-4">
                            <h3 className="font-semibold">Applied Jobs</h3>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {appliedJobs.map((job, index) => (
                                    <Card className={`p-4  ${job.status === "Rejected" ? "bg-red-50" : job.status === "Offer Received" ? "bg-green-50" : ""} hover:cursor-pointer hover:transform hover:scale-105 duration-300`} key={index} onClick={() => navigator.push(`/recruitment/${index}`)}>
                                        <CardContent className={`p-0`}>
                                            <div className="flex justify-between items-center border-b pb-2 mb-2">
                                                <div>
                                                    <h4 className="font-medium">{job.position}</h4>
                                                    <p className="text-sm text-gray-500">{job.company}</p>
                                                </div>
                                                <SquareArrowOutUpRight className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div className="text-sm">
                                                <ul className="flex flex-col gap-2">
                                                    <li className="flex justify-between">
                                                        <span className=" text-gray-500">Applied on:</span>
                                                        <span>{job.appliedOn}</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className=" text-gray-500">Status:</span>
                                                        <span>
                                                            <Badge variant={job.status === "Rejected" ? "destructive" : job.status === "Offer Received" ? "default" : "secondary"}>
                                                                {job.status}
                                                            </Badge>
                                                        </span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className=" text-gray-500">Location:</span>
                                                        <span>{job.location}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}

export default Profile