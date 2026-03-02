import type { Metadata } from "next";
import { Outfit, Inter, Orbitron } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BFH Forge Dashboard",
  description: "Brave Frontier Heroes External API Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${outfit.variable} ${orbitron.variable} ${inter.variable} antialiased font-sans bg-slate-950 text-slate-50 min-h-screen`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
