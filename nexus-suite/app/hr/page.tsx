"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Users, DollarSign, Briefcase, Clock, Activity } from "lucide-react";
import Link from "next/link";

const modules = [
  {
    title: "Employees",
    description: "Manage employee information and profiles",
    icon: Users,
    href: "/hr/employees",
    color: "text-blue-500"
  },
  {
    title: "Payroll",
    description: "Handle salary, deductions, and payroll processing",
    icon: DollarSign,
    href: "/hr/payroll",
    color: "text-green-500"
  },
  {
    title: "Roles & Permissions",
    description: "Assign and manage employee roles",
    icon: Briefcase,
    href: "/hr/roles",
    color: "text-purple-500"
  },
  {
    title: "Attendance",
    description: "Track employee attendance and leave",
    icon: Clock,
    href: "/hr/attendance",
    color: "text-orange-500"
  },
  {
    title: "Work Monitoring",
    description: "Monitor productivity and task completion",
    icon: Activity,
    href: "/hr/work-monitoring",
    color: "text-red-500"
  }
];

export default function HRDashboard() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
        <p className="text-gray-500 mt-2">
          Manage your workforce efficiently with comprehensive HR tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary p-4 gap-2">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-4">
                    <Icon className={`w-8 h-8 ${module.color}`} />
                    <div>
                      <CardTitle>{module.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
