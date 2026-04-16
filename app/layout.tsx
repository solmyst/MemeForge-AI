import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Meme Bhandar — AI Meme Generator | Desi + Global Memes",
  description: "The ultimate local AI meme generator. Desi brainrot, Bollywood roasts, IPL memes, and more. Powered by Llama 3.2 & Moondream. No data leaves your machine.",
  keywords: ["meme generator", "AI memes", "desi memes", "indian memes", "bollywood memes", "ipl memes", "meme bhandar", "local AI"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meme Bhandar",
  },
  openGraph: {
    title: "Meme Bhandar — AI Meme Generator",
    description: "Generate savage memes with AI. Desi brainrot, Bollywood roasts, IPL mode, and more.",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${inter.variable} font-sans bg-zinc-950 text-zinc-50`}>
        {children}
      </body>
    </html>
  );
}
