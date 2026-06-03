"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-base-200 text-base-content pt-12 pb-6">
      <div className="container mx-auto px-4">
        {/* Brand - full width on mobile */}
        <div className="mb-8 text-center">
          <Image
            src="/whisper-responsive/icons8-chat-64.svg"
            alt="Whisper"
            width={40}
            height={40}
            className="mx-auto mb-3"
          />
          <p className="font-bold text-lg mb-1">Whisper</p>
          <p className="text-xs text-base-content/60 leading-relaxed max-w-xs mx-auto">
            Modern real-time messaging for everyone. Secure, fast, and
            beautifully designed.
          </p>
        </div>

        {/* 2x2 grid for links on mobile */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-4 text-center justify-center">
          {/* Product */}
          <div>
            <h6 className="font-semibold text-sm mb-2">Product</h6>
            <div className="flex flex-col gap-1.5">
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Features
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Pricing
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Security
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Changelog
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h6 className="font-semibold text-sm mb-2">Company</h6>
            <div className="flex flex-col gap-1.5">
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                About
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Blog
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Careers
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h6 className="font-semibold text-sm mb-2">Legal</h6>
            <div className="flex flex-col gap-1.5">
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Cookies
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h6 className="font-semibold text-sm mb-2">Social</h6>
            <div className="flex flex-col gap-1.5">
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Twitter
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                GitHub
              </Link>
              <Link
                href="#"
                className="text-xs text-base-content/60 hover:text-base-content"
              >
                Discord
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-base-300 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-base-content/40">
          <p>&copy; {new Date().getFullYear()} Whisper. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-base-content">
              Privacy
            </Link>
            <Link href="#" className="hover:text-base-content">
              Terms
            </Link>
            <Link href="#" className="hover:text-base-content">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
