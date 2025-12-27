"use client";

import { SignupForm } from "@/components/signup-form";
import { useState } from "react";

export default function SignupPage() {
  /**
   * {
    "name": "Ram Singh",
    "email": "ram@gmail.com",
    "password": "ram@001",
    "phone": "7891040789",
    "address": "city 1, ayodhaya, 787890",
    "profilePhoto": ""
}
   */
  const [formValue, setFormValue] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });
  const [orgValue, setOrgValue] = useState({
    orgName: "",
    orgType: ""
  });
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm
          registration={formValue}
          setRegistration={setFormValue}
          organization={orgValue}
          setOrganization={setOrgValue}
        />
      </div>
    </div>
  );
}
