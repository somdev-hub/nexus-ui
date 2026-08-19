"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserMetadata } from '@/hooks/use-user-metadata';
import { getPublicRecruitmentById } from '@/lib/auth-service';
import { Recruitment } from '@/types';
import ApplyDialog from '@/components/apply-dialog';
import {
    Bookmark,
    Plus,
    ArrowLeft,
    MapPin,
    DollarSign,
    Briefcase,
    Clock,
    Calendar,
    Building2,
    Activity,
    Share2,
    CheckCircle2,
    Linkedin,
    Twitter,
    Mail,
    Copy,
    UserPlus,
    LogIn,
    Lock
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import Link from 'next/link';

const LoadingSkeleton = () => {
    return (
        <div className="my-8 max-w-7xl mx-auto">
            <Skeleton className="h-10 w-32 mb-6" />
            <Card className="overflow-hidden shadow-lg border-0">
                <div className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <Skeleton className="h-8 w-1/3 mb-2" />
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-10 w-10 rounded-lg" />
                        </div>
                    </div>
                </div>
                <CardContent className="p-0 flex flex-col lg:flex-row">
                    <div className="flex-1 p-6 lg:border-r border-border">
                        <Skeleton className="h-6 w-1/4 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Separator className="my-6" />
                        <Skeleton className="h-6 w-1/4 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                    </div>
                    <div className="w-full lg:w-80 p-6 bg-muted/30">
                        <Skeleton className="h-6 w-1/3 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg" />
                            ))}
                        </div>
                        <Skeleton className="h-12 w-full mt-6 rounded-lg" />
                        <Skeleton className="h-12 w-full mt-3 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const PublicRecruitmentPage = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [recruitmentData, setRecruitmentData] = useState<Recruitment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
    const [applyDialogOpen, setApplyDialogOpen] = useState<boolean>(false);
    const [applyPopoverOpen, setApplyPopoverOpen] = useState<boolean>(false);
    const { toast } = useToast();
    const { isAuthenticated } = useUserMetadata();

    useEffect(() => {
        const fetchRecruitmentData = async () => {
            setIsLoading(true);
            try {
                const response = await getPublicRecruitmentById(Number(id));
                setRecruitmentData(response.data);
            } catch (error) {
                console.error("Error fetching recruitment data:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch recruitment data.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecruitmentData();
    }, [id, toast]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link copied!",
                description: "Job link copied to clipboard.",
            });
        } catch {
            toast({
                title: "Error",
                description: "Failed to copy link.",
                variant: "destructive"
            });
        }
    };

    const handleSocialShare = (platform: 'linkedin' | 'twitter' | 'email') => {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(recruitmentData?.title || 'Job Opportunity');
        const text = encodeURIComponent(`Check out this job: ${recruitmentData?.title} at ${recruitmentData?.orgName}`);

        let shareUrl = '';
        switch (platform) {
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleApplyClick = () => {
        if (isAuthenticated) {
            setApplyDialogOpen(true);
        } else {
            setApplyPopoverOpen(true);
        }
    };

    const handleSignup = () => {
        setApplyPopoverOpen(false);
        router.push('/signup');
    };

    const handleLogin = () => {
        setApplyPopoverOpen(false);
        router.push('/login');
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'bg-green-100 text-green-700 border-green-200';
            case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!recruitmentData) {
        return (
            <div className="my-8 max-w-7xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
                <p className="text-muted-foreground mb-6">The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                <Button onClick={() => router.push('/recruitment')}>Browse All Jobs</Button>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="my-8 max-w-7xl mx-auto">
                {/* Minimal Public Header */}
                <div className="flex items-center justify-between mb-6 px-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/recruitment')}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Jobs
                    </Button>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                            Sign In
                        </Link>
                        <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
                            Get Started
                        </Link>
                    </div>
                </div>

                <Card className="overflow-hidden shadow-lg border-0">
                    {/* Header Section */}
                    <div className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {recruitmentData.title}
                                    </h1>
                                    <Badge
                                        variant="outline"
                                        className={getStatusColor(recruitmentData.hiringStatus || '')}
                                    >
                                        {recruitmentData.hiringStatus || 'Open'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4" />
                                        {recruitmentData.orgName}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        {recruitmentData.location || 'Remote'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy link</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleSocialShare('linkedin')}>
                                            <Linkedin className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Share on LinkedIn</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleSocialShare('twitter')}>
                                            <Twitter className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Share on X</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleSocialShare('email')}>
                                            <Mail className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Share via Email</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                            {/* Main Content */}
                            <div className="flex-1 p-6 lg:border-r border-border">
                                {/* Short Description */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        About this Role
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {recruitmentData.shortDescription}
                                    </p>
                                </div>

                                <Separator className="my-6" />

                                {/* Job Description */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" />
                                        Job Description
                                    </h3>
                                    <div
                                        className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed
                                        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
                                        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                                        [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5
                                        [&_li]:mb-1.5 [&_li]:leading-relaxed
                                        [&_strong]:font-semibold [&_em]:italic
                                        [&_p]:mb-4"
                                        dangerouslySetInnerHTML={{ __html: recruitmentData.description || '' }}
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="w-full lg:w-80 p-6 bg-muted/30">
                                <h3 className="text-lg font-semibold mb-4">Job Details</h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                                        <DollarSign className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Salary</p>
                                            <p className="text-sm text-muted-foreground">
                                                {recruitmentData.totalCompensation || '$80,000 - $120,000'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                                        <Briefcase className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Experience</p>
                                            <p className="text-sm text-muted-foreground">
                                                {recruitmentData.minYearsOfExperience || '3+'} - {recruitmentData.maxYearsOfExperience || '5+'} Years
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                                        <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Job Type</p>
                                            <p className="text-sm text-muted-foreground">
                                                {recruitmentData.hiringType || 'Full-time'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                                        <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Closing Date</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(recruitmentData.openingTillDate || '2024-06-15').toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                                        <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Department</p>
                                            <p className="text-sm text-muted-foreground">
                                                {recruitmentData.departmentName || 'Engineering'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                                        <Activity className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Status</p>
                                            <Badge variant="outline" className={getStatusColor(recruitmentData.hiringStatus || '')}>
                                                {recruitmentData.hiringStatus || 'Open'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                {/* Action Buttons with Popover */}
                                <div className="space-y-3">
                                    <Popover open={applyPopoverOpen} onOpenChange={setApplyPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                className="w-full gap-2"
                                                size="lg"
                                                onClick={handleApplyClick}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Apply Now
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64" align="end" sideOffset={8}>
                                            <div className="space-y-3 p-2">
                                                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                                    <UserPlus className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <p className="font-medium text-sm">New to Nexus?</p>
                                                        <p className="text-xs text-muted-foreground">Create an account to apply</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    className="w-full gap-2 justify-start"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={handleSignup}
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                    Sign Up
                                                </Button>
                                                <div className="relative my-3">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                                                    <LogIn className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium text-sm">Already have an account?</p>
                                                        <p className="text-xs text-muted-foreground">Sign in to apply</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    className="w-full gap-2 justify-start"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleLogin}
                                                >
                                                    <Lock className="h-4 w-4" />
                                                    Log In
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2"
                                                size="lg"
                                            >
                                                <Share2 className="h-4 w-4" />
                                                Share Job
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel className="flex items-center gap-2">
                                                <Share2 className="h-4 w-4" />
                                                Share this job
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="flex items-center gap-2"
                                                onClick={() => handleSocialShare('linkedin')}
                                            >
                                                <Linkedin className="h-4 w-4 text-blue-600" />
                                                <span>Share on LinkedIn</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="flex items-center gap-2"
                                                onClick={() => handleSocialShare('twitter')}
                                            >
                                                <Twitter className="h-4 w-4 text-blue-400" />
                                                <span>Share on X (Twitter)</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="flex items-center gap-2"
                                                onClick={() => handleSocialShare('email')}
                                            >
                                                <Mail className="h-4 w-4 text-green-600" />
                                                <span>Share via Email</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="flex items-center gap-2"
                                                onClick={handleCopyLink}
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span>Copy Link</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Quick Info */}
                                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">Easy Apply</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Your profile will be sent directly to the hiring team.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Apply Dialog - only for authenticated users */}
            <ApplyDialog
                open={applyDialogOpen}
                onOpenChange={setApplyDialogOpen}
                recruitmentId={Number(id)}
                recruitmentTitle={recruitmentData?.title || ''}
                orgName={recruitmentData?.orgName || ''}
            />
        </TooltipProvider>
    )
}

export default PublicRecruitmentPage