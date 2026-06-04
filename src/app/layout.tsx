import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Channel analytics",
  description: "Private YouTube Studio analytics mockup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body>{children}</body>
    </html>
  );
}
