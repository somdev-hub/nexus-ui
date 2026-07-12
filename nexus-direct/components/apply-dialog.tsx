"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import {
    getApplicant,
    applyForRecruitment,
    addApplicantDocument,
} from "@/lib/auth-service";
import { Applicant } from "@/types";
import {
    Send,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    FileUp,
    CheckCircle2,
    AlertCircle,
    Briefcase,
    GraduationCap,
    Award,
    SquareArrowOutUpRight,
} from "lucide-react";

interface ApplyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recruitmentId: number;
    recruitmentTitle: string;
    orgName: string;
}

const ApplyDialog = ({
    open,
    onOpenChange,
    recruitmentId,
    recruitmentTitle,
    orgName,
}: ApplyDialogProps) => {
    const { userId } = useUserMetadata();
    const { toast } = useToast();

    // Applicant data
    const [applicant, setApplicant] = useState<Applicant | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // Document selection
    const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

    // Upload new document
    const [uploadingDoc, setUploadingDoc] = useState(false);

    // Apply submission
    const [submitting, setSubmitting] = useState(false);

    // Cover letter / note
    const [coverNote, setCoverNote] = useState("");

    // Track whether we've already fetched for this open session
    const hasFetchedRef = useRef(false);

    // Fetch applicant profile when dialog opens
    const fetchApplicant = useCallback(async () => {
        if (!userId) return;
        setLoadingProfile(true);
        try {
            const data = await getApplicant(Number(userId));
            setApplicant(data);
        } catch {
            toast({
                title: "Error",
                description: "Failed to load your profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoadingProfile(false);
        }
    }, [userId, toast]);

    useEffect(() => {
        if (open && userId && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchApplicant();
            setSelectedDocIds([]);
            setCoverNote("");
        }
        if (!open) {
            hasFetchedRef.current = false;
        }
    }, [open, userId, fetchApplicant]);

    // Toggle document selection
    const toggleDocument = (docId: number) => {
        setSelectedDocIds((prev) =>
            prev.includes(docId)
                ? prev.filter((id) => id !== docId)
                : [...prev, docId]
        );
    };

    // Upload new document
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            toast({
                title: "Invalid file",
                description: "Please upload a PDF file.",
                variant: "destructive",
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Document must be under 5MB.",
                variant: "destructive",
            });
            return;
        }

        setUploadingDoc(true);
        try {
            const response = await addApplicantDocument(Number(userId), file);
            if (response.status === 200) {
                toast({
                    title: "Document Uploaded",
                    description: "Your document has been uploaded successfully.",
                });
                await fetchApplicant();
            } else {
                toast({
                    title: "Upload Failed",
                    description: "Could not upload document. Please try again.",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Upload Failed",
                description: "Could not upload document. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploadingDoc(false);
            e.target.value = "";
        }
    };

    // Submit application
    const handleSubmit = async () => {
        if (!userId) {
            toast({
                title: "Authentication Required",
                description: "Please log in to apply for this position.",
                variant: "destructive",
            });
            return;
        }

        if (selectedDocIds.length === 0) {
            toast({
                title: "Documents Required",
                description: "Please select at least one document (e.g., your resume) to submit your application.",
                variant: "warning",
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await applyForRecruitment(
                Number(userId),
                recruitmentId,
                selectedDocIds
            );

            if (response.status === 200 || response.status === 201) {
                toast({
                    title: "Application Submitted!",
                    description: `Your application for ${recruitmentTitle} at ${orgName} has been submitted successfully.`,
                });
                onOpenChange(false);
            } else {
                toast({
                    title: "Submission Failed",
                    description: "Could not submit your application. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error: unknown) {
            toast({
                title: "Submission Failed",
                description:
                    "Could not submit your application: " +
                    (error as Error).message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Get all documents
    const allDocuments = applicant?.applicantDocuments || [];

    const getDocumentIcon = (docType: string) => {
        switch (docType?.toUpperCase()) {
            case "RESUME":
                return <FileText className="h-4 w-4 text-red-500" />;
            case "COVER_LETTER":
                return <FileText className="h-4 w-4 text-blue-500" />;
            case "CERTIFICATE":
                return <Award className="h-4 w-4 text-green-500" />;
            default:
                return <FileText className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getDocumentTypeLabel = (docType: string) => {
        switch (docType?.toUpperCase()) {
            case "RESUME":
                return "Resume";
            case "COVER_LETTER":
                return "Cover Letter";
            case "CERTIFICATE":
                return "Certificate";
            default:
                return docType || "Document";
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                    {/* Header */}
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Apply for Position
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1.5">
                            You are applying for{" "}
                            <span className="font-semibold text-foreground">
                                {recruitmentTitle}
                            </span>{" "}
                            at{" "}
                            <span className="font-semibold text-foreground">
                                {orgName}
                            </span>
                            . Please review your profile and select documents to
                            submit.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Body */}
                    <div className="px-6 py-4 space-y-6">
                        {/* Profile Summary */}
                        {loadingProfile ? (
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-4 w-40" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : applicant ? (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-medium text-sm">
                                        Your Profile
                                    </h4>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Verified
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-lg border bg-muted/20">
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="h-3 w-3" /> Name
                                        </p>
                                        <p className="text-sm font-medium">
                                            {applicant.applicantFirstName}{" "}
                                            {applicant.applicantLastName}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> Email
                                        </p>
                                        <p className="text-sm font-medium truncate">
                                            {applicant.applicantEmail}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> Phone
                                        </p>
                                        <p className="text-sm font-medium">
                                            {applicant.applicantPhone || "—"}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />{" "}
                                            Location
                                        </p>
                                        <p className="text-sm font-medium truncate">
                                            {[
                                                applicant.applicantCity,
                                                applicant.applicantState,
                                                applicant.applicantCountry,
                                            ]
                                                .filter(Boolean)
                                                .join(", ") || "—"}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />{" "}
                                            DOB
                                        </p>
                                        <p className="text-sm font-medium">
                                            {applicant.applicantDateOfBirth ||
                                                "—"}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />{" "}
                                            Experience
                                        </p>
                                        <p className="text-sm font-medium">
                                            {applicant.applicantExperiences
                                                ?.length || 0}{" "}
                                            positions
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <GraduationCap className="h-3 w-3" />{" "}
                                            Education
                                        </p>
                                        <p className="text-sm font-medium">
                                            {applicant.applicantEducations
                                                ?.length || 0}{" "}
                                            entries
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Award className="h-3 w-3" /> Skills
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {applicant.applicantSkills?.length >
                                                0 ? (
                                                applicant.applicantSkills
                                                    .slice(0, 3)
                                                    .map((s) => (
                                                        <Badge
                                                            key={
                                                                s.applicantSkillId
                                                            }
                                                            variant="outline"
                                                            className="text-xs py-0 px-1.5"
                                                        >
                                                            {s.skillName}
                                                        </Badge>
                                                    ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                            {(applicant.applicantSkills
                                                ?.length || 0) > 3 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs py-0 px-1.5"
                                                    >
                                                        +
                                                        {applicant.applicantSkills!
                                                            .length - 3}{" "}
                                                        more
                                                    </Badge>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
                                <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    No profile found
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Please complete your profile before applying.
                                </p>
                            </div>
                        )}

                        <Separator />

                        {/* Document Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-medium text-sm">
                                        Select Documents to Submit
                                    </h4>
                                </div>
                                <Badge
                                    variant={
                                        selectedDocIds.length > 0
                                            ? "default"
                                            : "outline"
                                    }
                                    className="text-xs"
                                >
                                    {selectedDocIds.length} selected
                                </Badge>
                            </div>

                            {loadingProfile ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <Skeleton
                                            key={i}
                                            className="h-16 w-full rounded-lg"
                                        />
                                    ))}
                                </div>
                            ) : allDocuments.length > 0 ? (
                                <div className="space-y-2">
                                    {allDocuments.map((doc) => {
                                        const isSelected =
                                            selectedDocIds.includes(
                                                doc.hrDocumentId!
                                            );
                                        return (
                                            <div
                                                key={doc.hrDocumentId}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "hover:bg-muted/50 hover:border-muted-foreground/30"
                                                    }`}
                                                onClick={() =>
                                                    toggleDocument(
                                                        doc.hrDocumentId!
                                                    )
                                                }
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        toggleDocument(
                                                            doc.hrDocumentId!
                                                        )
                                                    }
                                                    className="shrink-0"
                                                />
                                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    {getDocumentIcon(
                                                        doc.hrDocumentType
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {doc.documentName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {getDocumentTypeLabel(
                                                            doc.hrDocumentType
                                                        )}
                                                        {" • "}
                                                        Uploaded{" "}
                                                        {doc.createdOn
                                                            ? new Date(
                                                                doc.createdOn
                                                            ).toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                }
                                                            )
                                                            : "—"}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                                    asChild
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <a
                                                        href={doc.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <SquareArrowOutUpRight className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center border rounded-lg border-dashed">
                                    <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No documents uploaded yet
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Upload your resume below to apply.
                                    </p>
                                </div>
                            )}

                            {/* Upload New Document */}
                            <div className="mt-3">
                                <label
                                    className={`flex w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-3 text-sm font-medium text-muted-foreground transition-colors ${uploadingDoc
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                        }`}
                                >
                                    {uploadingDoc ? (
                                        <span className="flex items-center gap-2">
                                            <Spinner />
                                            Uploading...
                                        </span>
                                    ) : (
                                        <>
                                            <FileUp className="h-4 w-4 mr-2" />
                                            Upload New Document
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={uploadingDoc}
                                    />
                                </label>
                                <p className="text-xs text-muted-foreground text-center mt-1.5">
                                    PDF only, max 5MB
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Cover Note */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Send className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-medium text-sm">
                                    Cover Note{" "}
                                    <span className="text-muted-foreground font-normal">
                                        (optional)
                                    </span>
                                </h4>
                            </div>
                            <Textarea
                                placeholder="Add a brief note to the hiring team about why you're a great fit for this role..."
                                value={coverNote}
                                onChange={(e) => setCoverNote(e.target.value)}
                                className="min-h-24 resize-none"
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right mt-1">
                                {coverNote.length}/500
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="px-6 py-4 border-t bg-muted/20 flex flex-col sm:flex-row gap-3 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                            className="sm:order-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                submitting ||
                                loadingProfile ||
                                !applicant ||
                                selectedDocIds.length === 0
                            }
                            className="gap-2 sm:order-2"
                        >
                            {submitting ? (
                                <>
                                    <Spinner />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ApplyDialog;