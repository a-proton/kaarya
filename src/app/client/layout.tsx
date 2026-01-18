"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ClientSidebar from "../../components/client-navbar/clientSidebar";
import ClientTopbar from "../../components/client-navbar/clientTopbar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Initialize QueryClient for TanStack Query
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 3,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-neutral-50">
        {/* Sidebar */}
        <ClientSidebar />

        {/* Main Content Area */}
        <div className="ml-64">
          {/* Topbar */}
          <ClientTopbar />

          {/* Page Content */}
          <main className="p-8">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
