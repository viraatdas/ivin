import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import "./globals.css";

export const metadata: Metadata = {
  title: "Journal — Think Better",
  description: "Think Better.",
  keywords: ["journal", "journaling", "mindfulness", "AI", "reflection", "mental health", "diary", "writing"],
  authors: [{ name: "Journal" }],
  creator: "Journal",
  metadataBase: new URL("https://journal.viraat.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://journal.viraat.dev",
    title: "Journal — Think Better",
    description: "Think Better.",
    siteName: "Journal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Journal — Think Better",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Journal — Think Better",
    description: "Think Better.",
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
