import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";

export default function Home() {

    const jobs = [

        {
            "company": "TechCorp",
            "openings": [
                {
                    "title": "Software Engineer",
                    "description": "Join TechCorp as a Software Engineer and work on cutting-edge technology in a collaborative environment.",
                    "department": "Engineering",
                    "openingType": "Full-time",
                    "openingDate": "2024-06-01"
                },
                {
                    "title": "Product Manager",
                    "description": "Lead product development at TechCorp and drive innovation in the tech industry.",
                    "department": "Product",
                    "openingType": "Full-time",
                    "openingDate": "2024-06-15"
                }
            ]
        },
        {
            "company": "InnovateX",
            "openings": [
                {
                    "title": "Data Scientist",
                    "description": "Join InnovateX as a Data Scientist and help us unlock insights from our data to drive business decisions.",
                    "department": "Data Science",
                    "openingType": "Full-time"
                    , "openingDate": "2024-07-01"
                },
                {
                    "title": "UX Designer",
                    "description": "Design intuitive and engaging user experiences for InnovateX's cutting-edge products.",
                    "department": "Design",
                    "openingType": "Full-time",
                    "openingDate": "2024-07-15"
                }
            ]
        },
        {
            "company": "FutureTech",
            "openings": [
                {
                    "title": "AI Researcher",
                    "description": "Join FutureTech as an AI Researcher and contribute to groundbreaking advancements in artificial intelligence.",
                    "department": "Research",
                    "openingType": "Full-time",
                    "openingDate": "2024-08-01"
                },
                {
                    "title": "Cybersecurity Analyst",
                    "description": "Protect FutureTech's digital assets and infrastructure as a Cybersecurity Analyst.",
                    "department": "Security",
                    "openingType": "Full-time",
                    "openingDate": "2024-08-15"
                }
            ]
        }
    ]

    const shippingPartners = [

        {
            "company": "LogiShip",
            "requirements": "LogiShip requires shipping partners to have a fleet of at least 10 trucks and a proven track record of on-time deliveries.",
            "companyType": "Retailer",
            "monthlyVolume": "1000 shipments",
            "requiredShippingPartners": "5",
            "shippingMethods": "Ground, Air",
            "enrollmentDeadline": "2024-09-30"
        },
        {
            "company": "ShipEase",
            "requirements": "ShipEase requires shipping partners to have experience in handling fragile items and a strong customer service record.",
            "companyType": "E-commerce",
            "monthlyVolume": "500 shipments",
            "requiredShippingPartners": "3",
            "shippingMethods": "Ground, Air, Sea",
            "enrollmentDeadline": "2024-10-15"
        },
        {
            "company": "GlobalFreight",
            "requirements": "GlobalFreight requires shipping partners to have international shipping capabilities and compliance with global trade regulations.",
            "companyType": "Manufacturing",
            "monthlyVolume": "2000 shipments",
            "requiredShippingPartners": "10",
            "shippingMethods": "Air, Sea",
            "enrollmentDeadline": "2024-11-30"
        },
        {
            "company": "EcoShip",
            "requirements": "EcoShip requires shipping partners to have sustainable shipping practices and a commitment to reducing carbon emissions.",
            "companyType": "Retailer",
            "monthlyVolume": "800 shipments",
            "requiredShippingPartners": "4",
            "shippingMethods": "Ground, Air",
            "enrollmentDeadline": "2024-12-15"
        }

    ]

    return (
        <div className="">
            <div className="mt-4">
                <h1 className="text-2xl font-bold">Welcome to Nexus Direct!</h1>
                <p className=" text-md">
                    This is the home page of Nexus Direct. Explore our documentation and job listings!
                </p>
            </div>
            <section className="mt-8">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Job Listings</CardTitle>
                        <CardDescription>Explore our latest job opportunities</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 w-full">
                        <Accordion
                            type="multiple"
                            defaultValue={["company1"]}
                            className="w-full"

                        >
                            {jobs.map((job, index) => (
                                <AccordionItem key={index} value={`company${index + 1}`} className="w-full">
                                    <AccordionTrigger className="p-4 rounded-md w-full text-left">
                                        {"#" + (index + 1) + " " + job.company}
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Title
                                                    </TableHead>
                                                    <TableHead>
                                                        Description
                                                    </TableHead>
                                                    <TableHead>
                                                        Opening Date
                                                    </TableHead>
                                                    <TableHead>
                                                        Department
                                                    </TableHead>
                                                    <TableHead>
                                                        Type
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {job.openings.map((opening, idx) => (
                                                    <TableRow key={idx} className="cursor-pointer">
                                                        <TableCell>{opening.title}</TableCell>
                                                        <TableCell>{opening.description}</TableCell>
                                                        <TableCell>{opening.openingDate}</TableCell>
                                                        <TableCell>{opening.department}</TableCell>
                                                        <TableCell>{opening.openingType}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </section>

            <section className="mt-8">
                <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                        <CardTitle>Shipping Enrollment</CardTitle>
                        <CardDescription>
                            Check out the list of companies that have requirements for shipping partners and enroll your company to become a shipping partner for those companies.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0 w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        Sl. No.
                                    </TableHead>
                                    <TableHead>
                                        Company
                                    </TableHead>
                                    <TableHead>
                                        Company Type
                                    </TableHead>
                                    <TableHead>
                                        Monthly Volume
                                    </TableHead>
                                    <TableHead>
                                        Shipping Methods
                                    </TableHead>
                                    <TableHead>
                                        Enrollment Deadline
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shippingPartners.map((partner, index) => (
                                    <TableRow key={index} className="cursor-pointer">
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{partner.company}</TableCell>
                                        <TableCell>{partner.companyType}</TableCell>
                                        <TableCell>{partner.monthlyVolume}</TableCell>
                                        <TableCell>{partner.shippingMethods}</TableCell>
                                        <TableCell>{partner.enrollmentDeadline}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>
        </div>
    );

}
