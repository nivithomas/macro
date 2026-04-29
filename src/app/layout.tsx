import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Macro Impact Analyzer",
  description: "See which stocks are impacted by macro trends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <nav className="border-b border-zinc-200 bg-white/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="text-zinc-900 font-semibold tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </span>
              Macro Impact
            </Link>
            <div className="flex items-center gap-1 ml-2">
              <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 px-3 py-1.5 rounded-md transition-colors">
                Analyze
              </Link>
              <Link href="/portfolios" className="text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 px-3 py-1.5 rounded-md transition-colors">
                Portfolios
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
