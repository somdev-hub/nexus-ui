"use client";

import * as React from "react";
import { Loader2, RefreshCw, Bell, Building2, AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { TimeRange, TimeRangeSelector, getDateRangeFromTimeRange } from "@/components/time-range-selector";
import {
  fetchNotificationAnalytics,
  fetchOrgStats,
  fetchTimeline,
  fetchOutboxRetried,
  fetchOutboxFailed,
} from "@/lib/notification-analytics";
import type {
  NotificationAnalyticsData,
  NotificationTimelineEntry,
} from "@/types/notification-analytics";
import type { PaginatedResponse } from "@/lib/notification-analytics";

// ---------------------------------------------------------------------------
// Reusable pagination controls
// ---------------------------------------------------------------------------

function TablePagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <span className="text-sm text-muted-foreground">
        {totalElements} total
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-sm">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Birds-eye view components
// ---------------------------------------------------------------------------

function OverviewCards({ data }: { data: NotificationAnalyticsData }) {
  const o = data.overview;
  const cards = [
    { label: "Total Notifications", value: o.totalNotifications.toLocaleString(), icon: Bell, color: "text-blue-500" },
    { label: "Organisations", value: o.totalOrgs.toLocaleString(), icon: Building2, color: "text-purple-500" },
    { label: "Total Users", value: o.totalUsers.toLocaleString(), icon: Users, color: "text-green-500" },
    { label: "Unread", value: o.unreadCount.toLocaleString(), icon: AlertTriangle, color: "text-amber-500" },
    { label: "Read Rate", value: `${o.readRate.toFixed(1)}%`, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Avg Delivery Lag", value: `${o.avgDeliveryLagMs}ms`, icon: Clock, color: "text-cyan-500" },
    { label: "Realtime Delivery", value: `${o.realtimeDeliveryRate.toFixed(1)}%`, icon: Zap, color: "text-yellow-500" },
    { label: "Failures", value: o.failureCount.toLocaleString(), icon: AlertTriangle, color: "text-red-500" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>{c.label}</CardDescription>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: NotificationAnalyticsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Volume Trend</CardTitle>
        <CardDescription>Daily notification count over the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <LineChart data={data.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Total" />
            <Line type="monotone" dataKey="read" stroke="#22c55e" strokeWidth={2} name="Read" />
            <Line type="monotone" dataKey="unread" stroke="#f59e0b" strokeWidth={2} name="Unread" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DeliveryPieChart({ data }: { data: NotificationAnalyticsData }) {
  const pieData = [
    { name: "Delivered", value: data.delivery.totalDelivered, fill: "#22c55e" },
    { name: "Pending", value: data.delivery.totalPending, fill: "#f59e0b" },
    { name: "Failed", value: data.delivery.totalFailed, fill: "#ef4444" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Status</CardTitle>
        <CardDescription>Realtime STOMP delivery breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer config={{}} className="h-[250px] w-[250px]">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function SeverityPieChart({ data }: { data: NotificationAnalyticsData }) {
  const colors: Record<string, string> = {
    INFO: "#3b82f6",
    WARNING: "#f59e0b",
    CRITICAL: "#ef4444",
    ACTION_REQUIRED: "#8b5cf6",
  };
  const pieData = data.severityStats.map((s) => ({
    name: s.severity,
    value: s.count,
    fill: colors[s.severity] || "#6b7280",
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Severity Distribution</CardTitle>
        <CardDescription>Notifications by severity level</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer config={{}} className="h-[250px] w-[250px]">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DeliveryMetricsCard({ data }: { data: NotificationAnalyticsData }) {
  const d = data.delivery;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Performance</CardTitle>
        <CardDescription>STOMP realtime delivery metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Delivery Rate</p>
            <p className="text-2xl font-bold">{d.deliveryRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Lag</p>
            <p className="text-2xl font-bold">{d.avgDeliveryLagMs}ms</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">P95 Lag</p>
            <p className="text-2xl font-bold">{d.p95DeliveryLagMs}ms</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">P99 Lag</p>
            <p className="text-2xl font-bold">{d.p99DeliveryLagMs}ms</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{d.totalDelivered.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{d.totalPending.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600">{d.totalFailed.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Paginated table components
// ---------------------------------------------------------------------------

function OrgBreakdownTable({
  data,
  page,
  onPageChange,
}: {
  data: PaginatedResponse<import("@/types/notification-analytics").OrgNotificationStats>;
  page: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications by Organisation</CardTitle>
        <CardDescription>Per-org notification volume and read rates</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Unread</TableHead>
              <TableHead className="text-right">Read Rate</TableHead>
              <TableHead className="text-right">Avg Lag (ms)</TableHead>
              <TableHead>Last Notification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((org: any) => (
              <TableRow key={org.orgId}>
                <TableCell className="font-medium">{org.orgName}</TableCell>
                <TableCell className="text-right">{org.totalNotifications.toLocaleString()}</TableCell>
                <TableCell className="text-right">{org.unreadCount.toLocaleString()}</TableCell>
                <TableCell className="text-right">{org.readRate.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{org.avgDeliveryLagMs}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(org.lastNotificationAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

function EventTypeChart({ data }: { data: NotificationAnalyticsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications by Event Type</CardTitle>
        <CardDescription>Volume and delivery lag per event type</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[350px]">
          <BarChart data={data.eventTypeStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="displayName" type="category" width={140} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="#3b82f6" name="Count" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function EventTypeTable({
  data,
  page,
  onPageChange,
}: {
  data: NotificationAnalyticsData;
  page: number;
  onPageChange: (p: number) => void;
}) {
  const pageSize = 5;
  const total = data.eventTypeStats.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = page * pageSize;
  const pageData = data.eventTypeStats.slice(start, start + pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Type Details</CardTitle>
        <CardDescription>Microscopic breakdown per event type (aggregated)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Share</TableHead>
              <TableHead className="text-right">Avg Lag (ms)</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((et) => (
              <TableRow key={et.eventType}>
                <TableCell>
                  <div className="font-medium">{et.displayName}</div>
                  <div className="text-xs text-muted-foreground">{et.eventType}</div>
                </TableCell>
                <TableCell className="text-right">{et.count.toLocaleString()}</TableCell>
                <TableCell className="text-right">{et.percentage.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{et.avgDeliveryLagMs}</TableCell>
                <TableCell>
                  <Badge variant={et.severity === "CRITICAL" ? "destructive" : et.severity === "WARNING" ? "secondary" : "outline"}>
                    {et.severity}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalElements={total}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

function NotificationTimeline({
  data,
  page,
  onPageChange,
}: {
  data: PaginatedResponse<NotificationTimelineEntry>;
  page: number;
  onPageChange: (p: number) => void;
}) {
  const statusColor: Record<string, string> = {
    DELIVERED: "text-green-600",
    PENDING: "text-amber-600",
    FAILED: "text-red-600",
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>Microscopic view of individual notification deliveries</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Org</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">Read</TableHead>
              <TableHead className="text-right">Lag (ms)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((n: any) => (
              <TableRow key={n.notificationId}>
                <TableCell className="font-mono text-xs">{n.notificationId}</TableCell>
                <TableCell className="text-xs">{n.eventType}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{n.title}</TableCell>
                <TableCell className="text-xs">{n.targetOrgName}</TableCell>
                <TableCell>
                  <Badge variant={n.severity === "CRITICAL" ? "destructive" : n.severity === "WARNING" ? "secondary" : "outline"}>
                    {n.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs">{n.readCount}/{n.totalRecipients}</TableCell>
                <TableCell className="text-right text-xs">{n.deliveryLagMs > 0 ? n.deliveryLagMs : "—"}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${statusColor[n.deliveryStatus]}`}>
                    {n.deliveryStatus}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Outbox components
// ---------------------------------------------------------------------------

function OutboxSummaryCards({ data }: { data: NotificationAnalyticsData }) {
  const s = data.outboxSummary;
  const cards = [
    { label: "Total Outbox Rows", value: s.total.toLocaleString(), color: "text-blue-500" },
    { label: "Direct via Kafka", value: s.directKafka.toLocaleString(), color: "text-green-500" },
    { label: "Picked up by Lookup (Retry)", value: s.retriedLookup.toLocaleString(), color: "text-amber-500" },
    { label: "Gave Up (Failed)", value: s.gaveUp.toLocaleString(), color: "text-red-500" },
    { label: "Pending", value: s.pending.toLocaleString(), color: "text-purple-500" },
  ];
  return (
    <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2">
            <CardDescription>{c.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OutboxPieChart({ data }: { data: NotificationAnalyticsData }) {
  const s = data.outboxSummary;
  const pieData = [
    { name: "Direct (Kafka)", value: s.directKafka, fill: "#22c55e" },
    { name: "Retried (Lookup)", value: s.retriedLookup, fill: "#f59e0b" },
    { name: "Failed", value: s.gaveUp, fill: "#ef4444" },
    { name: "Pending", value: s.pending, fill: "#8b5cf6" },
  ].filter((d) => d.value > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Path</CardTitle>
        <CardDescription>Direct via Kafka vs picked up by lookup (retry)</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer config={{}} className="h-[250px] w-[250px]">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function OutboxEventTypeChart({ data }: { data: NotificationAnalyticsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outbox by Event Type</CardTitle>
        <CardDescription>Direct vs retried vs failed per event type</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[350px]">
          <BarChart data={data.outboxByEventType} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="eventType" type="category" width={180} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="direct" stackId="a" fill="#22c55e" name="Direct" />
            <Bar dataKey="retried" stackId="a" fill="#f59e0b" name="Retried" />
            <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function OutboxTrendChart({ data }: { data: NotificationAnalyticsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outbox Delivery Trend</CardTitle>
        <CardDescription>Daily direct vs retried vs failed over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <LineChart data={data.outboxTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="direct" stroke="#22c55e" strokeWidth={2} name="Direct" />
            <Line type="monotone" dataKey="retried" stroke="#f59e0b" strokeWidth={2} name="Retried" />
            <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function OutboxRetriedTable({
  data,
  page,
  onPageChange,
}: {
  data: PaginatedResponse<import("@/types/notification-analytics").OutboxRetriedRow>;
  page: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Retried Rows (Picked up by Lookup)</CardTitle>
        <CardDescription>Events that failed on first attempt and were retried</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Event ID</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No retried rows
                </TableCell>
              </TableRow>
            )}
            {data.content.map((r: any) => (
              <TableRow key={r.outbox_id}>
                <TableCell className="font-mono text-xs">{r.outbox_id}</TableCell>
                <TableCell className="text-xs">{r.event_type}</TableCell>
                <TableCell className="font-mono text-xs">{r.event_id?.slice(0, 12)}...</TableCell>
                <TableCell className="text-right">{r.attempts}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.published_at ? new Date(r.published_at).toLocaleString() : "—"}</TableCell>
                <TableCell className="text-xs text-red-600 max-w-[200px] truncate">{r.last_error || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

function OutboxFailedTable({
  data,
  page,
  onPageChange,
}: {
  data: PaginatedResponse<import("@/types/notification-analytics").OutboxFailedRow>;
  page: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Failed Rows (Gave Up)</CardTitle>
        <CardDescription>Events that exceeded max attempts and were permanently failed</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Event ID</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Failed At</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No failed rows
                </TableCell>
              </TableRow>
            )}
            {data.content.map((r: any) => (
              <TableRow key={r.outbox_id}>
                <TableCell className="font-mono text-xs">{r.outbox_id}</TableCell>
                <TableCell className="text-xs">{r.event_type}</TableCell>
                <TableCell className="font-mono text-xs">{r.event_id?.slice(0, 12)}...</TableCell>
                <TableCell className="text-right">{r.attempts}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.failed_at ? new Date(r.failed_at).toLocaleString() : "—"}</TableCell>
                <TableCell className="text-xs text-red-600 max-w-[200px] truncate">{r.last_error || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NotificationAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = React.useState<TimeRange>("7d");
  const [customRange, setCustomRange] = React.useState<{ from: Date; to: Date } | null>(null);
  const [data, setData] = React.useState<NotificationAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination state for individual tables
  const [orgPage, setOrgPage] = React.useState(0);
  const [orgData, setOrgData] = React.useState<PaginatedResponse<import("@/types/notification-analytics").OrgNotificationStats> | null>(null);
  const [timelinePage, setTimelinePage] = React.useState(0);
  const [timelineData, setTimelineData] = React.useState<PaginatedResponse<NotificationTimelineEntry> | null>(null);
  const [retriedPage, setRetriedPage] = React.useState(0);
  const [retriedData, setRetriedData] = React.useState<PaginatedResponse<import("@/types/notification-analytics").OutboxRetriedRow> | null>(null);
  const [failedPage, setFailedPage] = React.useState(0);
  const [failedData, setFailedData] = React.useState<PaginatedResponse<import("@/types/notification-analytics").OutboxFailedRow> | null>(null);
  const [eventTypePage, setEventTypePage] = React.useState(0);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateRange = customRange || getDateRangeFromTimeRange(timeRange);
      const result = await fetchNotificationAnalytics(dateRange.from, dateRange.to);
      setData(result);
      // Also fetch paginated table data
      const [orgs, timeline, retried, failed] = await Promise.all([
        fetchOrgStats(orgPage, 20),
        fetchTimeline(timelinePage, 20),
        fetchOutboxRetried(retriedPage, 20),
        fetchOutboxFailed(failedPage, 20),
      ]);
      setOrgData(orgs);
      setTimelineData(timeline);
      setRetriedData(retried);
      setFailedData(failed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notification analytics");
      console.error("Notification analytics load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, customRange, orgPage, timelinePage, retriedPage, failedPage]);

  // Re-fetch individual tables when their page changes
  React.useEffect(() => {
    fetchOrgStats(orgPage, 20).then(setOrgData).catch(console.error);
  }, [orgPage]);

  React.useEffect(() => {
    fetchTimeline(timelinePage, 20).then(setTimelineData).catch(console.error);
  }, [timelinePage]);

  React.useEffect(() => {
    fetchOutboxRetried(retriedPage, 20).then(setRetriedData).catch(console.error);
  }, [retriedPage]);

  React.useEffect(() => {
    fetchOutboxFailed(failedPage, 20).then(setFailedData).catch(console.error);
  }, [failedPage]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Birds-eye and microscopic views of the notification system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            disabled={isLoading}
            aria-label="Refresh notification analytics"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {isLoading && !data && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {data && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview (Birds-eye)</TabsTrigger>
            <TabsTrigger value="organisations">By Organisation</TabsTrigger>
            <TabsTrigger value="events">By Event Type</TabsTrigger>
            <TabsTrigger value="timeline">Timeline (Microscopic)</TabsTrigger>
            <TabsTrigger value="outbox">Outbox (Kafka Delivery)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <OverviewCards data={data} />
            <Separator />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TrendChart data={data} />
              <DeliveryPieChart data={data} />
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SeverityPieChart data={data} />
              <DeliveryMetricsCard data={data} />
            </div>
          </TabsContent>

          <TabsContent value="organisations" className="space-y-6 mt-4">
            {orgData && (
              <OrgBreakdownTable
                data={orgData}
                page={orgPage}
                onPageChange={setOrgPage}
              />
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-6 mt-4">
            <EventTypeChart data={data} />
            <Separator />
            <EventTypeTable data={data} page={eventTypePage} onPageChange={setEventTypePage} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-4">
            {timelineData && (
              <NotificationTimeline
                data={timelineData}
                page={timelinePage}
                onPageChange={setTimelinePage}
              />
            )}
          </TabsContent>

          <TabsContent value="outbox" className="space-y-6 mt-4">
            <OutboxSummaryCards data={data} />
            <Separator />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <OutboxPieChart data={data} />
              <OutboxEventTypeChart data={data} />
            </div>
            <Separator />
            <OutboxTrendChart data={data} />
            <Separator />
            {retriedData && (
              <OutboxRetriedTable
                data={retriedData}
                page={retriedPage}
                onPageChange={setRetriedPage}
              />
            )}
            <Separator />
            {failedData && (
              <OutboxFailedTable
                data={failedData}
                page={failedPage}
                onPageChange={setFailedPage}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}