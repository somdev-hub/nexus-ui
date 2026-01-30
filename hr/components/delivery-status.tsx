"use client";

import { Badge } from "@/components/ui/badge";
import {
  IconTruck,
  IconChecks,
  IconShieldExclamation,
  IconPackageImport,
  IconPhone,
  IconClipboardCheck
} from "@tabler/icons-react";
import React from "react";

export interface DeliveryStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  date?: string;
}

export interface DeliveryStatusProps {
  steps: DeliveryStep[];
  currentStep: number;
  currentStepDate?: string;
}

export function DeliveryStatus({
  steps,
  currentStep,
  currentStepDate
}: DeliveryStatusProps) {
  const currentStepLabel = steps[currentStep]?.label;
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-6">Delivery Status</h3>

        {/* Steps Container */}
        <div className="space-y-4">
          {/* Steps Icons Row */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors shrink-0 ${
                      isCompleted || isActive
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 flex items-center justify-center ${
                        isCompleted || isActive ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {step.icon}
                    </div>
                  </div>
                  <p
                    className={`text-sm font-medium text-center max-w-30 mt-2 ${
                      isCompleted || isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Progress Line Row */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;

              return (
                <React.Fragment key={`progress-${step.id}`}>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 transition-colors ${
                        isCompleted
                          ? "bg-black dark:bg-white"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Status Badge */}
          {currentStepLabel && (
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="border-blue-500">
                {currentStepLabel}
              </Badge>
              {currentStepDate && (
                <span className="text-sm text-muted-foreground">
                  on {currentStepDate}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const defaultDeliverySteps: DeliveryStep[] = [
  {
    id: "risk_assessment",
    label: "Risk Assessment",
    icon: <IconShieldExclamation className="w-full h-full" />
  },
  {
    id: "order_received",
    label: "Order Received by Supplier",
    icon: <IconPackageImport className="w-full h-full" />
  },
  {
    id: "partner_contacted",
    label: "Delivery Partner Contacted",
    icon: <IconPhone className="w-full h-full" />
  },
  {
    id: "quality_check",
    label: "Quality Check",
    icon: <IconClipboardCheck className="w-full h-full" />
  },
  {
    id: "shipped",
    label: "Shipped",
    icon: <IconTruck className="w-full h-full" />
  },
  {
    id: "delivered",
    label: "Delivered",
    icon: <IconChecks className="w-full h-full" />
  }
];
