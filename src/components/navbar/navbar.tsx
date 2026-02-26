"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="flex items-center justify-between h-20 gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-2xl font-bold text-[#1ab189] m-0 cursor-pointer">
                Kaarya
              </h1>
            </Link>
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-10 flex-1 justify-center">
            <Link
              href="/"
              className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189]"
            >
              Home
            </Link>
            <Link
              href="/services"
              className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189]"
            >
              Service Providers
            </Link>
            <Link
              href="/about"
              className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189]"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189]"
            >
              Contact
            </Link>
          </div>

          {/* Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <Link
              href="/login"
              className="bg-white text-[#1ab189] px-6 py-3 rounded-lg text-[0.9375rem] font-medium border-2 border-[#1ab189] transition-all duration-300 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,177,137,0.2)] active:translate-y-0 no-underline inline-block text-center"
            >
              Sign In
            </Link>
            <Link
              href="/join-provider"
              className="bg-[#1ab189] text-white px-6 py-3 rounded-lg text-[0.9375rem] font-medium transition-all duration-300 hover:bg-[#0d9563] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,177,137,0.3)] active:translate-y-0 no-underline inline-block text-center"
            >
              Join as Provider
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:text-[#1ab189] transition-colors duration-300"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-6 pt-2 border-t border-gray-200 mt-2">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189] py-2"
              >
                Home
              </Link>
              <Link
                href="/services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189] py-2"
              >
                Servic Providers
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189] py-2"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 no-underline text-[0.9375rem] font-medium transition-colors duration-300 hover:text-[#1ab189] py-2"
              >
                Contact
              </Link>

              {/* Mobile Buttons */}
              <div className="flex flex-col gap-3 mt-4">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-white text-[#1ab189] px-6 py-3 rounded-lg text-[0.9375rem] font-medium border-2 border-[#1ab189] transition-all duration-300 hover:bg-gray-50 w-full text-center no-underline focus:outline-none focus:ring-2 focus:ring-[#1ab189] focus:ring-offset-2 inline-block"
                >
                  Sign In
                </Link>
                <Link
                  href="/join-provider"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-[#1ab189] text-white px-6 py-3 rounded-lg text-[0.9375rem] font-medium transition-all duration-300 hover:bg-[#0d9563] w-full text-center no-underline focus:outline-none focus:ring-2 focus:ring-[#1ab189] focus:ring-offset-2 inline-block"
                >
                  Join as Provider
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
