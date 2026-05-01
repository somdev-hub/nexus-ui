"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Filter,
  MessageSquareMore,
  Plus,
  Search,
  Users
} from "lucide-react";
import { useOrgId } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import { getAllDepartments, getDeptRoles } from "@/lib/auth-service";
import { CreateHiringDialog } from "@/components/create-hiring-dialog";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type CreateHiringForm = {
  title: string;
  shortDescription: string;
  description: string;
  departmentName: string;
  deptId: number;
  roleName: string;
  roleId: number;
  openingTillDate: string;
  totalCompensation: string;
  hiringType: "PERMANENT" | "CONTRACT" | "INTERN" | "";
  hiringStatus: "OPEN" | "CLOSED" | "ON_HOLD" | "HIRED" | "";
};

type AnalyticsCard = {
  title: string;
  value: string;
  change: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
};

type OpenRecruitment = {
  requisitionId: string;
  role: string;
  department: string;
  hiringManager: string;
  applicants: number;
  stage: string;
  openedOn: string;
};

type PreviousRecruitment = {
  requisitionId: string;
  role: string;
  department: string;
  filledBy: string;
  closedOn: string;
  outcome: string;
  timeToFill: string;
};

// ============================================================================
// DATA
// ============================================================================

const analyticsCards: AnalyticsCard[] = [
  {
    title: "Open Roles",
    value: "18",
    change: "+4 from last month",
    note: "Active job openings",
    icon: BriefcaseBusiness
  },
  {
    title: "Applications",
    value: "246",
    change: "+54 this week",
    note: "Total applications received",
    icon: Users
  },
  {
    title: "Interviews",
    value: "34",
    change: "+8 scheduled",
    note: "Pending interviews",
    icon: MessageSquareMore
  },
  {
    title: "Offers Sent",
    value: "9",
    change: "2 accepted",
    note: "Outstanding offers",
    icon: FileText
  },
  {
    title: "Avg Time to Fill",
    value: "27 days",
    change: "-3 days vs average",
    note: "Average hiring duration",
    icon: CalendarClock
  },
  {
    title: "Offer Acceptance",
    value: "83%",
    change: "+5% this quarter",
    note: "Conversion rate",
    icon: CircleDollarSign
  }
];

const openRecruitments: OpenRecruitment[] = [
  {
    requisitionId: "REQ-2026-014",
    role: "Senior Frontend Engineer",
    department: "Engineering",
    hiringManager: "Alice Johnson",
    applicants: 42,
    stage: "Interview Loop",
    openedOn: "2026-04-15"
  },
  {
    requisitionId: "REQ-2026-018",
    role: "Product Manager",
    department: "Product",
    hiringManager: "Bob Smith",
    applicants: 28,
    stage: "Technical Screen",
    openedOn: "2026-04-20"
  },
  {
    requisitionId: "REQ-2026-025",
    role: "UX Designer",
    department: "Design",
    hiringManager: "Carol White",
    applicants: 35,
    stage: "Resume Review",
    openedOn: "2026-04-22"
  },
  {
    requisitionId: "REQ-2026-031",
    role: "QA Engineer",
    department: "Engineering",
    hiringManager: "David Brown",
    applicants: 19,
    stage: "Assessment",
    openedOn: "2026-04-25"
  }
];

const previousRecruitments: PreviousRecruitment[] = [
  {
    requisitionId: "REQ-2025-119",
    role: "Backend Engineer",
    department: "Engineering",
    filledBy: "John Doe",
    closedOn: "2026-03-10",
    outcome: "Successful",
    timeToFill: "35 days"
  },
  {
    requisitionId: "REQ-2025-128",
    role: "Data Analyst",
    department: "Analytics",
    filledBy: "Jane Smith",
    closedOn: "2026-03-15",
    outcome: "Successful",
    timeToFill: "42 days"
  },
  {
    requisitionId: "REQ-2025-135",
    role: "Sales Executive",
    department: "Sales",
    filledBy: "Pending",
    closedOn: "2026-03-20",
    outcome: "On Hold",
    timeToFill: "38 days"
  },
  {
    requisitionId: "REQ-2025-152",
    role: "DevOps Engineer",
    department: "Engineering",
    filledBy: "Mike Johnson",
    closedOn: "2026-03-25",
    outcome: "Successful",
    timeToFill: "28 days"
  }
];

// ============================================================================
// STYLING MAPS
// ============================================================================

const stageTone: Record<string, string> = {
  "Resume Review":
    "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Technical Screen":
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "Interview Loop":
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Assessment: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
};

const outcomeTone: Record<string, string> = {
  Successful:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "On Hold": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function includesText(source: string, query: string): boolean {
  return source.toLowerCase().includes(query.trim().toLowerCase());
}

function toggleValue(
  currentValues: string[],
  value: string,
  setter: (values: string[]) => void
) {
  setter(
    currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
  );
}

// ============================================================================
// MAIN RECRUITMENT COMPONENT
// ============================================================================

function Recruitment() {
  const [openSearch, setOpenSearch] = useState("");
  const [openDepartments, setOpenDepartments] = useState<string[]>([]);
  const [openStages, setOpenStages] = useState<string[]>([]);

  const [previousSearch, setPreviousSearch] = useState("");
  const [previousDepartments, setPreviousDepartments] = useState<string[]>([]);
  const [previousOutcomes, setPreviousOutcomes] = useState<string[]>([]);

  const openDepartmentOptions = useMemo(
    () => uniqueValues(openRecruitments.map((item) => item.department)),
    []
  );

  const openStageOptions = useMemo(
    () => uniqueValues(openRecruitments.map((item) => item.stage)),
    []
  );

  const previousDepartmentOptions = useMemo(
    () => uniqueValues(previousRecruitments.map((item) => item.department)),
    []
  );

  const previousOutcomeOptions = useMemo(
    () => uniqueValues(previousRecruitments.map((item) => item.outcome)),
    []
  );

  const filteredOpenRecruitments = useMemo(() => {
    return openRecruitments.filter((item) => {
      const matchesSearch =
        !openSearch.trim() ||
        includesText(item.requisitionId, openSearch) ||
        includesText(item.role, openSearch) ||
        includesText(item.department, openSearch) ||
        includesText(item.hiringManager, openSearch);

      const matchesDepartment =
        openDepartments.length === 0 ||
        openDepartments.includes(item.department);

      const matchesStage =
        openStages.length === 0 || openStages.includes(item.stage);

      return matchesSearch && matchesDepartment && matchesStage;
    });
  }, [openSearch, openDepartments, openStages]);

  const filteredPreviousRecruitments = useMemo(() => {
    return previousRecruitments.filter((item) => {
      const matchesSearch =
        !previousSearch.trim() ||
        includesText(item.requisitionId, previousSearch) ||
        includesText(item.role, previousSearch) ||
        includesText(item.department, previousSearch) ||
        includesText(item.filledBy, previousSearch);

      const matchesDepartment =
        previousDepartments.length === 0 ||
        previousDepartments.includes(item.department);

      const matchesOutcome =
        previousOutcomes.length === 0 ||
        previousOutcomes.includes(item.outcome);

      return matchesSearch && matchesDepartment && matchesOutcome;
    });
  }, [previousSearch, previousDepartments, previousOutcomes]);

  const openFilterCount =
    (openSearch.trim() !== "" ? 1 : 0) +
    openDepartments.length +
    openStages.length;

  const previousFilterCount =
    (previousSearch.trim() !== "" ? 1 : 0) +
    previousDepartments.length +
    previousOutcomes.length;

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-3 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recruitment</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Track open requisitions, monitor hiring activity, and review recent
            hiring outcomes from one place.
          </p>
        </div>
        <CreateHiringDialog smallButton={true} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analyticsCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="p-4 shadow-sm">
              <CardHeader className="p-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className="mt-3 text-3xl font-semibold tracking-tight">
                      {card.value}
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <p className="mt-4 text-sm font-medium text-foreground">
                  {card.change}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {card.note}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-6">
        <Card className="p-4 shadow-sm">
          <CardHeader className="p-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Open Recruitments
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Active requisitions currently in the hiring pipeline.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={openSearch}
                    onChange={(event) => setOpenSearch(event.target.value)}
                    placeholder="Search requisitions"
                    className="pl-9"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {openFilterCount > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                          {openFilterCount}
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Department</DropdownMenuLabel>
                    <div className="max-h-48 overflow-y-auto">
                      {openDepartmentOptions.map((department) => (
                        <DropdownMenuCheckboxItem
                          key={department}
                          checked={openDepartments.includes(department)}
                          onCheckedChange={() =>
                            toggleValue(
                              openDepartments,
                              department,
                              setOpenDepartments
                            )
                          }
                        >
                          {department}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel>Stage</DropdownMenuLabel>
                    <div className="max-h-48 overflow-y-auto">
                      {openStageOptions.map((stage) => (
                        <DropdownMenuCheckboxItem
                          key={stage}
                          checked={openStages.includes(stage)}
                          onCheckedChange={() =>
                            toggleValue(openStages, stage, setOpenStages)
                          }
                        >
                          {stage}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>

                    <DropdownMenuSeparator />

                    <div className="p-2 pt-1">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setOpenSearch("");
                          setOpenDepartments([]);
                          setOpenStages([]);
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <p className="mb-3 text-sm text-muted-foreground">
              Showing {filteredOpenRecruitments.length} of{" "}
              {openRecruitments.length}
            </p>
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Requisition</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Hiring Manager</TableHead>
                      <TableHead>Applicants</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Opened</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpenRecruitments.map((requisition) => (
                      <TableRow key={requisition.requisitionId}>
                        <TableCell className="font-medium">
                          {requisition.requisitionId}
                        </TableCell>
                        <TableCell>{requisition.role}</TableCell>
                        <TableCell>{requisition.department}</TableCell>
                        <TableCell>{requisition.hiringManager}</TableCell>
                        <TableCell>{requisition.applicants}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              stageTone[requisition.stage] ||
                              "bg-gray-100 text-gray-700"
                            }
                          >
                            {requisition.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>{requisition.openedOn}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredOpenRecruitments.length === 0 ? (
                  <div className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
                    No matching open recruitments found.
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 shadow-sm">
          <CardHeader className="p-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Previous Recruitments
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recently filled or closed requisitions and their outcomes.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={previousSearch}
                    onChange={(event) => setPreviousSearch(event.target.value)}
                    placeholder="Search history"
                    className="pl-9"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {previousFilterCount > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                          {previousFilterCount}
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Department</DropdownMenuLabel>
                    <div className="max-h-48 overflow-y-auto">
                      {previousDepartmentOptions.map((department) => (
                        <DropdownMenuCheckboxItem
                          key={department}
                          checked={previousDepartments.includes(department)}
                          onCheckedChange={() =>
                            toggleValue(
                              previousDepartments,
                              department,
                              setPreviousDepartments
                            )
                          }
                        >
                          {department}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel>Outcome</DropdownMenuLabel>
                    <div className="max-h-48 overflow-y-auto">
                      {previousOutcomeOptions.map((outcome) => (
                        <DropdownMenuCheckboxItem
                          key={outcome}
                          checked={previousOutcomes.includes(outcome)}
                          onCheckedChange={() =>
                            toggleValue(
                              previousOutcomes,
                              outcome,
                              setPreviousOutcomes
                            )
                          }
                        >
                          {outcome}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>

                    <DropdownMenuSeparator />

                    <div className="p-2 pt-1">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setPreviousSearch("");
                          setPreviousDepartments([]);
                          setPreviousOutcomes([]);
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <p className="mb-3 text-sm text-muted-foreground">
              Showing {filteredPreviousRecruitments.length} of{" "}
              {previousRecruitments.length}
            </p>
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Requisition</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Filled By</TableHead>
                      <TableHead>Closed On</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Time to Fill</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPreviousRecruitments.map((requisition) => (
                      <TableRow key={requisition.requisitionId}>
                        <TableCell className="font-medium">
                          {requisition.requisitionId}
                        </TableCell>
                        <TableCell>{requisition.role}</TableCell>
                        <TableCell>{requisition.department}</TableCell>
                        <TableCell>{requisition.filledBy}</TableCell>
                        <TableCell>{requisition.closedOn}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              outcomeTone[requisition.outcome] ||
                              "bg-gray-100 text-gray-700"
                            }
                          >
                            {requisition.outcome}
                          </Badge>
                        </TableCell>
                        <TableCell>{requisition.timeToFill}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPreviousRecruitments.length === 0 ? (
                  <div className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
                    No matching previous recruitments found.
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default Recruitment;
