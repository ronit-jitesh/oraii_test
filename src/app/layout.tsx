import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ORAII — For Therapists",
  description: "AI clinical documentation for Indian therapists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lora.variable} antialiased`}
        style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif', backgroundColor: '#F7F5F0' }}
        suppressHydrationWarning
      >
        <NavbarWrapper />
        {children}
      </body>
    </html>
  );
}
