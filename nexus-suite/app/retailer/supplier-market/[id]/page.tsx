"use client";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Mail, Phone, MapPin, Star, Package } from "lucide-react";
import Link from "next/link";

const SupplierDetailsPage = ({ params }: { params: { id: string } }) => {
  // Sample supplier data - in a real app, this would come from an API
  const supplier = {
    id: params.id,
    name: "ElectroTech Suppliers",
    category: "Electronics",
    rating: 4.8,
    reviews: 324,
    description:
      "Premium electronics supplier with 15+ years of industry experience. Specializing in high-quality components and wholesale pricing.",
    email: "contact@electrotech.com",
    phone: "+1 (555) 123-4567",
    address: "123 Tech Avenue, Silicon Valley, CA 94025",
    website: "www.electrotech.com",
    foundedYear: 2009,
    employees: "50-100",
    responseTime: "2-4 hours",
    productCategories: [
      "Microcontrollers",
      "Semiconductors",
      "Circuit Boards",
      "Connectors",
      "Power Supplies"
    ],
    certifications: ["ISO 9001", "RoHS Certified", "ISO 14001"],
    metrics: {
      onTimeDelivery: 98,
      productQuality: 4.9,
      communicationQuality: 4.7,
      competitivePrice: 4.6
    },
    recentProducts: [
      {
        id: 1,
        name: "Arduino Uno Microcontroller",
        quantity: 500,
        price: "$8.50"
      },
      { id: 2, name: "Raspberry Pi 4 Model B", quantity: 200, price: "$45.00" },
      {
        id: 3,
        name: "USB Type-C Connectors (Pack)",
        quantity: 1000,
        price: "$0.25"
      }
    ]
  };

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-linear-to-r from-blue-50 to-indigo-50 p-4 md:p-6">
          <div className="flex items-start justify-between">
            <Link href="/retailer/supplier-market">
              <Button variant="ghost" size="sm" className="mb-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="h-24 w-24 bg-linear-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              {supplier.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{supplier.name}</h1>
                <Badge variant="outline">{supplier.category}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(supplier.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{supplier.rating}</span>
                <span className="text-sm text-gray-600">
                  ({supplier.reviews} reviews)
                </span>
              </div>
              <p className="text-gray-700 max-w-2xl">{supplier.description}</p>
            </div>
            <div className="flex gap-2">
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button variant="outline">Request Quote</Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Contact & Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Information */}
              <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{supplier.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-sm">{supplier.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Company Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  <div>
                    <p className="text-sm text-gray-600">Founded</p>
                    <p className="font-medium">{supplier.foundedYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    <p className="font-medium">{supplier.employees}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="font-medium">{supplier.responseTime}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="p-4 gap-2">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 p-0">
                  {supplier.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Performance Metrics */}
              <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          On-Time Delivery
                        </span>
                        <span className="font-semibold">
                          {supplier.metrics.onTimeDelivery}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${supplier.metrics.onTimeDelivery}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Product Quality
                        </span>
                        <span className="font-semibold">
                          {supplier.metrics.productQuality}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (supplier.metrics.productQuality / 5) * 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Communication
                        </span>
                        <span className="font-semibold">
                          {supplier.metrics.communicationQuality}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (supplier.metrics.communicationQuality / 5) * 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Competitive Price
                        </span>
                        <span className="font-semibold">
                          {supplier.metrics.competitivePrice}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (supplier.metrics.competitivePrice / 5) * 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs - Products & Categories */}
              <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Offerings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="categories" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="categories">
                        Product Categories
                      </TabsTrigger>
                      <TabsTrigger value="products">
                        Recent Products
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="categories" className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {supplier.productCategories.map((category) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className="text-sm py-2 px-3"
                          >
                            <Package className="h-3 w-3 mr-1" />
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="products" className="mt-4">
                      <div className="space-y-3">
                        {supplier.recentProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">
                                Available: {product.quantity} units
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600">
                                {product.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierDetailsPage;
