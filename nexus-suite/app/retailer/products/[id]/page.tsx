"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";

const page = () => {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="">
            <h1 className="leading-3 m-0 text-2xl font-bold">Mvn mobile</h1>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground flex gap-2">
              <li>
                <b>Published</b> :2023-10-15
              </li>
              <li>
                <b>Product code</b> : MVN-001
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            {/* edit and delete buttons */}
            <Button>
              {/* edit icon */}
              <IconEdit className="mr-2 size-4" />
              Edit
            </Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
          {/* Product Carousel Section */}
          <div className="w-1/3">
            <ProductCarousel />
          </div>
          {/* Product Details Section */}
          <div className="w-2/3 space-y-4">
            <Card>
              {/* description and keyfeatures */}
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-sm text-muted-foreground">
                  Mvn mobile is a leading retailer of mobile phones and
                  accessories, offering a wide range of products from top
                  brands. With a commitment to quality and customer
                  satisfaction, Mvn mobile provides the latest technology and
                  trends in the mobile industry.
                </p>
                <h2 className="text-lg font-semibold mb-2 mt-4">
                  Key Features
                </h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Wide selection of mobile phones and accessories</li>
                  <li>Competitive pricing and special offers</li>
                  <li>Expert customer service and support</li>
                  <li>Fast and reliable shipping options</li>
                </ul>

                <div className="mt-4">
                  <h2 className="text-lg font-semibold mb-2 mt-4">Materials</h2>
                  <div className="flex flex-col gap-2">
                    {["Aluminum", "Plastic", "Glass", "Steel"].map(
                      (material, index) => {
                        return (
                          <Card key={index}>
                            <div className="flex justify-between items-center p-4">
                              <div className="">
                                <h2 className="text-lg font-bold">
                                  {material}
                                </h2>
                                <ul className="flex gap-2 text-muted-foreground text-sm ">
                                  <li>
                                    <b>Available</b> : 166 units
                                  </li>
                                  <li>
                                    <b>Required</b> :{" "}
                                    <span className="text-red-600">
                                      200 units
                                    </span>
                                  </li>
                                </ul>
                              </div>
                              <div className="">
                                <Button>Action</Button>
                              </div>
                            </div>
                          </Card>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

// Product Carousel Component
const ProductCarousel = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [emblaApi, setEmblaApi] = useState<CarouselApi>(undefined);

  const productImages = [
    {
      id: 1,
      src: "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aW1hZ2V8ZW58MHx8MHx8fDA%3D",
      alt: "Black Sweatpants - Main View",
      thumbnail:
        "https://images.unsplash.com/photo-1506529905607-53e103a0265d?w=80&h=80&fit=crop"
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1560674457-12073ed6fae6?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FtfGVufDB8fDB8fHww",
      alt: "Red Baseball Cap",
      thumbnail:
        "https://images.unsplash.com/photo-1575428652377-a0ad6e19c1fd?w=80&h=80&fit=crop"
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop",
      alt: "Red Track Pants",
      thumbnail:
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=80&h=80&fit=crop"
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500&h=500&fit=crop",
      alt: "Gaming Controller",
      thumbnail:
        "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=80&h=80&fit=crop"
    }
  ];

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
    if (emblaApi) {
      emblaApi?.scrollTo(index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Product Image Carousel */}
      <div className="relative">
        <Carousel setApi={setEmblaApi} className="w-full">
          <CarouselContent>
            {productImages.map((image) => (
              <CarouselItem key={image.id}>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex justify-center gap-2">
        {productImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => handleThumbnailClick(index)}
            className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
              index === selectedImageIndex
                ? "border-primary ring-2 ring-primary/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default page;
