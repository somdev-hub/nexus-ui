import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bookmark, Plus, Send } from 'lucide-react';

const RecruitmentPage = () => {
    const jobDescriptionHtml = `
    <h2>
        Responsibilities:
    </h2>
    <p>
        The ideal candidate will have experience in developing high-quality software solutions and a passion for technology. You will be responsible for designing, coding, and testing software applications, as well as collaborating with cross-functional teams to deliver innovative products.
    </p>
    <h2>
        Requirements:
    </h2>
    <ul>
        <li>Proven experience as a Software Engineer or similar role.</li>
        <li>Strong knowledge of programming languages such as Java, Python, or C++.</li>
        <li>Experience with web development frameworks and tools.</li>
        <li>Excellent problem-solving skills and attention to detail.</li>
        <li>Strong communication and teamwork skills.</li>
    </ul>
    <h2>
        Benefits:
    </h2>
    <ul>
        <li>Competitive salary and benefits package.</li>
        <li>Opportunities for professional growth and development.</li>
        <li>Flexible work hours and remote work options.</li>
        <li>Collaborative and inclusive work environment.</li>
    </ul>

    `;

    return (
        <div>
            <Card className="p-4 gap-2">
                <div className=" border-b-2 p-2 pb-4 flex justify-between items-center">
                    <div className="">
                        <h2 className="m-0 p-0 flex items-center">
                            <span className="text-lg font-semibold">
                                #123 Software Engineer
                            </span>

                        </h2>
                        <p className="text-gray-500 text-lg font-semibold m-0 p-0 ">Cosmos AI</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className=" flex-1"><Bookmark />Bookmark</Button>
                    </div>
                </div>
                <CardContent className="p-0 flex">
                    <div className=" border-r-2 border-solid border-gray-200 pr-6 w-3/4">
                        <p className="text-md border-b-2 pb-2 font-medium mt-4">
                            Short Description
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            We are looking for a skilled Software Engineer to join our team. The ideal candidate will have experience in developing high-quality software solutions and a passion for technology. You will be responsible for designing, coding, and testing software applications, as well as collaborating with cross-functional teams to deliver innovative products.
                        </p>
                        <p className="text-md border-b-2 pb-2 font-medium mt-4">
                            Job Description
                        </p>
                        <p className="prose prose-sm max-w-none dark:prose-invert text-sm text-muted-foreground leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_strong]:font-semibold [&_em]:italic" dangerouslySetInnerHTML={{ __html: jobDescriptionHtml }} suppressHydrationWarning />
                    </div>
                    <div className=" pl-6 w-1/4">
                        <p className="text-md border-b-2 pb-2 font-medium mt-4">
                            Job Details
                        </p>
                        <ul className="text-sm mt-2">
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Location:</span>
                                <span>Remote</span>
                            </li>
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Salary:</span>
                                <span>$80,000 - $120,000</span>
                            </li>
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Experience:</span>
                                <span>3+ years</span>
                            </li>
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Job Type:</span>
                                <span>Full-time</span>
                            </li>
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Posted on:</span>
                                <span>2024-06-15</span>
                            </li>
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Closing on:</span>
                                <span>2024-06-15</span>
                            </li>
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Department:</span>
                                <span>Engineering</span>
                            </li>
                            <li className="flex justify-between py-2 border-b">
                                <span className="font-medium">Status:</span>
                                <span>
                                    <Badge variant="outline">Open</Badge>
                                </span>
                            </li>
                        </ul>
                        <div className="flex gap-2 flex-col mt-4">
                            <Button variant="default" className="cursor-pointer"><Plus />Apply Now</Button>
                            <Button variant="outline" className="cursor-pointer"><Send />Share</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default RecruitmentPage