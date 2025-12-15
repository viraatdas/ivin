"use client";

import Link from "next/link";
import { useUser, UserButton } from "@stackframe/stack";

export default function Navbar() {
  const user = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-light tracking-wide">
          journal
        </Link>

        <div className="flex items-center gap-8">
          {user ? (
            <>
              <Link
                href="/journal"
                className="text-sm font-light text-gray-600 hover:text-black transition-colors"
              >
                write
              </Link>
              <Link
                href="/history"
                className="text-sm font-light text-gray-600 hover:text-black transition-colors"
              >
                entries
              </Link>
              <UserButton />
            </>
          ) : (
            <Link
              href="/handler/sign-in"
              className="text-sm font-light text-gray-600 hover:text-black transition-colors"
            >
              sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

