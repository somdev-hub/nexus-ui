"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { ApplicantApplicationSchema, ApplicationDetailsWithStatusHistory, ApplicationStatus } from '@/types';
import { getApplicationDetailsWithStatusHistory } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';
import {
    Building2,
    Calendar,
    MapPin,
    FileText,
    SquareArrowOutUpRight,
    Circle,
    Search,
    FileSearch,
    XCircle,
    CheckCircle2,
    ThumbsUp,
    Ban,
    CheckCheck,
    ThumbsDown,
    Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const statusIconMap: Record<ApplicationStatus, React.ReactNode> = {
    'APPLIED': <Circle className="h-4 w-4" />,
    'REVIEW': <Search className="h-4 w-4" />,
    'REVIEW_COMPLETED': <FileSearch className="h-4 w-4" />,
    'REVIEW_FAILED': <XCircle className="h-4 w-4" />,
    'INTERVIEW_SCHEDULED': <Calendar className="h-4 w-4" />,
    'INTERVIEW_COMPLETED': <CheckCircle2 className="h-4 w-4" />,
    'SELECTED': <ThumbsUp className="h-4 w-4" />,
    'REJECTED': <Ban className="h-4 w-4" />,
    'OFFER_ACCEPTED': <CheckCheck className="h-4 w-4" />,
    'OFFER_REJECTED': <ThumbsDown className="h-4 w-4" />,
};

const statusLabelMap: Record<ApplicationStatus, string> = {
    'APPLIED': 'Applied',
    'REVIEW': 'Under Review',
    'REVIEW_COMPLETED': 'Review Completed',
    'REVIEW_FAILED': 'Review Failed',
    'INTERVIEW_SCHEDULED': 'Interview Scheduled',
    'INTERVIEW_COMPLETED': 'Interview Completed',
    'SELECTED': 'Selected',
    'REJECTED': 'Rejected',
    'OFFER_ACCEPTED': 'Offer Accepted',
    'OFFER_REJECTED': 'Offer Rejected',
};

const statusColorMap: Record<ApplicationStatus, { dot: string; line: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
    'APPLIED': { dot: 'bg-slate-400', line: 'bg-slate-200', badge: 'secondary' },
    'REVIEW': { dot: 'bg-yellow-400', line: 'bg-yellow-200', badge: 'secondary' },
    'REVIEW_COMPLETED': { dot: 'bg-blue-400', line: 'bg-blue-200', badge: 'default' },
    'REVIEW_FAILED': { dot: 'bg-red-400', line: 'bg-red-200', badge: 'destructive' },
    'INTERVIEW_SCHEDULED': { dot: 'bg-purple-400', line: 'bg-purple-200', badge: 'default' },
    'INTERVIEW_COMPLETED': { dot: 'bg-indigo-400', line: 'bg-indigo-200', badge: 'default' },
    'SELECTED': { dot: 'bg-green-400', line: 'bg-green-200', badge: 'default' },
    'REJECTED': { dot: 'bg-red-400', line: 'bg-red-200', badge: 'destructive' },
    'OFFER_ACCEPTED': { dot: 'bg-emerald-400', line: 'bg-emerald-200', badge: 'default' },
    'OFFER_REJECTED': { dot: 'bg-orange-400', line: 'bg-orange-200', badge: 'outline' },
};

interface ApplicationDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    application: ApplicantApplicationSchema | null;
    userId: string | undefined;
}

const ApplicationDetailsDialog = ({ open, onOpenChange, application, userId }: ApplicationDetailsDialogProps) => {
    const navigator = useRouter();
    const { toast } = useToast();
    const [details, setDetails] = useState<ApplicationDetailsWithStatusHistory | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch application details when dialog opens
    useEffect(() => {
        const fetchDetailsOnOpen = async () => {
            if (!application || !userId) return;
            setLoading(true);
            setDetails(null);
            try {
                const response = await getApplicationDetailsWithStatusHistory(application.recruitmentId, Number(userId));
                setDetails(response.data);
            } catch (error) {
                console.error("Error fetching application details:", error);
                toast({
                    title: "Error",
                    description: "Failed to load application details.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }
        if (open) {
            fetchDetailsOnOpen();
        }
    }, [open, application, userId, toast]);

    if (!application) return null;

    const currentStatus = details?.statusHistList?.length
        ? details.statusHistList[details.statusHistList.length - 1].status
        : application.status;
    const currentColor = statusColorMap[currentStatus] || statusColorMap['APPLIED'];

    // Build status trail from API response (sorted by createdAt ascending)
    const statusHistList = details?.statusHistList ?? [];
    const sortedHistory = [...statusHistList].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-md">Application Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full col-span-2" />
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-24" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-md flex items-center gap-2">
                        Application Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Role & Organization */}
                    <div className="space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <div
                                    className="flex gap-2 items-center group cursor-pointer"
                                    onClick={() => navigator.push(`/recruitment/${application.recruitmentId}`)}
                                >
                                    <h3 className="text-lg font-semibold hover:underline">
                                        {details?.roleName || application.roleName}
                                    </h3>
                                    <SquareArrowOutUpRight className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {details?.orgName || application.orgName}
                                </p>
                            </div>
                            <Badge variant={currentColor.badge} className="gap-1.5 text-xs px-2.5 py-1">
                                {statusIconMap[currentStatus]}
                                {statusLabelMap[currentStatus]}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Key Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Date Applied
                            </p>
                            <p className="text-sm font-medium">
                                {new Date(details?.appliedOn || application.appliedOn).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Location
                            </p>
                            <p className="text-sm font-medium">
                                {details?.location || application.location}
                            </p>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Resume Submitted
                            </p>
                            <p className="text-sm font-medium">
                                {details?.resumeSubmitted || 'No resume attached'}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Status Trail */}
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            Status Trail
                        </h4>
                        {sortedHistory.length > 0 ? (
                            <div className="relative pl-6 space-y-0">
                                {sortedHistory.map((entry, index) => {
                                    const color = statusColorMap[entry.status] || statusColorMap['APPLIED'];
                                    const isLast = index === sortedHistory.length - 1;
                                    return (
                                        <div key={entry.applicantRecruitmentMappingStatusHistId} className="relative pb-4 last:pb-0">
                                            {/* Vertical line */}
                                            {!isLast && (
                                                <div
                                                    className={`absolute left-[-1.15rem] top-4 w-0.5 h-full ${color.line} dark:opacity-30`}
                                                />
                                            )}
                                            {/* Dot */}
                                            <div
                                                className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-background ${color.dot} ${isLast ? 'ring-2 ring-offset-1 ring-offset-background ' + color.dot.replace('bg-', 'ring-') : ''}`}
                                            />
                                            {/* Content */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {statusLabelMap[entry.status]}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No status history available yet.
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationDetailsDialog;