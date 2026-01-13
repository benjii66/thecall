"use client";

import { Suspense } from "react";
import { Navbar } from "./Navbar";

export function NavbarWrapper() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-[#05060b]" />}>
      <Navbar />
    </Suspense>
  );
}
