"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import {
    ArrowLeft,
    Loader2,
    Download,
    FileText,
    ChevronLeft,
    ChevronRight,
    X,
    Filter,
    Check,
    AlertCircle,
    Share,
    Copy,
    Facebook,
    Linkedin,
    Mail,
    Twitter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getRecruitmentDetails,
    getRecruitmentApplicants,
    getRecruitmentApplicantDetail,
    PaginatedApplicantsResponse,
    FullRecruitmentRequisition,
    ApplicantDetail
} from "@/lib/auth-service";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type FullRecruitmentDetails = FullRecruitmentRequisition;

// ============================================================================
// STYLING MAPS
// ============================================================================

const hiringStatusTone: Record<string, string> = {
    OPEN: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    CLOSED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    ON_HOLD: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

const hiringTypeTone: Record<string, string> = {
    PERMANENT: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    CONTRACT: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    INTERN: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
};

// ============================================================================
// RECRUITMENT DETAIL PAGE
// ============================================================================

function RecruitmentDetail() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const recruitmentId = params.id as string;

    const [recruitment, setRecruitment] = useState<FullRecruitmentDetails | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [showApplicantsDialog, setShowApplicantsDialog] = useState(false);
    const [applicants, setApplicants] =
        useState<PaginatedApplicantsResponse | null>(null);
    const [applicantsLoading, setApplicantsLoading] = useState(false);
    const [applicantsPage, setApplicantsPage] = useState(0);
    const pageSize = 10;

    // Filter states
    const [searchName, setSearchName] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterGender, setFilterGender] = useState("");
    const [filterMinAge, setFilterMinAge] = useState("");
    const [filterMaxAge, setFilterMaxAge] = useState("");
    const [filterAppliedFromDate, setFilterAppliedFromDate] = useState("");
    const [filterAppliedToDate, setFilterAppliedToDate] = useState("");
    const [filterYearsOfExperience, setFilterYearsOfExperience] = useState("");
    const [debouncedSearchName, setDebouncedSearchName] = useState("");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    // Applicant detail states
    const [selectedApplicant, setSelectedApplicant] =
        useState<ApplicantDetail | null>(null);
    const [showApplicantDetail, setShowApplicantDetail] = useState(false);
    const [applicantDetailLoading, setApplicantDetailLoading] = useState(false);

    // Share popover state
    const [sharePopoverOpen, setSharePopoverOpen] = useState(false);

    // Edit dialog state
    const [showEditDialog, setShowEditDialog] = useState(false);

    // Debounce timer ref
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch full recruitment details
    useEffect(() => {
        const fetchRecruitmentDetails = async () => {
            if (!recruitmentId) {
                toast({
                    title: "Error",
                    description: "Recruitment ID not found",
                    variant: "destructive"
                });
                router.back();
                return;
            }

            setLoading(true);
            try {
                const data = await getRecruitmentDetails(parseInt(recruitmentId));
                setRecruitment(data);
            } catch (error) {
                console.error("Failed to fetch recruitment details:", error);
                toast({
                    title: "Failed to load recruitment details",
                    description:
                        error instanceof Error ? error.message : "Please try again later.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRecruitmentDetails();
    }, [recruitmentId, toast, router]);

    // Debounce search name
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchName(searchName);
            setApplicantsPage(0); // Reset to first page on search
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchName]);

    // Fetch applicants when dialog opens or filters/page changes
    useEffect(() => {
        if (showApplicantsDialog && recruitment) {
            setApplicantsLoading(true);
            getRecruitmentApplicants(recruitment.recruitmentId, {
                pageNo: applicantsPage,
                pageSize: pageSize
            })
                .then((data) => setApplicants(data))
                .catch((error) => {
                    console.error("Failed to fetch applicants:", error);
                    toast({
                        title: "Failed to load applicants",
                        description:
                            error instanceof Error
                                ? error.message
                                : "Please try again later.",
                        variant: "destructive"
                    });
                })
                .finally(() => setApplicantsLoading(false));
        }
    }, [
        applicantsPage,
        showApplicantsDialog,
        recruitment,
        debouncedSearchName,
        toast
    ]);

    const fetchApplicants = () => {
        if (showApplicantsDialog && recruitment) {
            setApplicantsLoading(true);
            getRecruitmentApplicants(recruitment.recruitmentId, {
                pageNo: applicantsPage,
                pageSize: pageSize,
                status: filterStatus || undefined,
                name: debouncedSearchName || undefined,
                gender: filterGender || undefined,
                minAge: filterMinAge ? parseInt(filterMinAge) : undefined,
                maxAge: filterMaxAge ? parseInt(filterMaxAge) : undefined,
                appliedFromDate: filterAppliedFromDate || undefined,
                appliedToDate: filterAppliedToDate || undefined,
                yearsOfExperience: filterYearsOfExperience
                    ? parseInt(filterYearsOfExperience)
                    : undefined
            })
                .then((data) => setApplicants(data))
                .catch((error) => {
                    console.error("Failed to fetch applicants:", error);
                    toast({
                        title: "Failed to load applicants",
                        description:
                            error instanceof Error
                                ? error.message
                                : "Please try again later.",
                        variant: "destructive"
                    });
                })
                .finally(() => setApplicantsLoading(false));
        }
    };

    const handleViewApplicants = () => {
        setApplicantsPage(0);
        setShowApplicantsDialog(true);
    };

    const handleDownloadDocument = (url: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewApplicantDetail = async (applicantId: number) => {
        setApplicantDetailLoading(true);
        try {
            const detail = await getRecruitmentApplicantDetail(applicantId);
            setSelectedApplicant(detail);
            setShowApplicantDetail(true);
        } catch (error) {
            console.error("Failed to fetch applicant detail:", error);
            toast({
                title: "Failed to load applicant details",
                description:
                    error instanceof Error ? error.message : "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setApplicantDetailLoading(false);
        }
    };

    const handleResetFilters = () => {
        setSearchName("");
        setFilterStatus("");
        setFilterGender("");
        setFilterMinAge("");
        setFilterMaxAge("");
        setFilterAppliedFromDate("");
        setFilterAppliedToDate("");
        setFilterYearsOfExperience("");
        setDebouncedSearchName("");
        setApplicantsPage(0);
    };

    const getShareUrl = () => {
        if (typeof window !== "undefined") {
            return window.location.href;
        }
        return "";
    };

    const handleCopyLink = async () => {
        const shareUrl = getShareUrl();
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast({
                title: "Link copied!",
                description: "Recruitment link copied to clipboard."
            });
        } catch {
            toast({
                title: "Failed to copy",
                description: "Could not copy link to clipboard.",
                variant: "destructive"
            });
        }
    };

    const handleShareSocial = (
        platform: "facebook" | "twitter" | "linkedin" | "email"
    ) => {
        const shareUrl = getShareUrl();
        const title = `Check out this job opening: ${recruitment?.title}`;
        const description = recruitment?.shortDescription || "";

        let url = "";

        switch (platform) {
            case "facebook":
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
                break;
            case "twitter":
                url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
                break;
            case "linkedin":
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                break;
            case "email":
                url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + "\n\n" + shareUrl)}`;
                break;
        }

        if (url) {
            if (platform === "email") {
                window.location.href = url;
            } else {
                window.open(url, "_blank", "width=600,height=400");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!recruitment) {
        return (
            <div className="space-y-6 p-6">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Card className="p-4">
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            Recruitment details not found
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{recruitment.title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Recruitment ID: #{recruitment.recruitmentId}
                        </p>
                    </div>
                </div>
                <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2 cursor-pointer">
                            <Share className="h-4 w-4" />
                            Share recruitment
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2">
                                    Share this recruitment
                                </h4>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Copy the link or share on social media
                                </p>
                            </div>

                            {/* Copy Link Section */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border">
                                    <input
                                        type="text"
                                        value={getShareUrl()}
                                        readOnly
                                        className="flex-1 bg-transparent text-xs outline-none truncate"
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCopyLink}
                                        className="h-6 w-6 p-0 cursor-pointer group"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="h-3.5 w-3.5 hover:scale-110 transition-transform" />
                                    </Button>
                                </div>
                            </div>

                            {/* Social Media Share Buttons */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Share on social media
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleShareSocial("facebook")}
                                        title="Share on Facebook"
                                        className="h-10 w-full"
                                    >
                                        <Facebook className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleShareSocial("twitter")}
                                        title="Share on Twitter"
                                        className="h-10 w-full"
                                    >
                                        <Twitter className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleShareSocial("linkedin")}
                                        title="Share on LinkedIn"
                                        className="h-10 w-full"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleShareSocial("email")}
                                        title="Share via Email"
                                        className="h-10 w-full"
                                    >
                                        <Mail className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Key Information Cards */}
            {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-co  ls-4">
        <Card className="p-4 gap-2 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Role
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="mt-2 text-lg font-semibold">{recruitment.roleName}</p>
          </CardContent>
        </Card>

        <Card className="p-4 gap-2 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Department
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="mt-2 text-lg font-semibold">
              {recruitment.departmentName}
            </p>
          </CardContent>
        </Card>

        <Card className="p-4 gap-2 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Type
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="mt-2">
              <Badge
                variant="secondary"
                className={hiringTypeTone[recruitment.hiringType] || ""}
              >
                {recruitment.hiringType}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 gap-2 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posted Date
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="mt-2 text-lg font-semibold">
              {new Date(recruitment.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div> */}

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Short Description */}
                    <Card className="p-4 gap-2 shadow-sm">
                        <CardHeader className="p-0 mb-2">
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {recruitment.shortDescription}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Full Description */}
                    <Card className="p-4 gap-2 shadow-sm">
                        <CardHeader className="p-0 mb-2">
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recruitment.description ? (
                                <div
                                    className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed
                                    [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
                                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                                    [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5
                                    [&_li]:mb-1.5 [&_li]:leading-relaxed
                                    [&_strong]:font-semibold [&_em]:italic
                                    [&_p]:mb-4"
                                    dangerouslySetInnerHTML={{ __html: recruitment.description }}
                                    suppressHydrationWarning
                                />
                            ) : (
                                <p className="text-muted-foreground">No description provided</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Quick Info */}
                <div className="space-y-6">
                    {/* Quick Details */}
                    <Card className="p-4 gap-2 shadow-sm">
                        <CardHeader className="p-0 mb-2">
                            <CardTitle className="text-base">Quick Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Role
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {recruitment.roleName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Department
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {recruitment.departmentName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Organization
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {recruitment.orgName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Location
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {recruitment.location}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Experience Range
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {recruitment.minYearsOfExperience != null && recruitment.maxYearsOfExperience != null
                                        ? `${recruitment.minYearsOfExperience} - ${recruitment.maxYearsOfExperience} years`
                                        : recruitment.minYearsOfExperience != null
                                            ? `${recruitment.minYearsOfExperience}+ years`
                                            : recruitment.maxYearsOfExperience != null
                                                ? `Up to ${recruitment.maxYearsOfExperience} years`
                                                : "Not specified"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Total Compensation
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    ₹{parseInt(recruitment.totalCompensation).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Opening Till Date
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {new Date(recruitment.openingTillDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Status
                                </p>
                                <Badge
                                    variant="secondary"
                                    className={`mt-2 ${hiringStatusTone[recruitment.hiringStatus] || ""}`}
                                >
                                    {recruitment.hiringStatus}
                                </Badge>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Type
                                </p>
                                <Badge
                                    variant="secondary"
                                    className={`mt-2 ${hiringTypeTone[recruitment.hiringType] || ""}`}
                                >
                                    {recruitment.hiringType}
                                </Badge>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Posted On
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {new Date(recruitment.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Applicants
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {recruitment.totalApplicants != null
                                        ? recruitment.totalApplicants
                                        : "0"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <Button className="w-full" size="lg" onClick={handleViewApplicants}>
                            View Applicants
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            onClick={() => setShowEditDialog(true)}
                        >
                            Edit Requisition
                        </Button>
                    </div>
                </div>
            </div>
            {/* Applicants Dialog */}
            <Dialog
                open={showApplicantsDialog}
                onOpenChange={setShowApplicantsDialog}
            >
                <DialogContent className="max-w-6xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Applicants for {recruitment.title}</DialogTitle>
                        <DialogDescription>
                            Total Applicants: {recruitment.totalApplicants}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Filter Section */}
                    <div className="flex gap-3 border-b pb-4 items-center">
                        <Input
                            placeholder="Search by name..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className="flex-1"
                        />

                        <Popover open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-90" align="end">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select
                                            value={filterStatus}
                                            onValueChange={setFilterStatus}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="APPLIED">Applied</SelectItem>
                                                <SelectItem value="REVIEW">Review</SelectItem>
                                                <SelectItem value="REVIEW_COMPLETED">
                                                    Review Completed
                                                </SelectItem>
                                                <SelectItem value="REVIEW_FAILED">
                                                    Review Failed
                                                </SelectItem>
                                                <SelectItem value="INTERVIEW_SCHEDULED">
                                                    Interview Scheduled
                                                </SelectItem>
                                                <SelectItem value="INTERVIEW_COMPLETED">
                                                    Interview Completed
                                                </SelectItem>
                                                <SelectItem value="SELECTED">Selected</SelectItem>
                                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Gender</label>
                                        <Select
                                            value={filterGender}
                                            onValueChange={setFilterGender}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">Male</SelectItem>
                                                <SelectItem value="F">Female</SelectItem>
                                                <SelectItem value="O">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Min Age</label>
                                            <Input
                                                type="number"
                                                placeholder="Min age"
                                                value={filterMinAge}
                                                onChange={(e) => setFilterMinAge(e.target.value)}
                                                min="18"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Max Age</label>
                                            <Input
                                                type="number"
                                                placeholder="Max age"
                                                value={filterMaxAge}
                                                onChange={(e) => setFilterMaxAge(e.target.value)}
                                                max="65"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Applied From
                                            </label>
                                            <Input
                                                type="date"
                                                value={filterAppliedFromDate}
                                                onChange={(e) =>
                                                    setFilterAppliedFromDate(e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Applied To</label>
                                            <Input
                                                type="date"
                                                value={filterAppliedToDate}
                                                onChange={(e) => setFilterAppliedToDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Years of Experience
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="Years"
                                            value={filterYearsOfExperience}
                                            onChange={(e) =>
                                                setFilterYearsOfExperience(e.target.value)
                                            }
                                            min="0"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Button
                                            className="w-full gap-2"
                                            onClick={() => {
                                                // handleResetFilters();
                                                setFilterMenuOpen(false);
                                                fetchApplicants();
                                            }}
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={() => {
                                                handleResetFilters();
                                                setFilterMenuOpen(false);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {(filterStatus ||
                            filterGender ||
                            filterMinAge ||
                            filterMaxAge ||
                            filterAppliedFromDate ||
                            filterAppliedToDate ||
                            filterYearsOfExperience) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        handleResetFilters();
                                        setFilterMenuOpen(false);
                                    }}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                    </div>

                    {applicantsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : !applicants || applicants.content.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No applicants found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-lg border">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Gender</TableHead>
                                                <TableHead>Experience</TableHead>
                                                <TableHead>Previous Company</TableHead>
                                                <TableHead>Application Status</TableHead>
                                                <TableHead>Documents</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {applicants.content.map((applicant) => {
                                                const hasResume = applicant.applicantDocuments.some(
                                                    (doc) => doc.hrDocumentType === "RESUME"
                                                );
                                                const hasCoverLetter =
                                                    applicant.applicantDocuments.some(
                                                        (doc) => doc.hrDocumentType === "COVER_LETTER"
                                                    );
                                                const resumeDoc = applicant.applicantDocuments.find(
                                                    (doc) => doc.hrDocumentType === "RESUME"
                                                );
                                                const coverLetterDoc =
                                                    applicant.applicantDocuments.find(
                                                        (doc) => doc.hrDocumentType === "COVER_LETTER"
                                                    );

                                                return (
                                                    <TableRow
                                                        key={applicant.applicantId}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() =>
                                                            handleViewApplicantDetail(applicant.applicantId)
                                                        }
                                                    >
                                                        <TableCell className="font-medium">
                                                            {applicant.applicantFirstName}{" "}
                                                            {applicant.applicantLastName}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {applicant.applicantEmail}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {applicant.applicantPhone}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {applicant.applicantGender === "M"
                                                                ? "Male"
                                                                : applicant.applicantGender === "F"
                                                                    ? "Female"
                                                                    : applicant.applicantGender === "O"
                                                                        ? "Other"
                                                                        : "—"}
                                                        </TableCell>

                                                        <TableCell className="text-sm">
                                                            {applicant.totalYearsOfExperience} years
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {applicant.previousCompany || "—"}
                                                        </TableCell>

                                                        <TableCell className="text-sm">
                                                            {applicant.applicationStatus || "—"}
                                                        </TableCell>

                                                        <TableCell>
                                                            <div
                                                                className="flex gap-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={!hasResume}
                                                                    onClick={() => {
                                                                        if (resumeDoc) {
                                                                            handleDownloadDocument(
                                                                                resumeDoc.documentUrl,
                                                                                resumeDoc.documentName
                                                                            );
                                                                        }
                                                                    }}
                                                                    title={
                                                                        hasResume ? "Download Resume" : "No Resume"
                                                                    }
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={!hasCoverLetter}
                                                                    onClick={() => {
                                                                        if (coverLetterDoc) {
                                                                            handleDownloadDocument(
                                                                                coverLetterDoc.documentUrl,
                                                                                coverLetterDoc.documentName
                                                                            );
                                                                        }
                                                                    }}
                                                                    title={
                                                                        hasCoverLetter
                                                                            ? "Download Cover Letter"
                                                                            : "No Cover Letter"
                                                                    }
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setApplicantsPage(Math.max(0, applicantsPage - 1))
                                    }
                                    disabled={applicantsPage === 0 || applicantsLoading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {applicantsPage + 1} of {applicants?.totalPages || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setApplicantsPage(
                                            Math.min(
                                                applicantsPage + 1,
                                                (applicants?.totalPages || 1) - 1
                                            )
                                        )
                                    }
                                    disabled={
                                        applicantsPage >= (applicants?.totalPages || 1) - 1 ||
                                        applicantsLoading
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Applicant Detail Dialog */}
            <Dialog open={showApplicantDetail} onOpenChange={setShowApplicantDetail}>
                <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto no-scrollbar">
                    {applicantDetailLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedApplicant ? (
                        <div className="space-y-6">
                            <DialogHeader className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <DialogTitle className="text-2xl">
                                            {selectedApplicant.applicantFirstName}{" "}
                                            {selectedApplicant.applicantLastName}
                                        </DialogTitle>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Badge variant="secondary">
                                                {selectedApplicant.applicationStatus}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Applied{" "}
                                                {new Date(
                                                    selectedApplicant.appliedOn
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Quick Actions */}
                            <div className="flex gap-2 border-b pb-4">
                                <Button className="flex-1" size="sm">
                                    <Check className="h-4 w-4 mr-2" />
                                    Schedule Interview
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Send Offer
                                </Button>
                                <Button variant="destructive" size="sm" className="flex-1">
                                    Reject
                                </Button>
                            </div>

                            {/* Personal Information */}
                            <div>
                                <h3 className="font-semibold mb-3 text-sm">
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Email
                                        </p>
                                        <p className="text-sm font-medium break-all">
                                            {selectedApplicant.applicantEmail}
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Phone
                                        </p>
                                        <p className="text-sm font-medium">
                                            {selectedApplicant.applicantPhone}
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Gender
                                        </p>
                                        <p className="text-sm font-medium">
                                            {selectedApplicant.applicantGender === "M"
                                                ? "Male"
                                                : selectedApplicant.applicantGender === "F"
                                                    ? "Female"
                                                    : "Other"}
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Age
                                        </p>
                                        <p className="text-sm font-medium">
                                            {selectedApplicant.applicantAge} years
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Date of Birth
                                        </p>
                                        <p className="text-sm font-medium">
                                            {new Date(
                                                selectedApplicant.applicantDateOfBirth
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Location
                                        </p>
                                        <p className="text-sm font-medium">
                                            {selectedApplicant.applicantCity},
                                            {selectedApplicant.applicantState}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 bg-muted/50 p-3 rounded-lg">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Full Address
                                    </p>
                                    <p className="text-sm font-medium">
                                        {selectedApplicant.applicantAddress}, PIN{" "}
                                        {selectedApplicant.applicantPinCode},{" "}
                                        {selectedApplicant.applicantCity},{" "}
                                        {selectedApplicant.applicantState},{" "}
                                        {selectedApplicant.applicantCountry}
                                    </p>
                                </div>
                            </div>

                            {/* Experience */}
                            {selectedApplicant.applicantExperiences?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 text-sm">
                                        Work Experience
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedApplicant.applicantExperiences.map((exp) => (
                                            <div
                                                key={exp.applicantExperienceId}
                                                className="border-l-2 border-blue-500 bg-muted/30 p-4 rounded-r-lg"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-sm">
                                                            {exp.jobTitle}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {exp.previousCompany}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {exp.yearsOfExperience} yrs
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {new Date(exp.startDate).toLocaleDateString()} -{" "}
                                                    {new Date(exp.endDate).toLocaleDateString()}
                                                </p>
                                                {exp.jobDescription && (
                                                    <p className="text-xs leading-relaxed">
                                                        {exp.jobDescription}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {selectedApplicant.applicantEducations?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 text-sm">Education</h3>
                                    <div className="space-y-3">
                                        {selectedApplicant.applicantEducations.map((edu) => (
                                            <div
                                                key={edu.applicantEducationId}
                                                className="border-l-2 border-amber-500 bg-muted/30 p-4 rounded-r-lg"
                                            >
                                                <p className="font-semibold text-sm">{edu.degree}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {edu.institute}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {edu.city}, {edu.state} • {edu.country}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(edu.startDate).toLocaleDateString()} -{" "}
                                                    {new Date(edu.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {selectedApplicant.applicantSkills?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 text-sm">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedApplicant.applicantSkills.map((skill) => (
                                            <Badge
                                                key={skill.applicantSkillId}
                                                className="bg-purple-100 text-purple-900 hover:bg-purple-200"
                                            >
                                                {skill.skillName}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Documents */}
                            {selectedApplicant.applicantDocuments?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 text-sm">Documents</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedApplicant.applicantDocuments.map((doc) => (
                                            <div
                                                key={doc.hrDocumentId}
                                                className="flex items-center justify-between p-3 bg-muted border rounded-lg hover:bg-muted/80 transition"
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {doc.documentName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {doc.hrDocumentType}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDownloadDocument(
                                                            doc.documentUrl,
                                                            doc.documentName
                                                        )
                                                    }
                                                    className="ml-2"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                Unable to load applicant details
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default RecruitmentDetail;
