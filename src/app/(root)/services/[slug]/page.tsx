// app/(root)/services/[slug]/page.tsx

import React from "react";
import ProfileHeader from "./_components/ProfileHeader";
import ProfileSidebar from "./_components/ProfileSidebar";
import AboutSection from "./_components/AboutSection";
import SpecializationsSection from "./_components/SpecializationSection";
import PortfolioSection from "./_components/PortfolioSection";
import ExperienceSection from "./_components/ExperienceSection";
import ReviewsSection from "./_components/ReviewSection";
import LicensesSection from "./_components/LicenseSection";
import { getProviderBySlug } from "./_components/providerData";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ServiceProviderProfile({ params }: PageProps) {
  // Await the params Promise
  const { slug } = await params;

  console.log("🔍 Page received slug:", slug); // ✅ Debug log

  // Check if slug is valid
  if (!slug || slug === "undefined") {
    console.error("❌ Invalid slug:", slug);
    notFound();
  }

  // Fetch provider data
  const provider = await getProviderBySlug(slug);

  // If provider not found, show 404
  if (!provider) {
    console.error("❌ Provider not found for slug:", slug);
    notFound();
  }

  console.log("✅ Provider loaded:", provider.name);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Profile Header */}
      <ProfileHeader provider={provider} />

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-8">
            <AboutSection provider={provider} />
            <SpecializationsSection provider={provider} />
            <PortfolioSection provider={provider} />
            <ExperienceSection provider={provider} />
            <ReviewsSection provider={provider} />
            <LicensesSection provider={provider} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:w-[380px]">
            <div className="lg:sticky lg:top-8 space-y-6">
              <ProfileSidebar provider={provider} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ IMPORTANT: Disable static generation during development
export const dynamic = "force-dynamic";
export const dynamicParams = true;

// Generate static params for all providers
export async function generateStaticParams() {
  console.log("📋 generateStaticParams called");

  try {
    const { getAllProviders } = await import("./_components/providerData");
    const providers = await getAllProviders();

    console.log("📦 Providers for static generation:", providers.length);

    // Filter out providers without slugs
    const validProviders = providers.filter(
      (p) => p.slug && p.slug !== "undefined",
    );

    console.log("✅ Valid providers with slugs:", validProviders.length);

    const params = validProviders.map((provider) => {
      console.log("  - Generating param for slug:", provider.slug);
      return {
        slug: provider.slug,
      };
    });

    return params;
  } catch (error) {
    console.error("❌ Error in generateStaticParams:", error);
    return []; // Return empty array if error occurs
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  try {
    const { slug } = await params;

    console.log("🏷️ generateMetadata called with slug:", slug);

    // Skip if slug is invalid
    if (!slug || slug === "undefined") {
      return {
        title: "Provider Not Found | Karya",
      };
    }

    const { getProviderBySlug } = await import("./_components/providerData");
    const provider = await getProviderBySlug(slug);

    if (!provider) {
      return {
        title: "Provider Not Found | Karya",
      };
    }

    return {
      title: `${provider.name} - ${provider.title} | Karya`,
      description:
        provider.about.paragraphs[0] ||
        `Professional ${provider.title} services`,
      keywords: `${provider.title}, ${provider.location}, ${provider.services.join(", ")}`,
    };
  } catch (error) {
    console.error("❌ Error in generateMetadata:", error);
    return {
      title: "Provider | Karya",
    };
  }
}
