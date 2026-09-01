import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Provenance",
  description: "Tamper-evident credential-verification platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-surface text-primary antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
