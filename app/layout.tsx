import type { Metadata } from "next";
import "./globals.css";
import "./account.css";

export const metadata: Metadata = {
  title: "LUMA — Everyday Beauty",
  description: "Feel-good skincare and lip care. Discover your everyday essentials at LUMA.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
