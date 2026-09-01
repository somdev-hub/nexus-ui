import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldSeparator } from "@/components/ui/field";
import { PlusIcon, SlidersHorizontal } from "lucide-react";

const page = () => {
  const products = [
    {
      code: 123,
      name: "Nexus mobile m2",
      price: 299,
      stock: 150,
      category: "Electronics",
      warehouse: "WB123",
      materials: [
        {
          name: "Fabricated chips",
          availableQuantity: 300,
          requiredQuantity: 350,
          pricePerUnit: 50,
          status: "Low"
        },
        {
          name: "Display panels",
          availableQuantity: 500,
          requiredQuantity: 600,
          pricePerUnit: 80,
          status: "Medium"
        },
        {
          name: "Battery packs",
          availableQuantity: 400,
          requiredQuantity: 450,
          pricePerUnit: 40,
          status: "High"
        },
        {
          name: "Casing materials",
          availableQuantity: 200,
          requiredQuantity: 300,
          pricePerUnit: 30,
          status: "Low"
        }
      ]
    },
    {
      code: 124,
      name: "Nexus tablet t1",
      price: 399,
      stock: 100,
      category: "Electronics",
      warehouse: "WB124",
      materials: [
        {
          name: "Touchscreen panels",
          availableQuantity: 200,
          requiredQuantity: 250,
          pricePerUnit: 70,
          status: "Medium"
        },
        {
          name: "Battery packs",
          availableQuantity: 300,
          requiredQuantity: 350,
          pricePerUnit: 40,
          status: "High"
        },
        {
          name: "Casing materials",
          availableQuantity: 150,
          requiredQuantity: 200,
          pricePerUnit: 30,
          status: "Low"
        }
      ]
    },
    {
      code: 125,
      name: "Nexus laptop l3",
      price: 999,
      stock: 50,
      category: "Computers",
      warehouse: "WB125",
      materials: [
        {
          name: "Processor units",
          availableQuantity: 80,
          requiredQuantity: 100,
          pricePerUnit: 200,
          status: "Medium"
        },
        {
          name: "RAM modules",
          availableQuantity: 120,
          requiredQuantity: 150,
          pricePerUnit: 100,
          status: "High"
        },
        {
          name: "Casing materials",
          availableQuantity: 60,
          requiredQuantity: 80,
          pricePerUnit: 50,
          status: "Low"
        },
        {
          name: "Battery packs",
          availableQuantity: 70,
          requiredQuantity: 90,
          pricePerUnit: 40,
          status: "Medium"
        }
      ]
    },
    {
      code: 126,
      name: "Nexus smartwatch s4",
      price: 199,
      stock: 200,
      category: "Wearables",
      warehouse: "WB126",
      materials: [
        {
          name: "Display panels",
          availableQuantity: 400,
          requiredQuantity: 450,
          pricePerUnit: 80,
          status: "High"
        },
        {
          name: "Battery packs",
          availableQuantity: 250,
          requiredQuantity: 300,
          pricePerUnit: 40,
          status: "Medium"
        },
        {
          name: "Casing materials",
          availableQuantity: 150,
          requiredQuantity: 200,
          pricePerUnit: 30,
          status: "Low"
        }
      ]
    }
  ];
  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="w-full">
            <div className="flex justify-between w-full">
              <h2 className="text-lg font-semibold mb-2">Product board</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </Button>
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  New product
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              {products.map((product) => (
                <div
                  key={product.code}
                  className="bg-muted p-4 w-[calc(25%-12px)] rounded-xl"
                >
                  <h2 className="ml-2 font-semibold text-sm">
                    Product no. #{product.code}
                  </h2>
                  <Card className="p-4 mt-2 gap-2">
                    <h2 className="font-bold text-lg">{product.name}</h2>
                    <ul className="text-sm space-y-1">
                      <li>
                        <b className="font-semibold">Price:</b> ${product.price}
                      </li>
                      <li>
                        <b className="font-semibold">Stock:</b> {product.stock}{" "}
                        units
                      </li>
                      <li>
                        <b className="font-semibold">Category:</b>{" "}
                        {product.category}
                      </li>
                      <li>
                        <b className="font-semibold">Warehouse:</b>{" "}
                        {product.warehouse}
                      </li>
                    </ul>
                    <FieldSeparator />
                    <div className="flex gap-2 items-center">
                      <Badge>High Demand</Badge>
                      <Badge variant="outline">Low supply</Badge>
                    </div>
                  </Card>
                  <FieldSeparator className="mt-2" />
                  <p className="mt-2 text-sm ml-2">Materials</p>
                  <div className="flex flex-col gap-2">
                    {product.materials.map((material, index) => (
                      <Card key={index} className="p-4 mt-2 gap-2">
                        <div className="flex justify-between items-center">
                          <h2 className="font-semibold text-lg">
                            {material.name}
                          </h2>
                          {material.status === "Low" && (
                            <Badge variant="destructive">Low</Badge>
                          )}
                          {material.status === "Medium" && (
                            <Badge className="bg-amber-400">Medium</Badge>
                          )}
                          {material.status === "High" && (
                            <Badge className="bg-green-500">High</Badge>
                          )}
                        </div>
                        <ul className="text-sm space-y-1">
                          <li>
                            <b className="font-semibold">Avl. Quantity:</b>{" "}
                            {material.availableQuantity} units
                          </li>
                          <li>
                            <b className="font-semibold">Req. Quantity:</b>{" "}
                            {material.requiredQuantity} units
                          </li>
                          <li>
                            <b className="font-semibold">Price:</b> $
                            {material.pricePerUnit}/unit
                          </li>
                        </ul>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
