"use client";

import { useState, useMemo, useEffect } from "react";
import { HRTable, type ColumnDef } from "@/components/hr-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from "lucide-react";
import {
  getRequestTypeLabel,
  getStatusLabel,
  type EmployeeRequest,
  type RequestStatus,
  transformHrRequestToEmployeeRequest
} from "./data";
import { Textarea } from "@/components/ui/textarea";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import {
  getHrRequests,
  getClosedHrRequests,
  getHrInsights
} from "@/lib/auth-service";

interface MetricCard {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export default function HrRequestsPage() {
  const { orgId } = useUserMetadata();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("");
  const [filterType, setFilterType] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<EmployeeRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [resolutionDecision, setResolutionDecision] = useState<
    "" | "APPROVE" | "REJECT" | "INSCRUTINY"
  >("");
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [closedRequests, setClosedRequests] = useState<EmployeeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState({
    openCases: 0,
    allHandledCases: 0,
    approvedCases: 0,
    inScrutinyCases: 0,
    rejectedCases: 0
  });

  // Pagination state
  const [currentPageRequests, setCurrentPageRequests] = useState(1);
  const [currentPageClosed, setCurrentPageClosed] = useState(1);
  const pageSize = 10;

  // Fetch HR requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      if (!orgId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch open and scrutiny requests (with pagination)
        const openResponse = await getHrRequests(
          Number(orgId),
          undefined,
          undefined,
          currentPageRequests - 1,
          pageSize
        );

        // Transform API response to EmployeeRequest format
        const transformedRequests = openResponse.content.map((item, index) =>
          transformHrRequestToEmployeeRequest(
            item,
            (currentPageRequests - 1) * pageSize + index + 1
          )
        );

        setRequests(transformedRequests);
      } catch (error) {
        console.error("Failed to fetch HR requests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [orgId, currentPageRequests]);

  // Fetch closed HR requests from API
  useEffect(() => {
    const fetchClosedRequests = async () => {
      if (!orgId) {
        return;
      }

      try {
        // Fetch closed requests (with pagination)
        const closedResponse = await getClosedHrRequests(
          Number(orgId),
          undefined,
          currentPageClosed - 1,
          pageSize
        );

        // Transform API response to EmployeeRequest format
        const transformedClosedRequests = closedResponse.content.map(
          (item, index) =>
            transformHrRequestToEmployeeRequest(
              item,
              (currentPageClosed - 1) * pageSize + index + 1
            )
        );

        setClosedRequests(transformedClosedRequests);
      } catch (error) {
        console.error("Failed to fetch closed HR requests:", error);
      }
    };

    fetchClosedRequests();
  }, [orgId, currentPageClosed]);

  // Fetch HR insights for metric cards
  useEffect(() => {
    const fetchInsights = async () => {
      if (!orgId) {
        return;
      }

      try {
        const insightsData = await getHrInsights(Number(orgId));
        setInsights(insightsData);
      } catch (error) {
        console.error("Failed to fetch HR insights:", error);
      }
    };

    fetchInsights();
  }, [orgId]);

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          (!filterStatus || request.currentStatus === filterStatus) &&
          (!filterType || request.requestType === filterType)
      ),
    [searchTerm, filterStatus, filterType, requests]
  );

  const filteredClosedRequests = useMemo(
    () =>
      closedRequests.filter(
        (request) =>
          request.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          (!filterType || request.requestType === filterType)
      ),
    [searchTerm, filterType, closedRequests]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPageRequests(1);
  }, [searchTerm, filterStatus, filterType]);

  useEffect(() => {
    setCurrentPageClosed(1);
  }, [searchTerm, filterType]);

  const metricCards: MetricCard[] = [
    {
      title: "Pending Requests",
      value: insights.openCases,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "Approved",
      value: insights.approvedCases,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "Rejected",
      value: insights.rejectedCases,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      title: "In Scrutiny",
      value: insights.inScrutinyCases,
      icon: AlertCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total Cases Handled",
      value: insights.allHandledCases,
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  const handleViewDetails = (request: EmployeeRequest) => {
    setSelectedRequest(request);
    setResolutionDecision("");
    setResolutionRemarks("");
    setDetailsDialogOpen(true);
  };

  const handleDecision = () => {
    if (!resolutionDecision) {
      alert("Please select a decision");
      return;
    }
    console.log("Decision made:", {
      requestId: selectedRequest?.id,
      decision: resolutionDecision,
      remarks: resolutionRemarks
    });
    setDetailsDialogOpen(false);
  };

  const columns: ColumnDef<EmployeeRequest>[] = [
    {
      accessorKey: "slNo",
      header: "SL No",
      cell: (row: EmployeeRequest) => (
        <div className="text-center">{row.slNo}</div>
      )
    },
    {
      accessorKey: "employeeName",
      header: "Employee Name"
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: (row: EmployeeRequest) => (
        <div>{row.employeeId.replace(/^emp/i, "")}</div>
      )
    },
    {
      accessorKey: "requestReceivedDate",
      header: "Request Received Date",
      cell: (row: EmployeeRequest) => {
        const date = new Date(row.requestReceivedDate);
        return date.toLocaleDateString("en-IN");
      }
    },
    {
      accessorKey: "requestType",
      header: "Request Type",
      cell: (row: EmployeeRequest) => (
        <div className="text-sm">{getRequestTypeLabel(row.requestType)}</div>
      )
    },
    {
      accessorKey: "currentStatus",
      header: "Current Status",
      cell: (row: EmployeeRequest) => {
        const statusColors: Record<RequestStatus, string> = {
          OPEN: "bg-amber-100 text-amber-800",
          APPROVED: "bg-green-100 text-green-800",
          REJECTED: "bg-red-100 text-red-800",
          SCRUTINY: "bg-blue-100 text-blue-800",
          CLOSED: "bg-gray-100 text-gray-800"
        };
        return (
          <Badge className={`${statusColors[row.currentStatus]}`}>
            {getStatusLabel(row.currentStatus)}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: EmployeeRequest) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            title="View Details"
            onClick={() => handleViewDetails(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Requests</h1>
        <p className="text-gray-600 mt-2">
          Manage leave applications, salary advances, resignations, and other
          employee requests
        </p>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="p-4">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-0">
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table Section */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            View and manage all employee requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:gap-4">
              <Input
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select
                value={filterStatus || "all"}
                onValueChange={(value) =>
                  setFilterStatus(
                    value === "all" ? "" : (value as RequestStatus)
                  )
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SCRUTINY">In Scrutiny</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterType || "all"}
                onValueChange={(value) =>
                  setFilterType(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="LEAVE_APPLICATION">
                    Leave Application
                  </SelectItem>
                  <SelectItem value="SALARY_ADVANCE">Salary Advance</SelectItem>
                  <SelectItem value="RESIGNATION">Resignation</SelectItem>
                  <SelectItem value="TRANSFER_REQUEST">
                    Transfer Request
                  </SelectItem>
                  <SelectItem value="PROMOTION_REQUEST">
                    Promotion Request
                  </SelectItem>
                  <SelectItem value="TRAINING_REQUEST">
                    Training Request
                  </SelectItem>
                  <SelectItem value="BULK_REGULARIZATION">
                    Bulk Regularization
                  </SelectItem>
                  <SelectItem value="WEEKLY_OFF">Weekly Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading requests...
            </div>
          ) : (
            <>
              <HRTable<EmployeeRequest>
                columns={columns}
                data={filteredRequests}
              />
              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {filteredRequests.length > 0 ? "current page" : "no"}{" "}
                  results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPageRequests((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPageRequests === 1}
                  >
                    Previous
                  </Button>
                  <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                    Page {currentPageRequests}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageRequests((prev) => prev + 1)}
                    disabled={filteredRequests.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Closed Cases Table */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>Closed Cases</CardTitle>
          <CardDescription>
            Approved and rejected employee requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters for Closed Cases */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:gap-4">
              <Input
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select
                value={filterType || "all"}
                onValueChange={(value) =>
                  setFilterType(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="LEAVE_APPLICATION">
                    Leave Application
                  </SelectItem>
                  <SelectItem value="SALARY_ADVANCE">Salary Advance</SelectItem>
                  <SelectItem value="RESIGNATION">Resignation</SelectItem>
                  <SelectItem value="TRANSFER_REQUEST">
                    Transfer Request
                  </SelectItem>
                  <SelectItem value="PROMOTION_REQUEST">
                    Promotion Request
                  </SelectItem>
                  <SelectItem value="TRAINING_REQUEST">
                    Training Request
                  </SelectItem>
                  <SelectItem value="BULK_REGULARIZATION">
                    Bulk Regularization
                  </SelectItem>
                  <SelectItem value="WEEKLY_OFF">Weekly Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Closed Cases Table */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading requests...
            </div>
          ) : (
            <>
              <HRTable<EmployeeRequest>
                columns={columns}
                data={filteredClosedRequests}
              />
              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {filteredClosedRequests.length > 0 ? "current page" : "no"}{" "}
                  results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPageClosed((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPageClosed === 1}
                  >
                    Previous
                  </Button>
                  <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                    Page {currentPageClosed}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageClosed((prev) => prev + 1)}
                    disabled={filteredClosedRequests.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Complete information about the employee request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Employee Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Employee Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Employee Name
                    </p>
                    <p className="text-sm font-medium">
                      {selectedRequest.employeeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Employee ID
                    </p>
                    <p className="text-sm font-medium">
                      {selectedRequest.employeeId.replace(/^emp/i, "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Department
                    </p>
                    <p className="text-sm font-medium">
                      {selectedRequest.department || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Role</p>
                    <p className="text-sm font-medium">
                      {selectedRequest.role || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Request Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Request Type
                    </p>
                    <p className="text-sm font-medium">
                      {getRequestTypeLabel(selectedRequest.requestType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Request Received Date
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(
                        selectedRequest.requestReceivedDate
                      ).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status and Reason */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Status & Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Current Status
                    </p>
                    <div className="mt-1">
                      <Badge className="bg-blue-100 text-blue-800">
                        {selectedRequest.currentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedRequest.remarks && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Remarks
                  </h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedRequest.remarks}
                  </p>
                </div>
              )}

              {/* Leave Application Details */}
              {selectedRequest.requestType === "LEAVE_APPLICATION" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Leave Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        From Date
                      </p>
                      <p className="text-sm font-medium">
                        {selectedRequest.fromDate
                          ? new Date(
                              selectedRequest.fromDate
                            ).toLocaleDateString("en-IN")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">To Date</p>
                      <p className="text-sm font-medium">
                        {selectedRequest.toDate
                          ? new Date(selectedRequest.toDate).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Leave Balance Used
                      </p>
                      <p className="text-sm font-medium">
                        {selectedRequest.leaveBalanceUsed || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Leave Type
                      </p>
                      <p className="text-sm font-medium">
                        {selectedRequest.leaveBalanceType || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Off / Bulk Regularization Details */}
              {(selectedRequest.requestType === "WEEKLY_OFF" ||
                selectedRequest.requestType === "BULK_REGULARIZATION") &&
                selectedRequest.checkInHours && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Attendance Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Check-In Hours
                        </p>
                        <p className="text-sm font-medium">
                          {selectedRequest.checkInHours || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Check-Out Hours
                        </p>
                        <p className="text-sm font-medium">
                          {selectedRequest.checkOutHours || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Resolution Section for Pending Requests */}
              {(selectedRequest.currentStatus === "OPEN" ||
                selectedRequest.currentStatus === "SCRUTINY") && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Resolution
                  </h3>
                  <div className="space-y-4">
                    <Select
                      value={resolutionDecision}
                      onValueChange={(value) =>
                        setResolutionDecision(
                          value as "" | "APPROVE" | "REJECT" | "INSCRUTINY"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVE">Approve</SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                        <SelectItem value="INSCRUTINY">
                          Put in Scrutiny
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">
                        Remarks
                      </label>
                      <Textarea
                        value={resolutionRemarks}
                        onChange={(e) => setResolutionRemarks(e.target.value)}
                        placeholder="Add remarks (optional)"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDetailsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleDecision}>Submit Decision</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
