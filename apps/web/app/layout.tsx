import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GenWorkAI | Knowledge Operating System & AI Artifact Generation",
  description: "Transform any codebase, document collection, database schema, or website into an AI-ready Knowledge Base. Generate professional artifacts instantly.",
  keywords: ["Knowledge Operating System", "AI Artifact Generation", "MCP Servers", "AI Assistant", "Codebase Understanding"],
  authors: [{ name: "GenWorkAI Team" }],
  openGraph: {
    title: "GenWorkAI | The Next-Gen Knowledge OS",
    description: "Turn any project or document into a powerful Knowledge Base connected to AI.",
    url: "https://genwork.ai",
    siteName: "GenWorkAI",
    images: [
      {
        url: "https://genwork.ai/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GenWorkAI Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GenWorkAI | Knowledge OS",
    description: "Transform your data into powerful AI context.",
    images: ["https://genwork.ai/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-card text-zinc-900 dark:text-zinc-50 transition-colors`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
