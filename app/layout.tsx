import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Clause AI — Contract Intelligence Platform",
  description:
    "AI-powered contract analysis, loophole detection, and legal drafting platform",
  keywords: [
    "contract analysis",
    "AI legal",
    "loophole detection",
    "clause analysis",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} font-sans antialiased`}
        style={{ fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
