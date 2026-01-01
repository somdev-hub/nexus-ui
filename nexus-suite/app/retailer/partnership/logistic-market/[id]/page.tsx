"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Mail, Phone, MapPin, Star, Truck } from "lucide-react";
import Link from "next/link";

const LogisticPartnerDetailsPage = ({ params }: { params: { id: string } }) => {
  // Sample logistics partner data - in a real app, this would come from an API
  const partner = {
    id: params.id,
    name: "FastFlow Logistics",
    type: "Full Truckload (FTL)",
    rating: 4.9,
    reviews: 287,
    description:
      "Leading full-truckload carrier with 20+ years of experience. Specializing in reliable, cost-effective freight solutions across North America.",
    email: "dispatch@fastflow.com",
    phone: "+1 (555) 987-6543",
    address: "456 Highway Drive, Atlanta, GA 30303",
    website: "www.fastflow-logistics.com",
    coverage: "North America",
    fleet: 250,
    experience: "20+ years",
    responseTime: "1-2 hours",
    serviceTypes: [
      "Full Truckload (FTL)",
      "Less Than Truckload (LTL)",
      "Expedited Shipping",
      "Regional Delivery",
      "Cross-Border Transport"
    ],
    certifications: ["DOT Certified", "HAZMAT Licensed", "ISO 9001:2015"],
    metrics: {
      onTimeDelivery: 97,
      safetyRecord: 4.9,
      customerService: 4.8,
      priceCompetitiveness: 4.7,
      reliability: 98
    },
    serviceAreas: [
      { region: "West Coast", cities: "CA, WA, OR" },
      { region: "Midwest", cities: "IL, MI, OH, MN" },
      { region: "South", cities: "TX, FL, GA, NC" },
      { region: "Northeast", cities: "NY, PA, NJ, MA" }
    ],
    fleetInfo: {
      tractors: 250,
      trailers: 450,
      avgAge: "3.5 years",
      features: [
        "GPS Tracking",
        "Real-time Updates",
        "Refrigerated Units",
        "Flatbed Options"
      ]
    },
    recentShipments: [
      {
        id: 1,
        origin: "Los Angeles, CA",
        destination: "New York, NY",
        weight: "25,000 lbs",
        status: "In Transit"
      },
      {
        id: 2,
        origin: "Chicago, IL",
        destination: "Miami, FL",
        weight: "18,500 lbs",
        status: "Delivered"
      },
      {
        id: 3,
        origin: "Seattle, WA",
        destination: "Dallas, TX",
        weight: "22,000 lbs",
        status: "Scheduled"
      }
    ]
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-linear-to-r from-blue-50 to-cyan-50 p-4 md:p-6">
          <div className="flex items-start justify-between">
            <Link href="/retailer/logistic-market">
              <Button variant="ghost" size="sm" className="mb-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="h-24 w-24 bg-linear-to-br from-blue-400 to-cyan-600 rounded-lg flex items-center justify-center text-white text-3xl">
              <Truck className="h-12 w-12" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{partner.name}</h1>
                <Badge variant="outline">{partner.type}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(partner.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{partner.rating}</span>
                <span className="text-sm text-gray-600">
                  ({partner.reviews} reviews)
                </span>
              </div>
              <p className="text-gray-700 max-w-2xl">{partner.description}</p>
            </div>
            <div className="flex gap-2">
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button variant="outline">Book Shipment</Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Contact & Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Information */}
              <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-sm">{partner.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{partner.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-sm">{partner.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Company Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  <div>
                    <p className="text-sm text-gray-600">Coverage Area</p>
                    <p className="font-medium">{partner.coverage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fleet Size</p>
                    <p className="font-medium">{partner.fleet} vehicles</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-medium">{partner.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="font-medium">{partner.responseTime}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 p-0">
                  {partner.certifications.map((cert) => (
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
                          {partner.metrics.onTimeDelivery}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${partner.metrics.onTimeDelivery}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Safety Record
                        </span>
                        <span className="font-semibold">
                          {partner.metrics.safetyRecord}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (partner.metrics.safetyRecord / 5) * 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Customer Service
                        </span>
                        <span className="font-semibold">
                          {partner.metrics.customerService}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (partner.metrics.customerService / 5) * 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Price Competitiveness
                        </span>
                        <span className="font-semibold">
                          {partner.metrics.priceCompetitiveness}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (partner.metrics.priceCompetitiveness / 5) * 100
                            }%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Overall Reliability
                        </span>
                        <span className="font-semibold">
                          {partner.metrics.reliability}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${partner.metrics.reliability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs - Services & Fleet */}
              <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">
                    Services & Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="services" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="services">Services</TabsTrigger>
                      <TabsTrigger value="fleet">Fleet</TabsTrigger>
                      <TabsTrigger value="coverage">Coverage</TabsTrigger>
                    </TabsList>
                    <TabsContent value="services" className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {partner.serviceTypes.map((service) => (
                          <Badge
                            key={service}
                            variant="outline"
                            className="text-sm py-2 px-3"
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="fleet" className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Tractors</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {partner.fleetInfo.tractors}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Trailers</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {partner.fleetInfo.trailers}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-2">
                            Fleet Features
                          </p>
                          <div className="space-y-2">
                            {partner.fleetInfo.features.map((feature) => (
                              <div
                                key={feature}
                                className="flex items-center gap-2 text-sm"
                              >
                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="coverage" className="mt-4">
                      <div className="space-y-3">
                        {partner.serviceAreas.map((area) => (
                          <div
                            key={area.region}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{area.region}</p>
                              <p className="text-sm text-gray-600">
                                {area.cities}
                              </p>
                            </div>
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Recent Shipments */}
              <Card className="gap-2 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">
                    Sample Recent Shipments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  {partner.recentShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {shipment.origin} → {shipment.destination}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Weight: {shipment.weight}
                          </p>
                        </div>
                        <Badge
                          variant={
                            shipment.status === "Delivered"
                              ? "default"
                              : "outline"
                          }
                        >
                          {shipment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogisticPartnerDetailsPage;
