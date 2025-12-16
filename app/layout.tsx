import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import "./globals.css";

export const metadata: Metadata = {
  title: "Journal — Your Mindful Space",
  description: "A beautiful, AI-powered journaling app with therapeutic prompts to help you reflect, process, and grow — one entry at a time.",
  keywords: ["journal", "journaling", "mindfulness", "AI", "reflection", "mental health", "diary", "writing"],
  authors: [{ name: "Journal App" }],
  creator: "Journal App",
  metadataBase: new URL("https://ivin-three.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ivin-three.vercel.app",
    title: "Journal — Your Mindful Space",
    description: "A beautiful, AI-powered journaling app with therapeutic prompts to help you reflect, process, and grow.",
    siteName: "Journal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Journal — Your Mindful Space",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Journal — Your Mindful Space",
    description: "A beautiful, AI-powered journaling app with therapeutic prompts to help you reflect, process, and grow.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
