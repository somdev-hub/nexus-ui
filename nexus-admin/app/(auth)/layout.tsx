"use client";

import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-4 w-screen">
      <div className="w-full max-w-full flex items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
}