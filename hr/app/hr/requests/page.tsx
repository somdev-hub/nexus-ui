"use client";

import { useState, useMemo } from "react";
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
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from "lucide-react";
import {
  requests,
  getRequestMetrics,
  getRequestTypeLabel,
  type EmployeeRequest,
  type RequestStatus
} from "./data";
import { Textarea } from "@/components/ui/textarea";

interface MetricCard {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export default function HrRequestsPage() {
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

  const filteredRequests = useMemo(
    () =>
      requests
        .filter(
          (request) =>
            request.employeeName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) &&
            (!filterStatus || request.currentStatus === filterStatus) &&
            (!filterType || request.requestType === filterType)
        )
        .filter(
          (request) =>
            request.currentStatus === "Pending" ||
            request.currentStatus === "In Scrutiny"
        ),
    [searchTerm, filterStatus, filterType]
  );

  const filteredClosedRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          (!filterType || request.requestType === filterType) &&
          (request.currentStatus === "Approved" ||
            request.currentStatus === "Rejected")
      ),
    [searchTerm, filterType]
  );

  const metrics = getRequestMetrics(requests);

  const metricCards: MetricCard[] = [
    {
      title: "Pending Requests",
      value: metrics.pending,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "Approved",
      value: metrics.approved,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "Rejected",
      value: metrics.rejected,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      title: "In Scrutiny",
      value: metrics.inScrutiny,
      icon: AlertCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total Cases Handled",
      value: metrics.total,
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

  const handleApprove = (request: EmployeeRequest) => {
    console.log("Approved request:", request.id, {
      resolutionDecision,
      resolutionRemarks
    });
    // Add approval logic here
  };

  const handleReject = (request: EmployeeRequest) => {
    console.log("Rejected request:", request.id, {
      resolutionDecision,
      resolutionRemarks
    });
    // Add rejection logic here
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
      header: "Employee ID"
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
          Pending: "bg-amber-100 text-amber-800",
          Approved: "bg-green-100 text-green-800",
          Rejected: "bg-red-100 text-red-800",
          "In Scrutiny": "bg-blue-100 text-blue-800"
        };
        return (
          <Badge className={`${statusColors[row.currentStatus]}`}>
            {row.currentStatus}
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
          {row.currentStatus === "Pending" ||
          row.currentStatus === "In Scrutiny" ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                title="Approve"
                className="text-green-500 hover:text-green-700"
                onClick={() => handleApprove(row)}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Reject"
                className="text-red-500 hover:text-red-700"
                onClick={() => handleReject(row)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : null}
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
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="In Scrutiny">In Scrutiny</SelectItem>
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
          <HRTable<EmployeeRequest>
            columns={columns}
            data={filteredRequests}
            searchPlaceholder="Search requests..."
          />
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
          <HRTable<EmployeeRequest>
            columns={columns}
            data={filteredClosedRequests}
            searchPlaceholder="Search closed cases..."
          />
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
                      {selectedRequest.employeeId}
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
                selectedRequest.requestType === "BULK_REGULARIZATION") && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {selectedRequest.requestType === "WEEKLY_OFF"
                      ? "Weekly Off Details"
                      : "Regularization Details"}
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
                        Check In Hours
                      </p>
                      <p className="text-sm font-medium">
                        {selectedRequest.checkInHours || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Check Out Hours
                      </p>
                      <p className="text-sm font-medium">
                        {selectedRequest.checkOutHours || "-"}
                      </p>
                    </div>
                    {selectedRequest.requestType === "WEEKLY_OFF" && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Half Day
                        </p>
                        <p className="text-sm font-medium">
                          {selectedRequest.halfDay ? "Yes" : "No"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comment */}
              {selectedRequest.comment && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    HR Comment
                  </h3>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded">
                    {selectedRequest.comment}
                  </p>
                </div>
              )}

              {/* Resolution Section */}
              {selectedRequest.currentStatus === "Pending" ||
              selectedRequest.currentStatus === "In Scrutiny" ? (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Resolution
                  </h3>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Decision
                    </label>
                    <Select
                      value={resolutionDecision}
                      onValueChange={(value) =>
                        setResolutionDecision(
                          value as "APPROVE" | "REJECT" | "INSCRUTINY"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVE">Approve</SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                        <SelectItem value="INSCRUTINY">In Scrutiny</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Resolution Remarks
                    </label>
                    <Textarea
                      placeholder="Enter your resolution remarks..."
                      value={resolutionRemarks}
                      onChange={(e) => setResolutionRemarks(e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              {selectedRequest.currentStatus === "Pending" ||
              selectedRequest.currentStatus === "In Scrutiny" ? (
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleDecision}
                    disabled={!resolutionDecision}
                  >
                    Submit Decision
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
