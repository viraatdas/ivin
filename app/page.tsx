"use client";

import Link from "next/link";
import { useUser } from "@stackframe/stack";
import Navbar from "@/components/Navbar";

export default function Home() {
  const user = useUser();

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl font-light tracking-tight mb-6">
            your thoughts,
            <br />
            <span className="font-serif italic">gently guided</span>
          </h1>
          
          <p className="text-lg font-light text-gray-500 mb-12 max-w-md mx-auto leading-relaxed">
            A mindful journaling space with AI-powered prompts to help you reflect, 
            process, and grow — one entry at a time.
          </p>

          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/journal"
                className="px-8 py-3 bg-black text-white text-sm font-light tracking-wide hover:bg-gray-800 transition-colors"
              >
                start writing
              </Link>
              <Link
                href="/history"
                className="px-8 py-3 border border-gray-200 text-sm font-light tracking-wide hover:border-gray-400 transition-colors"
              >
                view entries
              </Link>
            </div>
          ) : (
            <Link
              href="/handler/sign-in"
              className="inline-block px-8 py-3 bg-black text-white text-sm font-light tracking-wide hover:bg-gray-800 transition-colors"
            >
              begin your journal
            </Link>
          )}
        </div>

        <div className="absolute bottom-8 text-xs font-light text-gray-400">
          your entries are private and secure
        </div>
      </main>
    </>
  );
}
