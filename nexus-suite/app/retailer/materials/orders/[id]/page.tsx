"use client";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldSeparator } from "@/components/ui/field";
import {
  DeliveryStatus,
  defaultDeliverySteps
} from "@/components/delivery-status";
import { CreditCardIcon, MapPin, PrinterIcon, TrashIcon } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { Badge } from "@/components/ui/badge";

const Page = () => {
  // get the order id from params
  const orderId = useParams().id;
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="w-full">
            <div className="flex justify-between w-full">
              <h2 className="text-lg font-semibold mb-2">
                Order no. #{orderId}
              </h2>
              <div className="flex gap-2">
                <Button>
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="destructive">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <Card className="p-4 gap-4 w-1/3">
                <div className="">
                  <h1 className="text-2xl font-semibold">
                    Order no. #{orderId}
                  </h1>
                  <p>Placed on: 12-12-2025</p>
                </div>
                <FieldSeparator />
                <div className="">
                  <h2 className="text-lg mb-2">Supplier Information</h2>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      <b>Supplier Name:</b> ABC Supplies
                    </li>
                    <li>
                      <b>Contact:</b> contact@abcsupplies.com
                    </li>
                    <li>
                      <b>Phone:</b> +1 234 567 890
                    </li>
                    <li>
                      <b>Address:</b> 123 Supply St, Supplier City, SC 12345
                    </li>
                  </ul>
                </div>
                <Card className="mt-2 p-4 gap-1 bg-muted">
                  <h2 className="font-semibold">Payment method</h2>
                  <p className="text-muted-foreground">
                    <CreditCardIcon className="inline h-4 w-4 mr-2" />
                    Credit Card ending in **** 1234
                  </p>
                </Card>
              </Card>
              <Card className="p-4 gap-4 w-2/3">
                <div className="">
                  <h2 className="font-bold">Order summery</h2>
                  <p className="text-sm font-semibold mt-2">Items</p>
                  <div className="text-sm mt-2 space-y-2">
                    {/* list of items */}
                    <div className="flex justify-between">
                      <p>Material A (x10)</p>
                      <p>$100.00</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Material B (x5)</p>
                      <p>$50.00</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Material C (x2)</p>
                      <p>$20.00</p>
                    </div>
                  </div>
                  <FieldSeparator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <p>Subtotal</p>
                    <p>$170.00</p>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <p>Custom duties</p>
                    <p>$40.00</p>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <p>Quality assurance</p>
                    <p>$50.00</p>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <p>Logistics charges</p>
                    <p>$70.00</p>
                  </div>
                  <FieldSeparator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <p>Total</p>
                    <p>$230.00</p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="mt-4">
              <Card className="p-6">
                <DeliveryStatus
                  steps={defaultDeliverySteps}
                  currentStep={4}
                  currentStepDate="December 23, 2024"
                />
              </Card>
            </div>
            <div className="mt-4 flex gap-4">
              <Card className="p-4 flex-1 gap-2">
                <div className="flex mb-2 justify-between items-center">
                  <h2 className="font-bold">Risk assessment</h2>
                  <p className="text-sm text-muted-foreground font-semibold">
                    rating: 8/10
                  </p>
                </div>
                {/* steps */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Custom duties</h3>
                      <p className="text-sm text-muted-foreground">
                        No risks detected
                      </p>
                    </div>
                    <Badge>Cleared</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Quality assurance</h3>
                      <p className="text-sm text-muted-foreground">
                        Inspection passed
                      </p>
                    </div>
                    <Badge>Cleared</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Logistics</h3>
                      <p className="text-sm text-muted-foreground">
                        No delays expected
                      </p>
                    </div>
                    <Badge>Cleared</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Weather</h3>
                      <p className="text-sm text-muted-foreground">
                        High wind speeds and rain expected
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-400">
                      warning
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Route planning</h3>
                      <p className="text-sm text-muted-foreground">
                        No delays expected
                      </p>
                    </div>
                    <Badge>Cleared</Badge>
                  </div>
                </div>
              </Card>
              <Card className="p-4 flex-1 gap-2">
                <div className="flex mb-2 justify-between items-center">
                  <h2 className="font-bold">Logistics details</h2>
                  <Button variant="outline">
                    {/* icon */}
                    <MapPin className=" h-4 w-4" />
                    Track GPS
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Carrier</h3>
                    <p className="text-sm text-muted-foreground">
                      FastExpress Logistics
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Tracking Number</h3>
                    <p className="text-sm text-muted-foreground">
                      FX123456789US
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Estimated Delivery Date</h3>
                    <p className="text-sm text-muted-foreground">
                      December 30, 2024
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Shipping Method</h3>
                    <p className="text-sm text-muted-foreground">
                      Express Shipping
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
