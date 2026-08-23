"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Copy, Loader2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PayrollInitiationResponse } from "@/types";

interface PayrollPaymentResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: PayrollInitiationResponse | null;
  onClose?: () => void;
}

export function PayrollPaymentResultDialog({
  open,
  onOpenChange,
  result,
  onClose
}: PayrollPaymentResultDialogProps) {
  if (!result) return null;

  const isSuccess = result.status === "COMPLETED";
  const isPending = result.status === "PENDING";
  const isFailed = result.status === "FAILED" || result.status === "CANCELLED";

  const handleCopyReference = () => {
    if (result.transactionReference) {
      navigator.clipboard.writeText(result.transactionReference);
      toast.success("Transaction reference copied!");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  // Determine icon and colors based on status
  const getStatusIcon = () => {
    if (isSuccess) return <CheckCircle2 className="w-12 h-12 text-green-500" />;
    if (isPending) return <Clock className="w-12 h-12 text-yellow-500" />;
    return <XCircle className="w-12 h-12 text-red-500" />;
  };

  const getStatusColor = () => {
    if (isSuccess) return "from-green-50 to-green-100 border-green-200";
    if (isPending) return "from-yellow-50 to-yellow-100 border-yellow-200";
    return "from-red-50 to-red-100 border-red-200";
  };

  const getStatusTitle = () => {
    if (isSuccess) return "Payment Processed Successfully";
    if (isPending) return "Payment Processing";
    return "Payment Failed";
  };

  const getStatusBadgeVariant = () => {
    if (isSuccess) return "default";
    if (isPending) return "secondary";
    return "destructive";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto no-scrollbar">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">{getStatusIcon()}</div>
          <DialogTitle className="text-2xl">{getStatusTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Card */}
          <div
            className={`bg-linear-to-br ${getStatusColor()} p-6 rounded-lg border`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={getStatusBadgeVariant()}>{result.status}</Badge>
            </div>
          </div>

          {/* Message */}
          {result.message && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">{result.message}</p>
            </div>
          )}

          {/* Transaction Reference */}
          {result.transactionReference && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Transaction Reference
              </label>
              <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-300">
                <code className="text-sm font-mono text-slate-800 flex-1 truncate">
                  {result.transactionReference}
                </code>
                <button
                  onClick={handleCopyReference}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                  title="Copy reference"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          )}

          {/* Payroll IDs Count */}
          {result.payrollIds && result.payrollIds.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Payroll Records Processed
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {result.payrollIds.length}
                </span>
              </div>
            </div>
          )}

          {/* Status Info Message */}
          {isPending && (
            <div className="flex gap-2 items-start p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-800">
                Your payment is being processed. Please check back shortly for
                updates.
              </p>
            </div>
          )}

          {isFailed && (
            <div className="flex gap-2 items-start p-3 bg-red-50 rounded-lg border border-red-200">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">
                Please contact support if the issue persists.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleClose}
            className={isSuccess ? "w-full" : ""}
            variant={isSuccess ? "default" : "outline"}
          >
            {isSuccess ? "Done" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
