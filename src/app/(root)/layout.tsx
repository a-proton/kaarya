// app/(root)/layout.tsx

"use client";

import { usePathname } from "next/navigation";
import Navbar from "../../components/navbar/navbar";
import Footer from "../../components/footer/footer";
import Chatbot from "@/components/Chatbot";
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFooterPage = pathname?.startsWith("/footer-pages");
  return (
    <>
      {!isFooterPage && <Navbar />}{" "}
      <main className="pt-[80px]">
        {children}
        <Chatbot />
      </main>
      {!isFooterPage && <Footer />}
    </>
  );
}
