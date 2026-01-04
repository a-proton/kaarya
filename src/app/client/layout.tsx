"use client";

import ClientSidebar from "../../components/client-navbar/clientSidebar";
import ClientTopbar from "../../components/client-navbar/clientTopbar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
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
  );
}
