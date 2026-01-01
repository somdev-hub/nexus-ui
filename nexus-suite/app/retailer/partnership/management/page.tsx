"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  IconBuildingStore,
  IconFileInvoice,
  IconClock,
  IconChecks,
  IconUsers,
  IconPlus,
  IconEye,
  IconDownload
} from "@tabler/icons-react";

// Mock data - replace with actual data fetching
const quotationsRequested = [
  {
    id: "QR-001",
    supplier: "Global Logistics Inc.",
    type: "Logistics",
    requestDate: "2025-12-28",
    status: "pending",
    items: 5
  },
  {
    id: "QR-002",
    supplier: "Material Masters Co.",
    type: "Materials",
    requestDate: "2025-12-25",
    status: "pending",
    items: 3
  },
  {
    id: "QR-003",
    supplier: "Premium Suppliers Ltd.",
    type: "Supplier",
    requestDate: "2025-12-20",
    status: "received",
    items: 8
  }
];

const quotationsReceived = [
  {
    id: "QC-001",
    supplier: "Premium Suppliers Ltd.",
    type: "Supplier",
    receivedDate: "2025-12-29",
    validUntil: "2026-01-29",
    totalAmount: "$15,250.00",
    status: "active"
  },
  {
    id: "QC-002",
    supplier: "Express Logistics",
    type: "Logistics",
    receivedDate: "2025-12-27",
    validUntil: "2026-01-27",
    totalAmount: "$8,400.00",
    status: "active"
  },
  {
    id: "QC-003",
    supplier: "Quality Materials Inc.",
    type: "Materials",
    receivedDate: "2025-12-15",
    validUntil: "2026-01-05",
    totalAmount: "$22,100.00",
    status: "expiring"
  }
];

const currentPartners = [
  {
    id: "P-001",
    name: "Global Logistics Inc.",
    type: "Logistics",
    since: "2024-03-15",
    activeOrders: 12,
    totalSpent: "$125,400.00",
    rating: 4.8,
    status: "active"
  },
  {
    id: "P-002",
    name: "Material Masters Co.",
    type: "Materials",
    since: "2024-01-10",
    activeOrders: 8,
    totalSpent: "$89,200.00",
    rating: 4.6,
    status: "active"
  },
  {
    id: "P-003",
    name: "Premium Suppliers Ltd.",
    type: "Supplier",
    since: "2023-11-20",
    activeOrders: 15,
    totalSpent: "$205,800.00",
    rating: 4.9,
    status: "active"
  },
  {
    id: "P-004",
    name: "Express Logistics",
    type: "Logistics",
    since: "2024-06-05",
    activeOrders: 5,
    totalSpent: "$45,600.00",
    rating: 4.5,
    status: "active"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "pending":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "received":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "expiring":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    default:
      return "";
  }
};

export default function PartnershipPage() {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header Section */}
            <div className="px-4 lg:px-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Partnership Management
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Manage quotations, track partnerships, and grow your
                    business network
                  </p>
                </div>
                <Button className="w-fit">
                  <IconPlus className="size-4" />
                  Request New Quotation
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
              <Card className="@container/card p-4 gap-2">
                <CardHeader className="p-0">
                  <CardDescription>Active Partners</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {
                      currentPartners.filter((p) => p.status === "active")
                        .length
                    }
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconUsers className="size-4" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="p-0 flex-col items-start gap-1.5 text-sm">
                  <div className="text-muted-foreground">
                    Total partnership value: $466,000
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card p-4 gap-2">
                <CardHeader className="p-0">
                  <CardDescription>Pending Quotations</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {
                      quotationsRequested.filter((q) => q.status === "pending")
                        .length
                    }
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconClock className="size-4" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="p-0 flex-col items-start gap-1.5 text-sm">
                  <div className="text-muted-foreground">
                    Awaiting supplier response
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card p-4 gap-2">
                <CardHeader className="p-0">
                  <CardDescription>Active Quotations</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {
                      quotationsReceived.filter((q) => q.status === "active")
                        .length
                    }
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconFileInvoice className="size-4" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="p-0 flex-col items-start gap-1.5 text-sm">
                  <div className="text-muted-foreground">
                    Total value: $45,750
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card p-4 gap-2">
                <CardHeader className="p-0">
                  <CardDescription>Active Orders</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {currentPartners.reduce(
                      (sum, p) => sum + p.activeOrders,
                      0
                    )}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconChecks className="size-4" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="p-0 flex-col items-start gap-1.5 text-sm">
                  <div className="text-muted-foreground">
                    Across all partners
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Top Business Partners */}
            <div className="px-4 lg:px-6">
              <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                  <CardTitle className="p-0">Top Business Partners</CardTitle>
                  <CardDescription>
                    Partners ranked by total business volume
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Partner Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">
                          Total Spent
                        </TableHead>
                        <TableHead className="text-right">
                          Active Orders
                        </TableHead>
                        <TableHead className="text-right">
                          Avg Order Value
                        </TableHead>
                        <TableHead className="text-right">Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPartners
                        .sort((a, b) => {
                          const aAmount = parseFloat(
                            a.totalSpent.replace(/[$,]/g, "")
                          );
                          const bAmount = parseFloat(
                            b.totalSpent.replace(/[$,]/g, "")
                          );
                          return bAmount - aAmount;
                        })
                        .map((partner, index) => {
                          const totalSpent = parseFloat(
                            partner.totalSpent.replace(/[$,]/g, "")
                          );
                          const avgOrderValue = (
                            totalSpent / partner.activeOrders
                          ).toFixed(2);
                          return (
                            <TableRow key={partner.id}>
                              <TableCell className="font-bold text-lg">
                                <Badge variant="secondary">#{index + 1}</Badge>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {partner.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{partner.type}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-600">
                                {partner.totalSpent}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">
                                  {partner.activeOrders}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                ${avgOrderValue}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-yellow-500">★</span>
                                  <span className="font-medium">
                                    {partner.rating}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Main Content with Tabs */}
            <div className="px-4 lg:px-6">
              <Tabs defaultValue="requested" className="w-full">
                <TabsList>
                  <TabsTrigger value="requested">
                    <IconClock className="size-4" />
                    Quotations Requested
                  </TabsTrigger>
                  <TabsTrigger value="received">
                    <IconFileInvoice className="size-4" />
                    Quotations Received
                  </TabsTrigger>
                  <TabsTrigger value="partners">
                    <IconBuildingStore className="size-4" />
                    Current Partners
                  </TabsTrigger>
                </TabsList>

                {/* Quotations Requested Tab */}
                <TabsContent value="requested" className="mt-4">
                  <Card className="p-4 gap-2">
                    <CardHeader className="p-0">
                      <CardTitle className="p-0">
                        Requested Quotations
                      </CardTitle>
                      <CardDescription>
                        Track your quotation requests and their current status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Request ID</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Request Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotationsRequested.map((quotation) => (
                            <TableRow key={quotation.id}>
                              <TableCell className="font-medium">
                                {quotation.id}
                              </TableCell>
                              <TableCell>{quotation.supplier}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {quotation.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{quotation.requestDate}</TableCell>
                              <TableCell>{quotation.items}</TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusColor(quotation.status)}
                                >
                                  {quotation.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <IconEye className="size-4" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Quotations Received Tab */}
                <TabsContent value="received" className="mt-4">
                  <Card className="p-4 gap-2">
                    <CardHeader>
                      <CardTitle className="p-0">Received Quotations</CardTitle>
                      <CardDescription>
                        Review and manage quotations received from suppliers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quotation ID</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Received Date</TableHead>
                            <TableHead>Valid Until</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotationsReceived.map((quotation) => (
                            <TableRow key={quotation.id}>
                              <TableCell className="font-medium">
                                {quotation.id}
                              </TableCell>
                              <TableCell>{quotation.supplier}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {quotation.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{quotation.receivedDate}</TableCell>
                              <TableCell>{quotation.validUntil}</TableCell>
                              <TableCell className="font-semibold">
                                {quotation.totalAmount}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusColor(quotation.status)}
                                >
                                  {quotation.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm">
                                    <IconEye className="size-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <IconDownload className="size-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Current Partners Tab */}
                <TabsContent value="partners" className="mt-4">
                  <Card className="p-4 gap-2">
                    <CardHeader>
                      <CardTitle className="p-0">Current Partners</CardTitle>
                      <CardDescription>
                        Manage your active business partnerships and view
                        performance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Partner ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Partner Since</TableHead>
                            <TableHead>Active Orders</TableHead>
                            <TableHead>Total Spent</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPartners.map((partner) => (
                            <TableRow key={partner.id}>
                              <TableCell className="font-medium">
                                {partner.id}
                              </TableCell>
                              <TableCell className="font-medium">
                                {partner.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{partner.type}</Badge>
                              </TableCell>
                              <TableCell>{partner.since}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {partner.activeOrders}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {partner.totalSpent}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">★</span>
                                  <span>{partner.rating}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusColor(partner.status)}
                                >
                                  {partner.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <IconEye className="size-4" />
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
