import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import Image from "next/image";

const page = () => {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="w-full">
            <div className="flex justify-between w-full">
              <h2 className="text-lg font-semibold">Suppliers</h2>
              <div className="flex gap-2">
                <Field>
                  <Input type="text" placeholder="Search suppliers..." />
                </Field>
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Carousel className="w-[90%]">
                <CarouselContent className="py-2">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <CarouselItem key={index} className="basis-1/7">
                      <Card className="h-35 w-35 flex items-center justify-center">
                        <p>Electronics</p>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="gap-0 w-[calc(20%-1rem)]">
                    <div className="relative">
                      <Image
                        src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D"
                        alt="Supplier Image"
                        width={300}
                        height={150}
                        className="rounded-t-md object-cover"
                      />
                      <p className="absolute bottom-2 text-sm left-2 text-white">
                        <b>Trust: </b>
                        ⭐⭐⭐⭐⭐
                      </p>
                    </div>
                    <div className="p-2">
                      <h2 className="font-semibold">ABC Electronics Co ltd.</h2>
                      <p className="text-sm text-muted-foreground">
                        Leading supplier of electronic components and devices.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <b>Based on: </b>
                        New York, USA
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <b>Exports: </b>
                        Chips, Resistors, Capacitors, Diodes, hardware devices,
                        testers, all kinds of electronic components.
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
