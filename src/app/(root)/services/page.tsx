// src/app/services/page.tsx
import { Suspense } from "react";
import ServicesClient from "./ServicesClient";

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <ServicesClient />
    </Suspense>
  );
}
