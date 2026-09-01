import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Search, Star, Truck, MapPin } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import Link from "next/link";

const LogisticMarketPage = () => {
  const transportPartners = [
    {
      id: 1,
      name: "FastFlow Logistics",
      type: "Full Truckload",
      rating: 4.9,
      reviews: 287,
      coverage: "North America",
      color: "from-blue-400 to-blue-600"
    },
    {
      id: 2,
      name: "SwiftMove Couriers",
      type: "Same-Day Delivery",
      rating: 4.7,
      reviews: 156,
      coverage: "Regional",
      color: "from-green-400 to-green-600"
    },
    {
      id: 3,
      name: "GlobalShip Express",
      type: "International",
      rating: 4.8,
      reviews: 412,
      coverage: "Worldwide",
      color: "from-purple-400 to-purple-600"
    },
    {
      id: 4,
      name: "Urban Delivery Co",
      type: "Last-Mile",
      rating: 4.6,
      reviews: 203,
      coverage: "Metropolitan",
      color: "from-orange-400 to-orange-600"
    },
    {
      id: 5,
      name: "ColdChain Logistics",
      type: "Temperature Controlled",
      rating: 4.9,
      reviews: 178,
      coverage: "Continental",
      color: "from-cyan-400 to-cyan-600"
    },
    {
      id: 6,
      name: "HeavyLoad Transport",
      type: "Heavy Machinery",
      rating: 4.5,
      reviews: 94,
      coverage: "National",
      color: "from-red-400 to-red-600"
    }
  ];

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex justify-between w-full items-center">
              <div>
                <h1 className="text-2xl font-bold">Logistics Partners</h1>
                <p className="text-gray-600 mt-1">
                  Connect with reliable transport and delivery partners
                </p>
              </div>
              <div className="flex gap-2">
                <Field>
                  <Input type="text" placeholder="Search logistics..." />
                </Field>
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Carousel Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Featured Partners</h2>
              <div className="flex items-center justify-center">
                <Carousel className="w-[90%]">
                  <CarouselContent>
                    {transportPartners.slice(0, 4).map((partner) => (
                      <CarouselItem key={partner.id} className="basis-1/4">
                        <Link href={`/retailer/logistic-market/${partner.id}`}>
                          <Card className="h-40 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow">
                            <CardContent className="flex flex-col items-center justify-center w-full h-full p-4">
                              <p className="font-semibold text-center text-sm">
                                {partner.name}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {partner.type}
                              </Badge>
                            </CardContent>
                          </Card>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>

            {/* All Partners Grid */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                All Transport Partners
              </h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {transportPartners.map((partner) => (
                  <Link
                    key={partner.id}
                    href={`/retailer/logistic-market/${partner.id}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full p-4 gap-2">
                      <CardHeader className="pb-3 px-0">
                        <div
                          className={`h-12 w-12 bg-linear-to-br ${partner.color} rounded-lg mb-3`}
                        ></div>
                        <CardTitle className="text-base">
                          {partner.name}
                        </CardTitle>
                        <CardDescription>{partner.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 p-0">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(partner.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {partner.rating}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({partner.reviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {partner.coverage}
                        </div>
                        <Button size="sm" className="w-full mt-2">
                          <Truck className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogisticMarketPage;
