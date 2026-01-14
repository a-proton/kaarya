"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/contexts/UserContext";
import ProviderSidebar from "@/components/provider-navbar/providerSidebar";
import ProviderTopbar from "@/components/provider-navbar/providerTopbar";

interface ProviderLayoutProps {
  children: ReactNode;
}

export default function ProviderLayout({ children }: ProviderLayoutProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <div className="min-h-screen bg-neutral-50">
          {/* Left Sidebar */}
          <ProviderSidebar />

          {/* Main Content Area with left margin for sidebar */}
          <main className="ml-64">
            {/* Topbar */}
            <ProviderTopbar />

            {/* Page Content */}
            {children}
          </main>
        </div>
      </UserProvider>
    </QueryClientProvider>
  );
}
