"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PayrollRecord } from "@/types";

interface PayrollPaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordsToProcess: PayrollRecord[];
  onConfirm: () => void;
  isProcessing?: boolean;
}

export function PayrollPaymentConfirmationDialog({
  open,
  onOpenChange,
  recordsToProcess,
  onConfirm,
  isProcessing = false
}: PayrollPaymentConfirmationDialogProps) {
  // Calculate cost breakdown
  const costBreakdown = recordsToProcess.reduce(
    (acc, record) => {
      acc.totalNetSalary += record.netSalary;
      acc.totalBonus += record.bonus;
      acc.totalDeductions += record.deductions;
      acc.totalAllowances += record.allowances || 0;
      acc.totalOvertimeCost += record.overtimeCost || 0;
      acc.totalPayableAmount +=
        record.totalPayout || record.netSalary + (record.overtimeCost || 0);
      return acc;
    },
    {
      totalNetSalary: 0,
      totalBonus: 0,
      totalDeductions: 0,
      totalAllowances: 0,
      totalOvertimeCost: 0,
      totalPayableAmount: 0
    }
  );

  const employeeCount = recordsToProcess.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Payment Confirmation</DialogTitle>
          <DialogDescription>
            Review the billing summary before processing payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Card */}
          <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Number of Employees
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {employeeCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Total Payable Amount
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  ${costBreakdown.totalPayableAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">Cost Breakdown</h3>

            <div className="space-y-3">
              {/* Net Salary */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Total Net Salary</span>
                <span className="font-semibold">
                  ${costBreakdown.totalNetSalary.toLocaleString()}
                </span>
              </div>

              {/* Bonus */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Total Bonus</span>
                <span className="font-semibold text-green-600">
                  +${costBreakdown.totalBonus.toLocaleString()}
                </span>
              </div>

              {/* Allowances */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Total Allowances</span>
                <span className="font-semibold text-green-600">
                  +${costBreakdown.totalAllowances.toLocaleString()}
                </span>
              </div>

              {/* Overtime */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Total Overtime Cost</span>
                <span className="font-semibold text-green-600">
                  +${costBreakdown.totalOvertimeCost.toLocaleString()}
                </span>
              </div>

              {/* Deductions */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Total Deductions</span>
                <span className="font-semibold text-red-600">
                  -${costBreakdown.totalDeductions.toLocaleString()}
                </span>
              </div>

              {/* Total Payable (Summary) */}
              <div className="flex justify-between items-center py-3 mt-4 bg-gray-100 px-3 rounded-lg">
                <span className="font-semibold">Total Payable Amount</span>
                <span className="text-2xl font-bold text-green-600">
                  ${costBreakdown.totalPayableAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Employee Summary */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">
              Employee Summary ({employeeCount})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recordsToProcess.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{record.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.department} • {record.position}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(record.totalPayout || 0).toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {record.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Message */}
          <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-yellow-900">
                Important Notice
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Once you proceed to payment, the transaction cannot be reversed.
                Please review all details carefully before continuing.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing}>
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isProcessing ? "Processing..." : "Continue to Payment Gateway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
