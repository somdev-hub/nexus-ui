"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useState, useMemo } from "react";
import { DailyCheckinCheckoutChart } from "@/components/daily-checkin-checkout-line-chart";
import { WeeklyWorkingHoursChart } from "@/components/weekly-working-hours";
import { WeeklyEmployeeStrengthChart } from "@/components/weekly-employee-strength-graph";
import { ExpenseBreakdownChart } from "@/components/expense-breakdown-graph";

// Mock data for metrics
const metricCards = [
  {
    title: "Total Employees",
    value: 248,
    change: 12,
    trend: "up",
    icon: Users,
    color: "text-blue-500"
  },
  {
    title: "Employee Present",
    value: 210,
    change: 8,
    trend: "up",
    icon: Users,
    color: "text-green-500"
  },
  {
    title: "On Leave",
    value: 18,
    change: 3,
    trend: "down",
    icon: Clock,
    color: "text-orange-500"
  },
  {
    title: "Pending Requests",
    value: 5,
    change: 2,
    trend: "down",
    icon: AlertCircle,
    color: "text-red-500"
  }
];

// Weekly employee strength data

// Weekly working hours data

// Check-in/Check-out times
const checkInOutData = [
  { time: "08:00", checkIn: 45, checkOut: 5 },
  { time: "08:30", checkIn: 120, checkOut: 8 },
  { time: "09:00", checkIn: 65, checkOut: 12 },
  { time: "09:30", checkIn: 15, checkOut: 18 },
  { time: "10:00", checkIn: 5, checkOut: 35 },
  { time: "17:00", checkIn: 8, checkOut: 45 },
  { time: "17:30", checkIn: 5, checkOut: 85 },
  { time: "18:00", checkIn: 2, checkOut: 55 }
];

// Expense data
const expensesData = [
  {
    id: 1,
    employee: "John Doe",
    amount: "$2,400",
    category: "Salary",
    date: "2024-01-25"
  },
  {
    id: 2,
    employee: "Jane Smith",
    amount: "$2,210",
    category: "Bonus",
    date: "2024-01-24"
  },
  {
    id: 3,
    employee: "Mike Johnson",
    amount: "$1,500",
    category: "Travel",
    date: "2024-01-23"
  },
  {
    id: 4,
    employee: "Sarah Wilson",
    amount: "$800",
    category: "Equipment",
    date: "2024-01-22"
  },
  {
    id: 5,
    employee: "Tom Brown",
    amount: "$2,100",
    category: "Salary",
    date: "2024-01-21"
  },
  {
    id: 6,
    employee: "Alice Johnson",
    amount: "$950",
    category: "Travel",
    date: "2024-01-20"
  },
  {
    id: 7,
    employee: "Robert Davis",
    amount: "$3,200",
    category: "Bonus",
    date: "2024-01-19"
  },
  {
    id: 8,
    employee: "Emma Wilson",
    amount: "$1,200",
    category: "Equipment",
    date: "2024-01-18"
  },
  {
    id: 9,
    employee: "James Brown",
    amount: "$2,400",
    category: "Salary",
    date: "2024-01-17"
  },
  {
    id: 10,
    employee: "Sophia Anderson",
    amount: "$1,100",
    category: "Travel",
    date: "2024-01-16"
  }
];

// Expense breakdown radar data

// Chart configurations
const employeeStrengthChartConfig = {
  strength: {
    label: "Employees",
    color: "hsl(var(--chart-1))"
  }
};

const workingHoursChartConfig = {
  hours: {
    label: "Hours",
    color: "hsl(var(--chart-2))"
  }
};

const checkInOutChartConfig = {
  checkIn: {
    label: "Check-in",
    color: "hsl(var(--chart-1))"
  },
  checkOut: {
    label: "Check-out",
    color: "hsl(var(--chart-3))"
  }
};

const expenseBreakdownChartConfig = {
  value: {
    label: "Amount",
    color: "hsl(var(--chart-5))"
  }
};

// Unique categories for filtering
const categories = ["All", "Salary", "Bonus", "Travel", "Equipment"];

export default function HRDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // const employeeAvg = Math.round(
  //   employeeStrengthData.reduce((sum, d) => sum + d.strength, 0) /
  //     employeeStrengthData.length
  // );
  // const employeeMax = Math.max(...employeeStrengthData.map((d) => d.strength));

  // const hoursAvg = Math.round(
  //   workingHoursData.reduce((sum, d) => sum + d.hours, 0) /
  //     workingHoursData.length
  // );
  // const hoursMax = Math.max(...workingHoursData.map((d) => d.hours));

  // Filter and search logic
  const filteredExpenses = useMemo(() => {
    return expensesData.filter((expense) => {
      const matchesSearch = expense.employee
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || expense.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          HR Management Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor your workforce and key metrics in real-time
        </p>
      </div>

      {/* Block 1: Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} className="overflow-hidden p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  {metric.trend === "up" ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500">
                        +{metric.change} vs last week
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-blue-500">
                        -{metric.change} vs last week
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Block 2: Attendance and Performance Graphs */}
      <div className="flex w-full justify-between gap-4">
        {/* Weekly Employee Strength */}
        <WeeklyEmployeeStrengthChart />

        {/* Weekly Working Hours */}
        <WeeklyWorkingHoursChart />
        <DailyCheckinCheckoutChart />
      </div>

      {/* Check-in/Check-out Times */}

      {/* Block 3: Payments and Expenses */}
      <div className="flex gap-4">
        {/* Expenses Table */}
        <Card className="lg:col-span-2 p-4 w-2/3">
          <CardHeader className="p-0">
            <CardTitle>Expense Transactions</CardTitle>
            <CardDescription>
              Recent employee expenses and payments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {/* Search Bar and Filter Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Filter Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter{" "}
                    {selectedCategory !== "All" && `(${selectedCategory})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span>{category}</span>
                      {selectedCategory === category && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  {selectedCategory !== "All" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleCategoryFilter("All")}
                        className="cursor-pointer text-muted-foreground"
                      >
                        Clear Filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Results info */}
            <div className="text-xs text-muted-foreground">
              Showing {paginatedExpenses.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(endIndex, filteredExpenses.length)} of{" "}
              {filteredExpenses.length} results
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              {paginatedExpenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.employee}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell>{expense.amount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {expense.date}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No expenses found matching your search or filter.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overall Expense Breakdown Radar */}
        <ExpenseBreakdownChart />
      </div>
    </div>
  );
}
