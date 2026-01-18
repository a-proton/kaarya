"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getProvidersForListing } from "@/app/(root)/services/[slug]/_components/providerData";
import ServiceProviderCard from "@/components/cards/ServiceProviderCard";

export default function TopRatedProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopProviders();
  }, []);

  const loadTopProviders = async () => {
    setLoading(true);
    try {
      const data = await getProvidersForListing();
      // Take only the first 3 providers
      const topThree = data.slice(0, 3);
      setProviders(topThree);
    } catch (error) {
      console.error("Failed to load providers:", error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-neutral-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neutral-800">
              Top-Rated Providers in Your Area
            </h2>
            <p className="text-lg text-neutral-600">
              Connect with verified professionals near you
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-neutral-0">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neutral-800">
            Top-Rated Providers in Your Area
          </h2>
          <p className="text-lg text-neutral-600">
            Connect with verified professionals near you
          </p>
        </div>

        {providers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">
              No providers available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <ServiceProviderCard key={provider.id} {...provider} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
