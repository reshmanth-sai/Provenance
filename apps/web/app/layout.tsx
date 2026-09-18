import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E5F74",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://provenance.example.com"),
  title: {
    default: "Provenance | Cryptographic Credential Verification",
    template: "%s | Provenance",
  },
  description:
    "Tamper-evident, cryptographically verifiable institutional credentials and candidate profiles with per-issuer append-only hash chains.",
  keywords: [
    "credential verification",
    "tamper-evident",
    "cryptographic proofs",
    "hash chain",
    "academic records",
    "degree verification",
  ],
  authors: [{ name: "Provenance Trust Network" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Provenance",
    title: "Provenance | Cryptographic Credential Verification",
    description:
      "Tamper-evident, cryptographically verifiable institutional credentials and candidate profiles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Provenance | Cryptographic Credential Verification",
    description:
      "Tamper-evident, cryptographically verifiable institutional credentials and candidate profiles.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-surface text-primary antialiased min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
