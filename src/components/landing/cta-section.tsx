// src/components/landing/cta-section.tsx
"use client";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 bg-primary-600">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="heading-2 mb-6 text-neutral-0">
            Ready to Get Started?
          </h2>
          <p className="body-large mb-8 text-neutral-0">
            Join thousands of satisfied clients and providers on Karya
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={"/services"}
              className="bg-neutral-0 text-primary border-2 border-neutral-0 px-8 py-3 rounded-lg font-medium
             transition-all duration-200 ease-out
             hover:bg-neutral-50 hover:-translate-y-0.5
             active:scale-95
             cursor-pointer"
            >
              Find a Provider
            </Link>

            <Link
              href={"/join-provider"}
              className="bg-transparent text-neutral-0 border-2 border-neutral-0 px-8 py-3 rounded-lg font-medium
             transition-all duration-200 ease-out
              hover:-translate-y-0.5
             active:scale-95
             cursor-pointer"
            >
              Become a Provider
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
