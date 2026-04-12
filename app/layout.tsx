import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MemeForge AI - Local AI Meme Engine",
  description: "The ultimate local AI meme generator. Powered by MemeForge & Llama 3.1.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MemeForge AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50`}>{children}</body>
    </html>
  );
}
