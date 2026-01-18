"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { employees } from "../data";
import { ArrowLeft, Edit, Trash2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailPage(props: PageProps) {
  const params = React.use(props.params);
  // Using dummy data from data.ts
  const employee = employees.find((emp) => emp.id === params.id);

  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [promotionData, setPromotionData] = useState({
    newPosition: "",
    newDepartment: "",
    newSalary: "",
    effectiveDate: "",
    notes: ""
  });

  const handlePromotion = () => {
    // Handle promotion logic here
    console.log("Promoting employee:", employee?.id, promotionData);
    toast.success(`${employee?.name} has been promoted successfully!`);
    setIsPromoteDialogOpen(false);
    // Reset form
    setPromotionData({
      newPosition: "",
      newDepartment: "",
      newSalary: "",
      effectiveDate: "",
      notes: ""
    });
  };

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Employee not found</h1>
          <Link href="/hr/employees">
            <Button variant="outline" className="mt-4">
              Back to Employees
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex items-center gap-4">
        <Link href="/hr/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Employee details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Employee ID
                  </p>
                  <p className="text-lg font-semibold">{employee.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg font-semibold">{employee.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Department
                  </p>
                  <p className="text-lg font-semibold">{employee.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p className="text-lg font-semibold">{employee.position}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Join Date</p>
                  <p className="text-lg font-semibold">{employee.joinDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge
                    variant={
                      employee.status === "Active" ? "default" : "secondary"
                    }
                  >
                    {employee.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 gap-2">
            <CardHeader className="p-4">
              <CardTitle>Compensation</CardTitle>
              <CardDescription>Salary and benefits information</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Annual Salary
                </p>
                <p className="text-2xl font-bold">
                  ${employee.salary.toLocaleString()}
                </p>
              </div>
              {employee.payBreakdown && (
                <div className="space-y-3 border-t pt-4">
                  <p className="font-medium text-sm">Salary Breakdown</p>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Salary</span>
                      <span className="font-semibold">${employee.payBreakdown.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus</span>
                      <span className="font-semibold text-green-600">${employee.payBreakdown.bonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowances</span>
                      <span className="font-semibold">${employee.payBreakdown.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deductions</span>
                      <span className="font-semibold text-red-600">${employee.payBreakdown.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {employee.previousPositions && employee.previousPositions.length > 0 && (
            <Card className="p-0 gap-2">
              <CardHeader className="p-4">
                <CardTitle>Work History</CardTitle>
                <CardDescription>Previously held positions</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {employee.previousPositions.map((position, idx) => (
                  <div key={idx} className="border-l-2 border-gray-200 pl-4 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{position.position}</p>
                        <p className="text-sm text-gray-500">{position.department}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(position.startDate).toLocaleDateString()} - {new Date(position.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {employee.letters && employee.letters.length > 0 && (
            <Card className="p-0 gap-2">
              <CardHeader className="p-4">
                <CardTitle>Letters & Documents</CardTitle>
                <CardDescription>Official letters and certificates</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {employee.letters.map((letter) => (
                  <div key={letter.id} className="flex items-start justify-between p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{letter.type}</p>
                      <p className="text-xs text-gray-600">{letter.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(letter.date).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-0">
              <Dialog
                open={isPromoteDialogOpen}
                onOpenChange={setIsPromoteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full" variant="default">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Promote Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-125">
                  <DialogHeader>
                    <DialogTitle>Promote Employee</DialogTitle>
                    <DialogDescription>
                      Update employee position, department, and salary. This
                      action will be recorded in the employee&apos;s history.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-position">Current Position</Label>
                      <Input
                        id="current-position"
                        value={employee?.position}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-position">New Position</Label>
                      <Select
                        value={promotionData.newPosition}
                        onValueChange={(value) =>
                          setPromotionData({
                            ...promotionData,
                            newPosition: value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select new position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Junior Developer">
                            Junior Developer
                          </SelectItem>
                          <SelectItem value="Senior Developer">
                            Senior Developer
                          </SelectItem>
                          <SelectItem value="Team Lead">Team Lead</SelectItem>
                          <SelectItem value="Project Manager">
                            Project Manager
                          </SelectItem>
                          <SelectItem value="Department Head">
                            Department Head
                          </SelectItem>
                          <SelectItem value="VP">Vice President</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-department">Department</Label>
                      <Select
                        value={promotionData.newDepartment}
                        onValueChange={(value) =>
                          setPromotionData({
                            ...promotionData,
                            newDepartment: value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">
                            Engineering
                          </SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="HR">Human Resources</SelectItem>
                          <SelectItem value="Logistics">Logistics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="current-salary">Current Salary</Label>
                      <Input
                        id="current-salary"
                        value={`$${employee?.salary.toLocaleString()}`}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-salary">New Salary</Label>
                      <Input
                        id="new-salary"
                        type="number"
                        placeholder="Enter new salary"
                        value={promotionData.newSalary}
                        onChange={(e) =>
                          setPromotionData({
                            ...promotionData,
                            newSalary: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="effective-date">Effective Date</Label>
                      <Input
                        id="effective-date"
                        type="date"
                        value={promotionData.effectiveDate}
                        onChange={(e) =>
                          setPromotionData({
                            ...promotionData,
                            effectiveDate: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional notes about the promotion..."
                        value={promotionData.notes}
                        onChange={(e) =>
                          setPromotionData({
                            ...promotionData,
                            notes: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsPromoteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handlePromotion}>Confirm Promotion</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button className="w-full" variant="default">
                <Edit className="w-4 h-4 mr-2" />
                Edit Employee
              </Button>
              <Button className="w-full" variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Employee
              </Button>
            </CardContent>
          </Card>

          <Card className="p-4 gap-2">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-0 flex flex-col gap-1">
              <Link href="/hr/attendance">
                <Button className="w-full" variant="outline">
                  View Attendance
                </Button>
              </Link>
              <Link href="/hr/payroll">
                <Button className="w-full" variant="outline">
                  View Payroll
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
