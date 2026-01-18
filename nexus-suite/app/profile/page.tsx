"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BriefcaseBusiness,
  Cake,
  Calendar,
  Camera,
  Mail,
  Phone,
  Pin,
  SquarePen
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const Page = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h2 className="font-semibold text-lg">Profile Page</h2>
        <Button>Settings</Button>
      </div>
      <div className="mt-4">
        <div className="flex gap-4">
          <Card className="p-4 gap-2 w-1/3 flex flex-col items-center justify-center">
            <div className="flex justify-end w-full">
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogTrigger asChild>
                  <SquarePen className="w-5 h-5 cursor-pointer text-muted-foreground" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information here. Click save when
                      you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue="Laya Singh" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue="DIRECTOR" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue="laya@nats.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" defaultValue="+91 9876543210" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" defaultValue="Bangalore, India" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" type="number" defaultValue="22" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsEditDialogOpen(false)}>
                      Save changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="py-6 flex flex-col items-center">
              <Dialog
                open={isImageDialogOpen}
                onOpenChange={setIsImageDialogOpen}
              >
                <DialogTrigger asChild>
                  <div className="relative group cursor-pointer">
                    <Image
                      src={"signup-login.svg"}
                      alt="Profile Image"
                      width={100}
                      height={100}
                      className="rounded-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile Image</DialogTitle>
                    <DialogDescription>
                      Upload a new profile picture. Choose an image that
                      represents you well.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Image
                          src={"signup-login.svg"}
                          alt="Profile Image Preview"
                          width={150}
                          height={150}
                          className="rounded-full aspect-square object-cover"
                        />
                      </div>
                      <Input
                        id="picture"
                        type="file"
                        accept="image/*"
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsImageDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsImageDialogOpen(false)}>
                      Save Image
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-xl mt-3 font-bold">Laya Singh</p>
              <p className="text-muted-foreground">DIRECTOR</p>
            </div>
            <div className="w-full">
              <div className="bg-accent border border-solid flex justify-evenly border-muted-foreground/20 rounded-xl p-4 w-full">
                <div className="text-center">
                  <p className="text-lg font-semibold">3 M 2 D</p>
                  <p className="text-md">Experience</p>
                </div>

                <div className="h-full text-accent-foreground w-2"></div>
                <div className="text-center">
                  <p className="text-lg font-semibold">50</p>
                  <p className="text-md">Deliveries</p>
                </div>
              </div>
              <div className="mt-6 pl-2">
                <ul className="text-sm flex gap-3 flex-col font-medium">
                  <li className="flex gap-2">
                    <Mail className="w-5 h-5" />
                    <p>laya@nats.com</p>
                  </li>
                  <li className="flex gap-2">
                    <Phone className="w-5 h-5" />
                    <p>+91 9876543210</p>
                  </li>
                  <li className="flex gap-2">
                    <Pin className="w-5 h-5" />
                    <p>Location: Bangalore, India</p>
                  </li>
                  <li className="flex gap-2">
                    <Cake className="w-5 h-5" />
                    <p>22 years</p>
                  </li>
                  <li className="flex gap-2">
                    <Calendar className="w-5 h-5" />
                    <p>DOJ: 15th March 2020</p>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
          <Card className="p-4 gap-2 w-2/3 flex flex-col items-start ">
            <h2 className="text-lg font-semibold">Experience</h2>
            <div className="mt-2 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex flex-col items-center">
                  <div className="p-1 bg-accent w-7 h-7 flex items-center justify-center rounded-md z-10">
                    <BriefcaseBusiness className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="w-[2px] h-full bg-border absolute top-7"></div>
                </div>
                <div className="">
                  <p className="font-medium">Director at NATS Solutions</p>
                  <p className="text-sm text-muted-foreground">
                    March 2020 - Present
                  </p>
                  <p className="mt-2 text-sm">
                    Leading the company towards innovative solutions in the tech
                    industry. Overseeing multiple projects and ensuring client
                    satisfaction.
                  </p>
                  <Button variant="secondary" className="mt-2">
                    Download letter
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex flex-col items-center">
                  <div className="p-1 bg-accent w-7 h-7 flex items-center justify-center rounded-md z-10">
                    <BriefcaseBusiness className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="w-[2px] h-full bg-border absolute top-7"></div>
                </div>
                <div className="">
                  <p className="font-medium">Director at NATS Solutions</p>
                  <p className="text-sm text-muted-foreground">
                    March 2020 - Present
                  </p>
                  <p className="mt-2 text-sm">
                    Leading the company towards innovative solutions in the tech
                    industry. Overseeing multiple projects and ensuring client
                    satisfaction.
                  </p>
                  <Button variant="secondary" className="mt-2">
                    Download letter
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex flex-col items-center">
                  <div className="p-1 bg-accent w-7 h-7 flex items-center justify-center rounded-md z-10">
                    <BriefcaseBusiness className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="">
                  <p className="font-medium">Director at NATS Solutions</p>
                  <p className="text-sm text-muted-foreground">
                    March 2020 - Present
                  </p>
                  <p className="mt-2 text-sm">
                    Leading the company towards innovative solutions in the tech
                    industry. Overseeing multiple projects and ensuring client
                    satisfaction.
                  </p>
                  <Button variant="secondary" className="mt-2">
                    Download letter
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;
