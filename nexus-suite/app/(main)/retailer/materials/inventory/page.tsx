"use client";

import { ChartBarStacked } from "@/components/inventory-chart";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldSeparator } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table
} from "@/components/ui/table";
import {
  ArrowRight,
  ChevronsRight,
  EllipsisVertical,
  PlusIcon,
  Stone
} from "lucide-react";
import React, { useEffect } from "react";

const Page = () => {
  const [progress, setProgress] = React.useState(75);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);
  const inventoryItems = [
    {
      name: "Display panels",
      quantity: 500,
      unit: "pieces",
      receivedOn: "12-12-2025",
      supplier: "ABC Supplies"
    },
    {
      name: "Battery packs",
      quantity: 400,
      unit: "pieces",
      receivedOn: "15-12-2025",
      supplier: "XYZ Electronics"
    },
    {
      name: "Casing materials",
      quantity: 200,
      unit: "pieces",
      receivedOn: "18-12-2025",
      supplier: "LMN Components"
    },
    {
      name: "Fabricated chips",
      quantity: 300,
      unit: "pieces",
      receivedOn: "20-12-2025",
      supplier: "TechParts Co."
    },
    {
      name: "Display panels",
      quantity: 500,
      unit: "pieces",
      receivedOn: "12-12-2025",
      supplier: "ABC Supplies"
    },
    {
      name: "Battery packs",
      quantity: 400,
      unit: "pieces",
      receivedOn: "15-12-2025",
      supplier: "XYZ Electronics"
    },
    {
      name: "Casing materials",
      quantity: 200,
      unit: "pieces",
      receivedOn: "18-12-2025",
      supplier: "LMN Components"
    },
    {
      name: "Fabricated chips",
      quantity: 300,
      unit: "pieces",
      receivedOn: "20-12-2025",
      supplier: "TechParts Co."
    }
  ];
  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="w-full">
            <div className="flex justify-between w-full">
              <h2 className="text-lg font-semibold">Inventory</h2>
              <Button>
                <PlusIcon className="size-4" />
                Add
              </Button>
            </div>
            <div className="flex gap-4 mt-4">
              <Card className="p-4 gap-2 w-[calc(50%-8px)]">
                <h2 className="font-semibold text-lg">
                  Warehouse section #543
                </h2>
                <h1 className="font-bold text-2xl">1345</h1>
                <Progress value={progress} />
                <div className="flex justify-between items-center text-sm">
                  <p>795 Kg occupied</p>
                  <p>{progress} %</p>
                </div>
                <FieldSeparator className="mt-2" />
                <div className="flex justify-end items-center text-sm font-normal text-primary gap-1">
                  view more <ArrowRight className="w-4 h-4 mt-[0.2rem]" />
                </div>
              </Card>
              <Card className="p-4 gap-2 w-[calc(50%-8px)]">
                <h2 className="font-semibold text-lg">
                  Warehouse section #543
                </h2>
                <h1 className="font-bold text-2xl">1345</h1>
                <Progress value={progress} />
                <div className="flex justify-between items-center text-sm">
                  <p>795 Kg occupied</p>
                  <p>{progress} %</p>
                </div>
                <FieldSeparator className="mt-2" />
                <div className="flex justify-end items-center text-sm font-normal text-primary gap-1">
                  view more <ArrowRight className="w-4 h-4 mt-[0.2rem]" />
                </div>
              </Card>
              <Card className="p-4 gap-2 w-[calc(50%-8px)]">
                <h2 className="font-semibold text-lg">
                  Warehouse section #543
                </h2>
                <h1 className="font-bold text-2xl">1345</h1>
                <Progress value={progress} />
                <div className="flex justify-between items-center text-sm">
                  <p>795 Kg occupied</p>
                  <p>{progress} %</p>
                </div>
                <FieldSeparator className="mt-2" />
                <div className="flex justify-end items-center text-sm font-normal text-primary gap-1">
                  view more <ArrowRight className="w-4 h-4 mt-[0.2rem]" />
                </div>
              </Card>
              <Card className="p-4 gap-2 w-[calc(50%-8px)]">
                <h2 className="font-semibold text-lg">
                  Warehouse section #543
                </h2>
                <h1 className="font-bold text-2xl">1345</h1>
                <Progress value={progress} />
                <div className="flex justify-between items-center text-sm">
                  <p>795 Kg occupied</p>
                  <p>{progress} %</p>
                </div>
                <FieldSeparator className="mt-2" />
                <div className="flex justify-end items-center text-sm font-normal text-primary gap-1">
                  view more <ArrowRight className="w-4 h-4 mt-[0.2rem]" />
                </div>
              </Card>
            </div>
            <div className="mt-4 flex gap-4">
              <Card className="p-4 gap-2 w-1/5">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Stone className="w-4 h-4" />
                    <h2 className="font-semibold text-lg">Solid</h2>
                  </div>
                  <EllipsisVertical className="w-4 h-4" />
                </div>
                <Card className="bg-muted/50 rounded-sm mt-4 p-2">
                  <p>1547 items</p>
                </Card>
                <p className="text-[0.75rem]">last updated: 17th Dec 2025</p>
              </Card>
              <Card className="p-4 gap-2 w-1/5">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Stone className="w-4 h-4" />
                    <h2 className="font-semibold text-lg">Liquid</h2>
                  </div>
                  <EllipsisVertical className="w-4 h-4" />
                </div>
                <Card className="bg-muted/50 rounded-sm mt-4 p-2">
                  <p>1547 items</p>
                </Card>
                <p className="text-[0.75rem]">last updated: 17th Dec 2025</p>
              </Card>
              <Card className="p-4 gap-2 w-1/5">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Stone className="w-4 h-4" />
                    <h2 className="font-semibold text-lg">Gas</h2>
                  </div>
                  <EllipsisVertical className="w-4 h-4" />
                </div>
                <Card className="bg-muted/50 rounded-sm mt-4 p-2">
                  <p>1547 items</p>
                </Card>
                <p className="text-[0.75rem]">last updated: 17th Dec 2025</p>
              </Card>
              <Card className="p-4 gap-2 flex w-1/3">
                <div className="flex justify-between items-center">
                  <div className="">
                    <h2 className="font-bold">Total storage used</h2>
                    <p className="text-muted-foreground text-sm">
                      See the total storage used across all warehouses
                    </p>
                  </div>
                  <Button variant="outline">
                    <ChevronsRight />
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between mb-4 text-sm">
                    <p>1090 Kg total</p>
                    <p>{progress}% used</p>
                  </div>
                  <Progress value={progress} />
                </div>
              </Card>
            </div>
            <div className="mt-4 flex gap-4">
              {/* <Card className="flex-1 p-4"> */}
              <ChartBarStacked />
              {/* </Card> */}
              <Card className="flex-1 p-4 gap-0">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Recently add items</h2>
                  <Button variant="outline">View all</Button>
                </div>
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="">Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">
                          Received On
                        </TableHead>
                        <TableHead className="text-right">Supplier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">
                            {item.receivedOn}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.supplier}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
